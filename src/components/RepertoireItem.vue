<script setup>
import { inject, watch, nextTick } from 'vue'

const selectScore = inject('selectScore')
const scoreFiles = inject('scoreFiles')
const selectedScoreFile = inject('selectedScoreFile')

watch(
    () => selectedScoreFile,
    (scoreFile) => {
        scrollToSelection()
    },
    { deep: true },
)

function scrollToSelection() {
    const selection = document.querySelector('div.entry.selected')
    if (selection != null) {
        selection.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
}

function select(scoreFile) {
    return scoreFile == selectedScoreFile.value ? 'selected' : ''
}

// Selects a score file.
async function chooseScore(scoreFile) {
    await nextTick()
    selectScore(scoreFile)
}
</script>

<template>
    <div class="repertoire">
        <div class="list">
            <div
                class="entry"
                v-for="(scoreFile, index) in scoreFiles"
                :key="scoreFile.name"
                :class="select(scoreFile)"
                @click="chooseScore(scoreFile)"
            >
                <div class="index">
                    {{ index + 1 }}
                </div>
                {{ scoreFile.name }}
            </div>
        </div>
    </div>
</template>

<style scoped>
.repertoire {
    position: var(--column-position);
    height: 100%;
    overflow-x: hidden;
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
    font-feature-settings: 'tnum';
}

div.entry.selected {
    background: var(--accent-color);
    color: var(--vt-c-white-soft) !important;
    border-radius: 7px;
}

div.index {
    min-width: 28px;
    text-align: center;
    font-size: 7pt;
    margin-right: 1em;
    display: inline-block;
    background: rgba(128, 128, 128, 0.2);
    border-radius: 3px;
}
</style>
