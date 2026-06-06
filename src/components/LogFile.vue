<script setup>
import { onMounted, inject } from 'vue'

const logfile = inject('logfile')

// lifecycle hooks
onMounted(() => {})

function getTime(now) {
    return new Date(now).toLocaleTimeString()
}

function getDuration(entry) {
    const duration = entry.stopDate - entry.startDate
    return new Date(duration + 500).toISOString().substring(11, 19)
}
</script>

<template>
    <div class="scroller">
        <div class="viewer">
            <h1>Log File</h1>
            <div class="box" v-for="(entry, entryIndex) in logfile.content" :key="entryIndex">
                <h2>{{ entry.composer }}</h2>
                <h3 v-for="(title, titleIndex) in entry.titles" :key="titleIndex">{{ title }}</h3>
                <template v-if="entry.verses != null">
                    <h4>Verses</h4>
                    <ol>
                        <li v-for="(verse, verseIndex) in entry.verses" :key="verseIndex">
                            {{ verse }}
                        </li>
                    </ol>
                </template>
                <h4>Start time</h4>
                <div>{{ getTime(entry.startDate) }}</div>
                <h4>File name</h4>
                <div>{{ entry.filename }}</div>
                <template v-if="entry.logs.length > 0">
                    <h4>Warnings and errors</h4>
                    <div class="log" v-for="(log, logIndex) in entry.logs" :key="logIndex">
                        {{ log }}
                    </div>
                </template>
                <template v-if="entry.stopDate">
                    <h4>Stop time</h4>
                    <div>{{ getTime(entry.stopDate) }}</div>
                    <h4>Duration</h4>
                    <div>{{ getDuration(entry) }}</div>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
.scroller {
    position: var(--column-position);
    height: 100%;
    overflow: scroll;
    width: var(--column-width);
    background-color: var(--color-background);
}

.viewer {
    box-sizing: border-box;
    padding: 1em;
}

.box {
    border-radius: 7px;
    padding: 1em;
    margin-top: 1em;
    margin-bottom: 1em;
    background-color: rgba(128, 128, 128, 0.05);
}

.log {
    color: orange;
}

h1,
h2,
h3,
h4 {
    margin: 0;
}

ol {
    margin: 0;
    padding-left: 2em;
}
</style>
