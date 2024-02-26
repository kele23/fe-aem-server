import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    root: path.resolve(__dirname),
    server: {
        watch: {
            ignored: '**/*.html',
        },
    },
    build: {
        // generate .vite/manifest.json in outDir
        manifest: true,
        ssr: true,
        write: true,
        rollupOptions: {
            // overwrite default .html entry
            input: [path.resolve(__dirname, './index.js')],
        },
    },
});
