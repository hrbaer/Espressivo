<script setup>
import { useRouter } from 'vue-router'
import { inject, computed, onMounted } from 'vue'
import SvgIcon from './SvgIcon.vue'
import navigation from '../libraries/navigation'

const midiIO = inject('midiIO')
const router = useRouter()

const version = import.meta.env.VITE_API_ESPRESSIVO_VERSION
const date = import.meta.env.VITE_API_ESPRESSIVO_DATE

onMounted(() => {
    navigation.setViewLayout('2fr', '1fr', '1fr')
})

function setRoute(route) {
    console.log('route', route)
    router.push({ path: route })
}

const hasGamepad = computed(() => {
    return navigator.getGamepads != null
})

const hasInputDevices = computed(() => {
    return window.navigator.hid != null
})

const hasMotionSensor = computed(() => {
    // return 'Accelerometer' in window
    // return window.DeviceMotionEvent != null
    return typeof window.DeviceMotionEvent !== 'undefined'
    // return typeof window.Accelerometer === 'function'
})
</script>

<template>
    <div class="scroller">
        <div class="panel">
            <div>Welcome to</div>
            <div class="lettering-container">
                <SvgIcon name="IconEspressivoLettering" class="lettering-icon" />
            </div>
            <div>Control the performance of your musical scores with the help of a gamepad.</div>
            <ol>
                <li><a @click="setRoute('instrument')">Connect a MIDI player</a></li>
                <li><a @click="setRoute('gamepad')">Connect a gamepad</a></li>
                <li><a @click="setRoute('repertoire')">Choose and run a digital score</a></li>
            </ol>
            <h3>Browser Support</h3>
            <ul>
                <template v-if="midiIO.hasMidi">
                    <li class="info">MIDI is available.</li>
                </template>
                <template v-else>
                    <li class="warn">This browser does not support MIDI devices.</li>
                </template>
                <template v-if="hasGamepad">
                    <li class="info">Gamepads are supported.</li>
                </template>
                <template v-else>
                    <li class="warn">This browser does not support Gamepads.</li>
                </template>
                <template v-if="hasInputDevices">
                    <li class="info">Input devices are supported.</li>
                </template>
                <template v-else>
                    <li class="warn">Input devices are not supported.</li>
                </template>
                <template v-if="hasMotionSensor">
                    <li class="info">This device has a motion sensor.</li>
                </template>
                <template v-else>
                    <li class="warn">This device has no motion sensor.</li>
                </template>
            </ul>
            <h3>Links</h3>
            <div>
                Website about the
                <a href="https://www.ursamedia.ch" target="_blank">Espressivo project.</a>
            </div>
            <div>
                <a href="https://musescore.com/user/36715654" target="_blank">MuseScore</a>
                contributions.
            </div>
            <div>
                <a href="https://apps.apple.com/app/midiweb-browser/id6757226617" target="_blank"
                    >MIDIWeb Browser</a
                >
                for Apple devices.
            </div>
            <div><em>Espressivo</em> is also available for macOS and iOS.</div>
            <a href="https://apple.co/45aHzAL" target="_blank">
                <img
                    alt="App Store"
                    class="download"
                    src="@/assets/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg"
                />
            </a>
            <p>
                Current version : {{ version }}
                <br />
                Last update: {{ date }}
            </p>

            <p>©2026<span class="name">H. R. Baer</span></p>
        </div>
    </div>
</template>

<style scoped>
div.scroller {
    position: var(--column-position);
    overflow-y: scroll;
    overflow-x: hidden;
    width: var(--column-width);
    height: 100%;
    background-color: var(--color-background);
}

div.panel {
    padding: 1em;
}

div.lettering-container {
    width: 60%;
}

li.info {
    color: green;
}

li.warn {
    color: red;
}

img.download {
    margin: 1em;
    cursor: pointer;
}

a {
    text-decoration: none;
    color: var(--accent-color);
    cursor: pointer;
}

span.name {
    margin-left: 0.6em;
}
</style>
