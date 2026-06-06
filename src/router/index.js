import { createRouter, createWebHistory } from 'vue-router'
import WelcomeView from '../views/WelcomeView.vue'

// Not found: 404
// See: https://router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations

const router = createRouter({
    history: createWebHistory('/apps/espressivo'),
    // history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            redirect: '/welcome',
        },
        {
            path: '/welcome',
            name: 'Welcome',
            component: WelcomeView,
        },
        {
            path: '/repertoire',
            name: 'Repertoire',
            component: () => import('../views/RepertoireView.vue'),
        },
        {
            path: '/score',
            name: 'Score',
            component: () => import('../views/ScoreView.vue'),
        },
        {
            path: '/instrument',
            name: 'Instrument',
            component: () => import('../views/MidiInstrumentView.vue'),
        },
        {
            path: '/gamepad',
            name: 'Gamepad',
            // route level code-splitting
            // this generates a separate chunk (About.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import('../views/GamepadView.vue'),
        },
        {
            path: '/conductor',
            name: 'Conductor',
            component: () => import('../views/ConductorView.vue'),
        },
        {
            path: '/notetable',
            name: 'Notetable',
            component: () => import('../views/NotetableView.vue'),
        },
        {
            path: '/scoredata',
            name: 'Score Data',
            component: () => import('../views/ScoreDataView.vue'),
        },
        {
            path: '/logfile',
            name: 'Log File',
            component: () => import('../views/LogFileView.vue'),
        },
        {
            path: '/recordings',
            name: 'Recordings',
            component: () => import('../views/RecordingsView.vue'),
        },
        {
            path: '/:pathMatch(.*)*',
            name: '404',
            component: () => import('../views/ErrorView404.vue'),
        },
    ],
})

export default router
