import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sharp from 'sharp';

// Forge Vite plugin injects these globals:
// - MAIN_WINDOW_VITE_DEV_SERVER_URL (dev mode)
// - MAIN_WINDOW_VITE_NAME (production mode)
/* global MAIN_WINDOW_VITE_DEV_SERVER_URL, MAIN_WINDOW_VITE_NAME */

// Simple concurrency limiter (replacement for p-limit).
function createLimiter(concurrency) {
    const max = Math.max(1, Math.min(16, Number(concurrency) || 4));
    let active = 0;
    const queue = [];

    const next = () => {
        if (active >= max) return;
        const job = queue.shift();
        if (!job) return;
        active += 1;
        job().finally(() => {
            active -= 1;
            next();
        });
    };

    return (fn) => new Promise((resolve, reject) => {
        queue.push(async () => {
            try {
                resolve(await fn());
            } catch (e) {
                reject(e);
            }
        });
        next();
    });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve a path that works in dev and in packaged app
function resolveAsset(relPath) {
    // When packaged, resources are under process.resourcesPath
    // In dev (forge start), process.cwd() can be something else, so anchor to the repo root.
    const devRoot = path.resolve(__dirname, '..');
    const base = app.isPackaged ? process.resourcesPath : devRoot;
    return path.join(base, relPath);
}

export function getIcon() {
    if (process.platform === 'darwin') {
        // Matches build.mac.icon
        return resolveAsset('icons/mac/icon.icns');
    }
    if (process.platform === 'win32') {
        // Matches build.win.icon
        return resolveAsset('icons/win/icon.ico');
    }
    // Linux
    // Matches build.linux.icon (you can point to a directory or a single PNG)
    return resolveAsset('icons/png/1024x1024.png');
}

function setMacDockIcon(iconPath) {
    if (process.platform !== 'darwin') return;

    app.whenReady().then(() => {
        if (app.dock && typeof app.dock.setIcon === 'function') {
            try {
                app.dock.setIcon(iconPath);
            } catch (e) {
                console.log('Failed to set Dock icon:', e?.message || e);
            }
        }
    });
}


let mainWindow;

function createWindow() {
    const icon = getIcon();
    setMacDockIcon(icon);

    const preloadPath = path.join(__dirname, 'preload.cjs');
    console.log('[main] Preload path:', preloadPath);

    mainWindow = new BrowserWindow({
        icon,
        resizable: true,
        movable: true,
        backgroundColor: '#0b1020',
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // Try disabling sandbox if IPC is failing
        }
    });

    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
        console.log('[main] did-fail-load', { code, desc, url });
    });

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('[main] Renderer loaded successfully');
    });

    // In development, use the Vite dev server
    // In production, load the built renderer from dist folder
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        console.log('[main] Loading from dev server:', MAIN_WINDOW_VITE_DEV_SERVER_URL);
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        // Production: Load from dist folder
        // main.cjs is in .vite/build/, so we need to go up two levels to get to app root where dist is
        console.log('[main] Loading from packaged dist folder');
        const distPath = path.join(__dirname, '../../dist/index.html');
        console.log('[main] Dist path:', distPath);
        mainWindow.loadFile(distPath);
        // Enable DevTools in production for debugging
        //mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.bmp', '.gif', '.avif']);
const isImageFile = (file) => IMAGE_EXTS.has(path.extname(file).toLowerCase());

ipcMain.handle('pick-folder', async () => {
    const res = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory']
    });
    if (res.canceled || !res.filePaths?.[0]) return null;
    return res.filePaths[0];
});

ipcMain.handle('trim-images', async (evt, payload) => {
    const { inputDir, mode, concurrency = 4, threshold = 0 } = payload;
    if (!inputDir) throw new Error('No input directory provided');

    let entries;
    try {
        entries = await fs.promises.readdir(inputDir, { withFileTypes: true });
    } catch (e) {
        throw new Error(`Failed to read directory: ${e.message}`);
    }

    const files = entries.filter(d => d.isFile()).map(d => d.name).filter(isImageFile);
    const total = files.length;

    if (total === 0) {
        return { processed: 0, skipped: 0, outputDir: mode === 'subfolder' ? null : inputDir, errors: [] };
    }

    let outputDir = inputDir;
    if (mode === 'subfolder') {
        const ts = new Date();
        const timestamp = [
            ts.getFullYear(),
            String(ts.getMonth() + 1).padStart(2, '0'),
            String(ts.getDate()).padStart(2, '0')
        ].join('') + '-' + [
            String(ts.getHours()).padStart(2, '0'),
            String(ts.getMinutes()).padStart(2, '0'),
            String(ts.getSeconds()).padStart(2, '0')
        ].join('');
        outputDir = path.join(inputDir, `resized-${timestamp}`);
        await fs.promises.mkdir(outputDir, { recursive: true });
    }

    let processed = 0;
    let skipped = 0;
    const errors = [];

    // Emit initial progress
    mainWindow?.webContents.send('progress:update', { total, done: 0, currentFile: null });

    const limit = createLimiter(concurrency);

    const tasks = files.map((name) =>
        limit(async () => {
            const inputPath = path.join(inputDir, name);
            const outPath = mode === 'overwrite' ? inputPath : path.join(outputDir, name);

            // Inform UI about current file starting (optional granular update)
            mainWindow?.webContents.send('progress:update', { total, done: processed + skipped, currentFile: name });

            try {
                const image = sharp(inputPath, { failOn: 'none' });
                const pipeline = threshold ? image.trim(threshold) : image.trim();

                const tempOut = outPath + '.tmp';
                await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
                await pipeline.toFile(tempOut);
                await fs.promises.rename(tempOut, outPath);

                processed += 1;
            } catch (err) {
                skipped += 1;
                errors.push({ file: name, message: err?.message || String(err) });
                try { await fs.promises.unlink(outPath + '.tmp'); } catch {}
            } finally {
                // Emit progress after each file completes
                mainWindow?.webContents.send('progress:update', {
                    total,
                    done: processed + skipped,
                    currentFile: null
                });
            }
        })
    );

    await Promise.all(tasks);

    return { processed, skipped, outputDir, errors };
});
