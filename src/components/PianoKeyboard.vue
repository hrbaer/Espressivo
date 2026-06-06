<script setup>
const props = defineProps({ minKey: Number, maxKey: Number })

import { inject } from 'vue'

const player = inject('player')

const keys = Array.from({ length: props.maxKey - props.minKey + 1 })
const blackKeys = [1, 3, 6, 8, 10]

const emit = defineEmits(['play-note', 'stop-note'])

var touchEnabled = false

function isPlaying(midi) {
    return (
        player.value.playingNotes.findIndex((note) => {
            return midi == note.midi
        }) != -1
    )
}

function getKeyClass(index) {
    const midi = index + props.minKey
    const note = midi % 12
    let color = blackKeys.includes(note) ? 'black' : 'white'
    if (isPlaying(midi)) {
        color = color + ' highlight'
    }
    return color
}

function getVelocity(event) {
    const position = event.offsetY
    const range = event.target.clientHeight
    return (127 * position) / range
}

function pressKey(event, index) {
    const velocity = getVelocity(event)
    emit('play-note', props.minKey + index, velocity, 0)
}

function releaseKey(event, index) {
    emit('stop-note', props.minKey + index, 0)
}

function touchKey(event, index) {
    if (touchEnabled) {
        pressKey(event, index)
    }
}

function untouchKey(event, index) {
    if (touchEnabled) {
        releaseKey(event, index)
    }
}

function dblClickKey() {
    touchEnabled = !touchEnabled
}
</script>

<template>
    <div class="piano-keyboard">
        <div
            v-for="(key, index) in keys"
            class="key"
            :key="index"
            :class="getKeyClass(index)"
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
    background-color: black;
}

div.key.white {
    background-color: white;
    border: 0.3px solid black;
}

div.key:hover {
    filter: opacity(0.5);
}

div.key.highlight {
    filter: opacity(0.5);
}
</style>
