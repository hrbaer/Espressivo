<script setup>
import { ref, onMounted, watch } from 'vue'
import SvgIcon from './SvgIcon.vue'
import { useRouter } from 'vue-router'
import navigation from '../libraries/navigation'

const navigationItems = Object.freeze([
    { id: 'welcome', name: 'Welcome', icon: 'IconHouse', hr: true },
    { id: 'repertoire', name: 'Repertoire', icon: 'IconMusicNoteList' },
    { id: 'score', name: 'Music Score', icon: 'IconQuarterNote' },
    { id: 'instrument', name: 'Instrument', icon: 'IconKeyboard', hr: true },
    { id: 'gamepad', name: 'Gamepad', icon: 'IconGamepad' },
    { id: 'conductor', name: 'Player', icon: 'IconConductor', hr: true },
    { id: 'notetable', name: 'Table Data', icon: 'IconTable' },
    { id: 'scoredata', name: 'Music Data', icon: 'IconTextDoc' },
    { id: 'logfile', name: 'Log File', icon: 'IconTextPadHeader', hr: true },
    { id: 'recordings', name: 'Recordings', icon: 'IconWaveform' },
])

const router = useRouter()
const currentNavigationItemId = ref('')

// Life cycle.
onMounted(() => {
    // Initially select the first navigation panel.
    // const path = navigationItems[0].id
    // currentNavigationItemId.value = path
    // router.push({ path: path })
})

watch(
    () => {
        return router.currentRoute.value
    },
    (currentRoute) => {
        currentNavigationItemId.value = path2id(currentRoute.path)
    },
    { immediate: true },
)

function path2id(path) {
    return path.substring(1 + path.lastIndexOf('/'))
}

function select(navigationItem) {
    return currentNavigationItemId.value === navigationItem.id ? 'selected' : ''
}

function selectNavigationItem(navigationItem) {
    currentNavigationItemId.value = navigationItem.id
    setLayout()
}

function setLayout() {
    navigation.setRootIndexOff(1)
    navigation.setRootIndexOn(2)
}
</script>

<template>
    <div class="navigation-panel">
        <nav class="list">
            <div
                v-for="navigationItem in navigationItems"
                :key="navigationItem.name"
                @click="selectNavigationItem(navigationItem)"
            >
                <RouterLink class="entry" :class="select(navigationItem)" :to="navigationItem.id">
                    <div class="nav-icon">
                        <SvgIcon class="nav-icon" :name="navigationItem.icon" />
                    </div>
                    <div class="nav-title">
                        {{ navigationItem.name }}
                    </div>
                </RouterLink>
                <hr v-if="navigationItem.hr" />
            </div>
        </nav>
    </div>
</template>

<style scoped>
.navigation-panel {
    grid-row: 2/3;
    grid-column: 1/2;
    position: var(--column-position);
    width: var(--column-width);
    height: 100%;
    overflow-x: hidden;
    overflow-y: scroll;
}

nav.list {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 1em;
}

a.entry {
    text-decoration: none;
    color: inherit;
    padding: 8px 12px 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    white-space: nowrap;
}

a.entry.selected {
    background: var(--accent-color);
    color: var(--vt-c-white-soft);
    border-radius: 7px;
}

div.nav-icon {
    min-width: 20px;
    width: 20px;
    height: 20px;
    margin-right: 10px;
}

div.nav-icon > svg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    overflow: hidden;
}

div.nav-title {
}

hr {
    margin-top: 5px;
    margin-bottom: 5px;
    opacity: 0.25;
}
</style>
