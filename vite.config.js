import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import faviconPlugin from 'vite-plugin-favicon-generator'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        faviconPlugin({
            source: 'src/assets/EspressivoIcon.png',
            appName: 'Espressivo App',
            appShortName: 'Espressivo',
            appDescription:
                'Control the performance of your musical scores with the help of a gamepad.',
            developerName: 'H. R.  Baer',
            developerURL: 'https://www.ursamedia.ch',
            theme_color: '#4fc08d',
            background: '#ffffff',
            start_url: '/apps/espressivo/',
        }),
        vueDevTools(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 8888,
        open: true,
    },
    base: '/apps/espressivo/',
})
