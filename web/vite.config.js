import { createReadStream, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../data');

function serveDataPlugin() {
  return {
    name: 'serve-data',
    configureServer(server) {
      server.middlewares.use('/data', (req, res, next) => {
        const rel = decodeURIComponent(req.url?.split('?')[0] ?? '/');
        const filePath = resolve(dataDir, '.' + rel);
        if (!filePath.startsWith(dataDir) || !existsSync(filePath)) {
          next();
          return;
        }
        createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  base: './',
  root: __dirname,
  plugins: [
    serveDataPlugin(),
    viteStaticCopy({
      targets: [
        { src: normalizePath('../data/athletes.json'), dest: '.' },
        { src: normalizePath('../data/matches/*'), dest: '.' },
      ],
    }),
  ],
  server: {
    fs: { allow: [resolve(__dirname, '..')] },
  },
});
