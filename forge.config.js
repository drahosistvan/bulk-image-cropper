// forge.config.js (ESM)
import { VitePlugin } from '@electron-forge/plugin-vite';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { PublisherGithub } from '@electron-forge/publisher-github';
import path from 'path';
import fs from 'fs';

export default {
    packagerConfig: {
        asar: {
            unpack: '*.{node,dll,dylib,so}'  // Only unpack native binaries, keep everything else in ASAR
        },
        appBundleId: 'com.company.image-trimmer',
        name: 'Image Trimmer',
        icon: process.platform === 'darwin'
            ? path.resolve('icons/mac/icon.icns')
            : process.platform === 'win32'
            ? path.resolve('icons/win/icon.ico')
            : path.resolve('icons/png/1024x1024.png'),
        executableName: 'image-trimmer',
        osxSign: false
    },
    hooks: {
        packageAfterCopy: async (config, buildPath) => {
            console.log('[packageAfterCopy] Ensuring sharp and ALL its dependencies are present...');
            const targetNodeModules = path.join(buildPath, 'node_modules');

            // Ensure node_modules directory exists
            if (!fs.existsSync(targetNodeModules)) {
                console.log('[packageAfterCopy] Creating node_modules directory');
                fs.mkdirSync(targetNodeModules, { recursive: true });
            }

            // Get all Sharp dependencies recursively
            const sourceNodeModules = path.resolve('node_modules');
            const packagesToCopy = new Set([
                'sharp',
                'detect-libc',
                'color',
                'color-string',
                'color-name',
                'color-convert',
                'semver',
                'simple-swizzle',
                'is-arrayish'
            ]);

            // Add ALL @img packages (sharp-darwin-arm64, sharp-libvips-darwin-arm64, etc.)
            const imgDir = path.join(sourceNodeModules, '@img');
            if (fs.existsSync(imgDir)) {
                const imgPackages = fs.readdirSync(imgDir);
                imgPackages.forEach(pkg => packagesToCopy.add(`@img/${pkg}`));
            }

            // Add any package that sharp requires
            const sharpPackageJson = JSON.parse(
                fs.readFileSync(path.join(sourceNodeModules, 'sharp', 'package.json'), 'utf8')
            );

            if (sharpPackageJson.dependencies) {
                Object.keys(sharpPackageJson.dependencies).forEach(dep => packagesToCopy.add(dep));
            }
            if (sharpPackageJson.optionalDependencies) {
                Object.keys(sharpPackageJson.optionalDependencies).forEach(dep => packagesToCopy.add(dep));
            }

            console.log(`[packageAfterCopy] Copying ${packagesToCopy.size} packages...`);

            for (const pkg of packagesToCopy) {
                const target = path.join(targetNodeModules, pkg);
                if (!fs.existsSync(target)) {
                    const source = path.join(sourceNodeModules, pkg);
                    if (fs.existsSync(source)) {
                        await fs.promises.cp(source, target, { recursive: true });
                    }
                }
            }

            // Copy the renderer dist folder
            const distSource = path.resolve('dist');
            const distTarget = path.join(buildPath, 'dist');
            if (fs.existsSync(distSource) && !fs.existsSync(distTarget)) {
                console.log('[packageAfterCopy] Copying dist folder...');
                await fs.promises.cp(distSource, distTarget, { recursive: true });
            }

            console.log('[packageAfterCopy] Sharp and all dependencies verified');
        }
    },
    rebuildConfig: {},
    makers: [
        new MakerZIP({}, ['win32']),
        new MakerDMG(
            {
                name: 'Image Trimmer',
                icon: path.resolve('icons/mac/icon.icns')
            },
            ['darwin']
        )
    ],
    publishers: [
        new PublisherGithub({
            repository: {
                owner: 'drahosistvan',
                name: 'bulk-image-cropper'
            },
            prerelease: false,
            draft: true
        })
    ],
    plugins: [
        new VitePlugin({
            build: [
                { entry: 'electron/main.js', config: 'vite.main.config.ts' },
                { entry: 'electron/preload.js', config: 'vite.preload.config.ts' }
            ],
            renderer: [
                { name: 'main_window', config: 'vite.config.ts' }
            ]
        })
    ]
};
