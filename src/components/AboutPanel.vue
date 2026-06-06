<script setup>
import { computed, ref } from 'vue'

const showIcon = ref(true)
const appName = computed(() => {
    return import.meta.env.VITE_API_APP_NAME
})

const version = computed(() => {
    return import.meta.env.VITE_API_ESPRESSIVO_VERSION
})

function toggleInfo() {
    showIcon.value = false
    setTimeout(() => {
        showIcon.value = true
    }, 3000)
}
</script>

<template>
    <header>
        <div v-if="showIcon == true" class="content">
            <img
                @click="toggleInfo"
                alt="Vue logo"
                class="logo"
                src="@/assets/EspressivoIcon.svg"
            />
            <div class="version-box">
                <div class="name">{{ appName }}</div>
                <div class="version">Version {{ version }}</div>
            </div>
        </div>
        <div v-else class="content">
            <div class="made-in">🇨🇭 Made in Switzerland</div>
        </div>
    </header>
</template>

<style scoped>
header {
    grid-row: 1;
    grid-column: 1;
    overflow: hidden;
    display: flex;
    align-content: center;
}

div.content {
    display: flex;
    align-items: center;
    padding-left: 1em;
    cursor: default;
}

.logo {
    height: 32px;
}

div.version-box {
    padding-left: 0.6em;
}

div.name {
    font-family: Garamond, serif;
    font-style: italic;
    font-size: 13pt;
    line-height: 18px;
}

div.version {
    font-size: 8pt;
}

div.made-in {
    font-size: 8pt;
}
</style>
