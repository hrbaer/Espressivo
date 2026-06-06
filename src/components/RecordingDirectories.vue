<script setup>
import FolderIcon from './icons/IconFolder.vue'
import { onMounted, onUnmounted, ref } from 'vue'
import navigation from '../libraries/navigation'

const emit = defineEmits(['select-directory'])
const playlist = ref([])
const selectedDirectory = ref({})

onMounted(() => {
    window.addEventListener('newplaylist', playlistLoaded)
    navigation.setViewLayout('1fr', '1fr', '1fr')
})

onUnmounted(() => {
    window.addEventListener('newplaylist', playlistLoaded)
})

function setLayout() {
    navigation.setRootIndexOff(2)
    navigation.setRootIndexOn(3)
}

function playlistLoaded(event) {
    playlist.value = event.detail.playlist
}

function select(directory) {
    return selectedDirectory.value == directory ? 'selected' : ''
}

function selectDirectory(directory) {
    selectedDirectory.value = directory
    emit('select-directory', directory)
    setLayout()
}

function playNext() {
    console.log(playNext)
}
</script>

<template>
    <div class="directories">
        <div class="list">
            <div
                class="entry"
                v-for="entry in playlist.entries"
                :key="entry.index"
                :class="select(entry)"
                @click="selectDirectory(entry)"
            >
                <span class="icon">
                    <FolderIcon />
                </span>
                {{ entry.title }}
            </div>
        </div>
    </div>
</template>

<!--
When a <style> tag has the scoped attribute, its CSS
will apply to elements of the current component only
-->
<style scoped>
.directories {
    position: var(--column-position);
    height: 100%;
    overflow-y: scroll;
    width: var(--column-width);
    background-color: var(--color-background);
}

div.list {
    box-sizing: border-box;
    padding: 1em;
}

div.entry {
    cursor: pointer;
    padding-left: 1em;
    padding-right: 1em;
    display: flex;
    align-items: first baseline;
}

div.sticky {
    position: sticky;
    top: 0;
    border-radius: 7px;
    backdrop-filter: blur(6px);
    background-color: rgba(128, 128, 128, 0.1);
}

div.entry.selected {
    background: var(--accent-color);
    color: var(--vt-c-white-soft) !important;
    border-radius: 7px;
}

.icon > svg {
    height: 14px;
    padding-right: 7px;
    display: inline-block;
}

div.em {
    background-color: rgba(128, 128, 128, 0.1);
    border-radius: 5px;
    margin-bottom: 5px;
}
</style>
