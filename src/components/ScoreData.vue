<script setup>
import { onMounted, inject, computed } from 'vue'
import { PrettyXml } from 'pretty-xml-vue3'
import XmlViewer from 'vue3-xml-viewer'
import 'pretty-xml-vue3/style.css'

const mei = inject('mei')

const strippedXML = computed(() => {
    const start = mei.value.indexOf('<mei')
    return mei.value.substring(start)
})

// lifecycle hooks
onMounted(() => {
    /*
    console.log(mei.value)

    const parser = new DOMParser()
    const doc = parser.parseFromString(mei.value, 'text/xml')
    console.log(doc.documentElement)
    */
})

function getURLObject() {
    const blob = new Blob([mei.value], { type: 'text/xml' })
    return URL.createObjectURL(blob)
}

function openInNewTab() {
    const objectURL = getURLObject()
    window.open(objectURL)
    URL.revokeObjectURL(objectURL)
}
</script>

<template>
    <!-- div class="header">
        <button @click="openInNewTab">Open in new tab</button>
    </div -->
    <div class="scroller">
        <div class="viewer">
            <XmlViewer :xml="strippedXML" />
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

div.xml-data {
    padding: 1em;
    font-family: monospace;
    font-size: 10pt;
    white-space: pre;
}
</style>
