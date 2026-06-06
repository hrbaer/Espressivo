<script setup>
import { onMounted, ref, watch } from 'vue'

import SvgIcon from './SvgIcon.vue'

const emit = defineEmits(['close-url-panel', 'save-url'])
const publicURL = 'https://music.ursamedia.ch/data/scores/'

const rememberUrl = ref('')

// lifecycle hooks
onMounted(() => {
    rememberUrl.value = localStorage.getItem('rememberUrl') ?? ''
})

watch(
    () => rememberUrl.value,
    (url) => {
        if (rememberUrl.value.length == 0) {
            rememberUrl.value = publicURL
        }
    },
    { deep: true },
)

function close() {
    emit('close-url-panel')
}

function saveUrl() {
    localStorage.setItem('rememberUrl', rememberUrl.value)
    emit('save-url', rememberUrl.value)
    close()
}
</script>

<template>
    <div class="open-url">
        <SvgIcon name="IconXmark" class="close-icon" @click="close" />
        <div class="url-panel">
            <div>Enter URL of score files</div>
            <input
                type="text"
                id="url"
                name="url"
                maxlength="256"
                size="50"
                v-model="rememberUrl"
                @keyup.enter="saveUrl"
                :placeholder="publicURL"
            />
            <input class="url-button" type="button" value="Apply" @click="saveUrl" />
        </div>
    </div>
</template>

<style scoped>
div.open-url {
    grid-row: 2/3;
    grid-column: 2/4;
    padding: 0.5em;
    display: flex;
    background-color: rgba(193, 191, 191, 0.5);
    border-radius: 12px;
    z-index: 100;
    backdrop-filter: blur(8px);
}
div.url-panel {
    margin: auto;
}
svg.close-icon {
    position: absolute;
    width: 20px;
    cursor: pointer;
}
input.url-button {
    margin-left: 1em;
}
</style>
