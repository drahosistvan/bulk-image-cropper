// Electron Forge configuration with Vite + Sharp native module handling
// Removed AppImage & RPM makers to avoid missing package errors
import { VitePlugin } from '@electron-forge/plugin-vite';
import path from 'path';

export default async () => {
  const platform = process.platform; // 'darwin' | 'win32' | 'linux'
  let icon;
  if (platform === 'darwin') icon = path.resolve('icons/mac/icon.icns');
  else if (platform === 'win32') icon = path.resolve('icons/win/icon.ico');
  else icon = path.resolve('icons/png/1024x1024.png');

  return {
    packagerConfig: {
      asar: true,
      appBundleId: 'com.company.image-trimmer',
      name: 'Image Trimmer',
      icon,
      asarUnpack: ['**/node_modules/sharp/**/*'],
      executableName: 'image-trimmer'
    },
    rebuildConfig: {},
    // Makers removed to avoid missing package errors; use `npm run package` for internal distribution.
    makers: [],
    publishers: [],
    plugins: [
      new VitePlugin({
        renderer: {
          configFile: 'vite.config.ts',
          entryPoints: [{
            name: 'main_window',
            html: 'index.html',
            js: 'src/main.ts',
            preload: { js: 'electron/preload.js' }
          }]
        },
        main: {
          entry: 'electron/main.js',
          viteConfig: {
            build: {
              rollupOptions: { external: ['sharp', 'p-limit'] }
            }
          }
        },
        preload: { input: 'electron/preload.js' }
      })
    ]
  };
};
