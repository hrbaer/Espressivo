<script setup>
const props = defineProps({ minKey: Number, maxKey: Number })

import { onMounted, reactive, watch, inject } from 'vue'

const player = inject('player')

const keys = reactive([])

const emit = defineEmits(['play-note', 'stop-note'])

var touchEnabled = false

onMounted(() => {
    initializeKyboard()
})

watch(
    () => player.value.playingNotes,
    (playingNotes) => {
        showPlayingKeys(playingNotes)
    },
    { deep: true },
)

// Shows the playing keys
function showPlayingKeys(playingNotes) {
    // Clear all keys
    keys.forEach((key) => {
        key.playing = false
    })
    // Mark the playing keys
    playingNotes.forEach((note) => {
        keys[midiToIndex(note.midi)].playing = true
    })
}

// Initializes the keyboard.
function initializeKyboard() {
    const blackKeys = [1, 3, 6, 8, 10]
    for (let i = props.minKey; i <= props.maxKey; i++) {
        const black = blackKeys.includes(i % 12) ? true : false
        keys.push({ midi: i, black: black, playing: false })
    }
}

// Converts midi values to key indices.
function midiToIndex(midi) {
    return midi - props.minKey
}

// Calculates the velocity.
function getVelocity(event) {
    const position = event.offsetY
    const range = event.target.clientHeight
    return (127 * position) / range
}

// Handles key press events.
function pressKey(event, index) {
    const velocity = getVelocity(event)
    playNote(props.minKey + index, velocity)
}

// Handles key release events.
function releaseKey(event, index) {
    stopNote(props.minKey + index)
}

// Plays a note.
function playNote(midi, velocity) {
    keys[midiToIndex(midi)].playing = true
    emit('play-note', midi, velocity, 0)
}

// Stops a playing note.
function stopNote(midi) {
    keys[midiToIndex(midi)].playing = false
    emit('stop-note', midi, 0)
}

// Handles touch events.
function touchKey(event, index) {
    if (touchEnabled) {
        pressKey(event, index)
    }
}

// Handles untouch events.
function untouchKey(event, index) {
    if (touchEnabled) {
        releaseKey(event, index)
    }
}

// Double clicks enable touch events.
function dblClickKey() {
    touchEnabled = !touchEnabled
}

// Maps keyboard keys to midi pitch values.
function keyToMidi(key) {
    let midi = -1
    switch (key) {
        case 65:
            midi = 60
            break
        case 87:
            midi = 61
            break
        case 83:
            midi = 62
            break
        case 69:
            midi = 63
            break
        case 68:
            midi = 64
            break
        case 70:
            midi = 65
            break
        case 84:
            midi = 66
            break
        case 71:
            midi = 67
            break
        case 90:
            midi = 68
            break
        case 72:
            midi = 69
            break
        case 85:
            midi = 70
            break
        case 74:
            midi = 71
            break
        case 75:
            midi = 72
            break
        case 79:
            midi = 73
            break
        case 76:
            midi = 74
            break
        case 80:
            midi = 75
            break
    }
    return midi
}

// Plays a key.
function playKey(event) {
    if (event.repeat == true) {
        return
    }
    const midi = keyToMidi(event.keyCode)
    if (midi != -1) {
        playNote(midi, 64, 0)
    }
}

// Stops playing a key.
function stopKey(event) {
    const midi = keyToMidi(event.keyCode)
    if (midi != -1) {
        stopNote(midi, 0)
    }
}
</script>

<template>
    <div class="piano-keyboard" tabindex="0" @keydown="playKey($event)" @keyup="stopKey($event)">
        <div
            v-for="(key, index) in keys"
            class="key"
            :key="index"
            :class="[key.black ? 'black' : 'white', key.playing ? 'highlight' : '']"
            @mousedown="pressKey($event, index)"
            @mouseup="releaseKey($event, index)"
            @mouseenter="touchKey($event, index)"
            @mouseleave="untouchKey($event, index)"
            @dblclick="dblClickKey()"
        ></div>
    </div>
</template>

<style scoped>
div.piano-keyboard {
    box-sizing: border-box;
    width: 100%;
    aspect-ratio: 10 / 1;
    display: grid;
    background-color: var(--accent-color);
    border: 0.3px solid rgb(127, 127, 127);
    border-radius: 5px;
    grid-template-rows: repeat(1, auto);
    grid-auto-flow: column;
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
}

div.key {
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
}

div.key.black {
    background-color: var(--color-black-key);
}

div.key.white {
    background-color: var(--color-white-key);
    border: 1px solid rgba(127, 127, 127, 0.5);
}

div.key:hover {
    filter: opacity(0.5);
}

div.key.highlight {
    filter: opacity(0.5);
}
</style>
