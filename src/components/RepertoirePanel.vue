<script setup>
import { ref, watch, inject, computed, onMounted, onUnmounted } from 'vue'
import { default as fileExtension } from 'file-extension'
import navigation from '../libraries/navigation'

const coverTitle = ref('')
const coverImage = ref('')
const coverDoc = ref('')
const coverComment = ref('')
const coverFiles = inject('coverFiles')

// lifecycle hooks
onMounted(() => {
    loadCoverFiles(coverFiles)
    navigation.setViewLayout('1fr', '1fr', '1fr')
})

onUnmounted(() => {
    URL.revokeObjectURL(coverImage.value)
    URL.revokeObjectURL(coverDoc.value)
})

watch(
    () => coverFiles,
    (coverFiles) => {
        loadCoverFiles(coverFiles)
    },
    { deep: true },
)

const hasCover = computed(() => {
    return coverFiles.length > 0
})

function readTextFileAsync(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader()
        reader.onload = () => {
            resolve(reader.result)
        }
        reader.onerror = reject
        reader.readAsText(file)
    })
}

async function readTextFile(file) {
    return await readTextFileAsync(file)
}

async function getFileAccess(file) {
    return await new Promise((resolve) => {
        if (file.file != null) {
            file.file((result) => {
                resolve(result)
            })
        } else {
            resolve(file)
        }
    })
}

async function getJSON(resource) {
    if (resource.url != null) {
        const response = await fetch(resource.url + resource.name)
        if (response.ok) {
            return await response.json()
        }
    } else if (resource.file != null) {
        const file = await getFileAccess(resource.file)
        const text = await readTextFile(file)
        return JSON.parse(text)
    }
}

async function loadCoverFiles(coverFiles) {
    coverTitle.value = null
    coverImage.value = null
    coverDoc.value = null
    coverComment.value = null
    for (const coverFile of coverFiles) {
        // JSON work file
        if (coverFile.name == 'work.json') {
            const json = await getJSON(coverFile)
            coverTitle.value = json[0].title // Title in English
        }
        // Image cover files
        else if (isCoverImage(coverFile)) {
            URL.revokeObjectURL(coverImage.value)
            coverImage.value = await getCoverURL(coverFile)
        }
        // Doc file
        else if (isCoverDoc(coverFile)) {
            URL.revokeObjectURL(coverDoc.value)
            coverDoc.value = await getCoverURL(coverFile)
        }
        // Text file
        else if (isCoverText(coverFile)) {
            coverComment.value = await getCoverText(coverFile)
        }
    }
}

function isCoverImage(coverFile) {
    return ['jpg', 'jpeg', 'png', 'svg'].includes(fileExtension(coverFile.name))
}

function isCoverText(coverFile) {
    return ['txt'].includes(fileExtension(coverFile.name))
}

function isCoverDoc(coverFile) {
    return ['html', 'pdf'].includes(fileExtension(coverFile.name))
}

async function getCoverURL(coverFile) {
    let url
    if (coverFile.url != null) {
        url = coverFile.url + coverFile.name
    } else if (coverFile.file != null) {
        const file = await getFileAccess(coverFile.file)
        url = URL.createObjectURL(file)
    }
    return url
}

async function getCoverText(coverFile) {
    if (coverFile.url != null) {
        const response = await fetch(coverFile.url + coverFile.name)
        if (response.ok) {
            return await response.text()
        }
    } else if (coverFile.file != null) {
        const file = await getFileAccess(coverFile.file)
        return await readTextFile(file)
    }
}

function showRepertoire() {
    navigation.setRootIndexOff(2)
    navigation.setRootIndexOn(3)
}
</script>

<template>
    <div class="cover-panel" @click="showRepertoire">
        <div class="content">
            <template v-if="hasCover">
                <template v-if="coverDoc != null">
                    <embed class="cover-doc" type="text/html" :src="coverDoc" />
                </template>
                <template v-else>
                    <h3 class="sticky">{{ coverTitle }}</h3>
                    <img :src="coverImage" />
                    <pre>{{ coverComment }}</pre>
                </template>
            </template>
            <template v-else>
                <div class="box">
                    <pre class="hint">This is the place to document your score collection.</pre>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
div.cover-panel {
    position: var(--column-position);
    height: 100%;
    overflow-x: hidden;
    overflow-y: scroll;
    width: var(--column-width);
    background-color: var(--color-background);
}

div.content {
    box-sizing: border-box;
    padding: 1em;
    cursor: pointer;
    height: 100%;
}

h3.sticky {
    position: sticky;
    top: 0;
    margin-top: 0;
    border-radius: 5px;
    backdrop-filter: blur(8px);
}

.cover-doc {
    object-fit: contain;
    width: 100%;
    height: 100%;
}

img {
    width: 100%;
    border-radius: 5px;
}

pre {
    font-size: 10pt;
    white-space: pre-wrap;
}

div.box {
    display: flex;
}

div.hint {
    background-color: rgba(205, 123, 0, 0.25);
    border-radius: 5px;
    padding: 5px;
    margin: auto;
}
</style>
