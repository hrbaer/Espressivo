<script setup>
import DocumentIcon from './icons/IconDocument.vue'
import { formatTime, totalPlayTime } from '../libraries/Playlist.js'
import { onMounted, onUnmounted, computed, ref } from 'vue'
import * as URI from 'uri-js'

const emit = defineEmits(['select-title', 'set-cover-url'])
const playlist = ref({})
const selectedTitle = ref({})

onMounted(() => {
    window.addEventListener('newtitles', playlistLoaded)
    window.addEventListener('playnext', playNextHandler)
})

onUnmounted(() => {
    window.addEventListener('newtitles', playlistLoaded)
    window.addEventListener('playnext', playNextHandler)
})

const totalTime = computed(() => {
    return totalPlayTime(playlist.value.entries)
})

function playlistLoaded(event) {
    playlist.value = event.detail.playlist
    setCoverUrl(playlist.value, event.detail.url)
}

function playNextHandler() {
    const index = playlist.value.entries?.findIndex((entry) => {
        return selectedTitle.value.index == entry.index
    })
    if (index >= 0) {
        const title = playlist.value.entries?.[index + 1]
        if (title != null) {
            selectTitle(title)
        }
    }
    console.log('index', index)
}

function select(title) {
    return selectedTitle.value == title ? 'selected' : ''
}

function selectTitle(title) {
    selectedTitle.value = title
    emit('select-title', title)
}

function setCoverUrl(playlist, url) {
    let coverURL = playlist.entries[0].coverURL
    if (coverURL != null) {
        coverURL = URI.resolve(url, coverURL)
        emit('set-cover-url', coverURL)
    }
}
</script>

<template>
    <div class="titles">
        <div class="list">
            <div
                class="entry"
                v-for="entry in playlist.entries"
                :key="entry.index"
                :class="select(entry)"
                @click="selectTitle(entry)"
            >
                <span class="icon">
                    <DocumentIcon />
                </span>
                <span>{{ entry.title }}</span>
                <span class="time">{{ formatTime(entry.time) }}</span>
            </div>
            <div v-if="playlist.entries != null" class="entry sticky">
                <span>Total recording time</span>
                <span class="time">{{ formatTime(totalTime) }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.titles {
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

span.time {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
}

div.sticky {
    position: sticky;
    margin-top: 7px;
    bottom: 0;
}
</style>
