<script setup>
import RecordingDirectories from '../components/RecordingDirectories.vue'
import RecordingTitles from '../components/RecordingTitles.vue'
import RecordingReferences from '../components/RecordingReferences.vue'
import { loadPlaylist } from '../libraries/Playlist.js'
import { onMounted, ref } from 'vue'

const playlistUrl = 'https://music.ursamedia.ch/espressivo/index.m3u'
const selectedTitle = ref({})
const coverUrl = ref('')

onMounted(() => {
    loadPlaylist(playlistUrl, 'newplaylist')
})

function selectDirectory(directory) {
    loadPlaylist(directory.url, 'newtitles')
}

function selectTitle(title) {
    selectedTitle.value = title
    playTitle(title.url)
}

function setCoverUrl(url) {
    console.log(url)
    coverUrl.value = url
}

function playTitle(url) {
    const audio = document.getElementById('audio')
    audio.src = url
    audio.play()
}

function playNext() {
    window.dispatchEvent(new CustomEvent('playnext'))
}
</script>

<template>
    <RecordingDirectories class="recording-directories" @select-directory="selectDirectory" />
    <RecordingTitles
        class="recording-titles"
        @select-Title="selectTitle"
        @set-cover-url="setCoverUrl"
    />
    <RecordingReferences class="recording-references" :cover-url="coverUrl" />
    <div class="player">
        <audio id="audio" controls="controls" :onended="playNext"></audio>
    </div>
</template>

<style scoped>
.recording-directories {
    grid-row: 2/3;
    grid-column: 2/3;
}

.recording-titles {
    grid-row: 2/3;
    grid-column: 3/4;
}

.recording-references {
    grid-row: 2/3;
    grid-column: 4/5;
}

div.hide-toolbar {
    grid-row: 1/2;
    grid-column: 2/4;
    background: var(--color-background);
    opacity: 0.8;
}

div.player {
    grid-row: 3/4;
    grid-column: 2/4;
    width: 100%;
}

audio {
    box-sizing: border-box;
    overflow: hidden;
    width: 100%;
    padding-left: 1em;
    padding-right: 1em;
}
</style>
