<script setup>
import { onMounted, ref } from 'vue'

const supporters = ref([])
const software = ref([])

onMounted(async () => {
    supporters.value = await getSupporters()
    software.value = await getSoftware()
})

async function getSupporters() {
    const supporters = await loadTextFile('./supporters.txt')
    return splitLines(supporters)
}

async function loadTextFile(resource) {
    const response = await fetch(resource)
    if (response.ok) {
        return await response.text()
    }
}

async function getSoftware() {
    return await loadJSON('./software.json')
}

async function loadJSON(resource) {
    const response = await fetch(resource)
    if (response.ok) {
        return await response.json()
    }
}

function splitLines(text) {
    return text.split(/\r?\n/).filter((line) => {
        return line.length > 0
    })
}
</script>

<template>
    <div class="scroller">
        <div class="credits">
            <figure>
                <a href="https://atelier-imholz.ch/" target="_blank">
                    <img
                        alt="Keyboard player"
                        class="featured-image"
                        src="@/assets/images/ji_orgel.jpeg"
                    />
                </a>
                <figcaption>Keyboard Virtuoso with kind permission of Jürg Imholz</figcaption>
            </figure>
            <h2>Credits</h2>
            <h3>Persons</h3>
            <ul>
                <li v-for="supporter in supporters" :key="supporter">{{ supporter }}</li>
            </ul>
            <h3>Software</h3>
            <ul>
                <li v-for="program in software" :key="program.title">
                    <a :href="program.url" target="_blank">{{ program.title }}:</a>
                    {{ program.description }}
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
div.scroller {
    position: var(--column-position);
    overflow-y: scroll;
    overflow-x: hidden;
    width: var(--column-width);
    height: 100%;
    background-color: var(--color-background);
}

div.credits {
    padding: 1em;
}

a {
    text-decoration: none;
    color: var(--accent-color);
    cursor: pointer;
}

figure {
    margin: 0;
    max-width: 450px;
}

figcaption {
    font-size: 9pt;
}

.featured-image {
    width: 100%;
    border-radius: 6px;
}
</style>
