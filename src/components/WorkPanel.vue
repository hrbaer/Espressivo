<script setup>
import FolderIcon from './icons/IconFolder.vue'
import ArrowUpFolderIcon from './icons/IconArrowUpFolder.vue'
import navigation from '../libraries/navigation'

import { inject, onMounted } from 'vue'

const selectDirectory = inject('selectDirectory')
const scoreDirectories = inject('scoreDirectories')
const selectedScoreDirectory = inject('selectedScoreDirectory')
const scoreController = inject('scoreController')

// lifecycle hooks
onMounted(() => {})

function select(scoreDirectory) {
    return scoreDirectory == selectedScoreDirectory.value ? 'selected' : ''
}

// Selects a score directory.
function chooseDirectory(scoreDirectory) {
    selectDirectory(scoreDirectory)
}

function toUpperLevel() {
    scoreController.toUpperLevel()
}

function toLowerLevel() {
    scoreController.toLowerLevel()
}

function selectCurrentLevel(child) {
    scoreController.selectCurrentLevel(child.name)
    showTitles()
}

function showTitles() {
    navigation.setRootIndexOff(3)
    navigation.setRootIndexOn(4)
}

function getDirectoryName(directory) {
    return directory
}

let timer
let counter = 0

function multiClick(param) {
    counter += 1
    if (counter == 1) {
        timer = setTimeout(() => {
            counter = 0
            selectCurrentLevel(param)
        }, 300)
        return
    }
    clearTimeout(timer)
    counter = 0
    toLowerLevel()
}
</script>

<template>
    <div class="directories">
        <div class="list">
            <div class="entry sticky" @click="toUpperLevel" title="Switch to upper level">
                <span class="icon">
                    <ArrowUpFolderIcon />
                </span>
            </div>
            <div class="hint">Drag music score folder here</div>

            <div class="hint">Double click for sub-directories below</div>
            <div
                class="entry"
                v-for="scoreDirectory in scoreDirectories"
                :key="scoreDirectory.name"
                :class="select(scoreDirectory)"
                @click="multiClick(scoreDirectory)"
            >
                <span class="icon">
                    <FolderIcon />
                </span>
                {{ getDirectoryName(scoreDirectory.name) }}
            </div>
        </div>
    </div>
</template>

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
    font-feature-settings: 'tnum';
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

div.hint {
    font-size: 9pt;
    font-style: italic;
    display: flex;
    justify-content: center;
    line-height: 18px;
}
</style>
