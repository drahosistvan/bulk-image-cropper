// Electron Forge configuration with Vite + Sharp native module handling
import { VitePlugin } from '@electron-forge/plugin-vite';
import { MakerZIP } from '@electron-forge/maker-zip';
import { PublisherGithub } from '@electron-forge/publisher-github';
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
    makers: [
      new MakerZIP({}, ['darwin', 'linux', 'win32'])
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
          {
            entry: 'electron/main.js',
            config: 'vite.main.config.ts'
          },
          {
            entry: 'electron/preload.js',
            config: 'vite.preload.config.ts'
          }
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.config.ts'
          }
        ]
      })
    ]
  };
};
