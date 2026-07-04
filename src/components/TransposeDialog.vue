<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import SvgIcon from './SvgIcon.vue'

const transpose = ref('')

const emit = defineEmits(['transpose-score', 'close-transpose-dialog'])

const intervalNames = Object.freeze([
    'Perfect unison',
    'Minor second',
    'Major second',
    'Minor third',
    'Major third',
    'Perfect fourth',
    'Tritone',
    'Perfect fifth',
    'Minor sixth',
    'Major sixth',
    'Minor seventh',
    'Major seventh',
    'Perfect octave',
])

// lifecycle hooks
onMounted(() => {
    transpose.value = getIntervalName(0)
})

onUnmounted(() => {
    transposeScore(0)
})

function getIntervalName(step) {
    const name = intervalNames[Math.abs(step)]
    if (step == 0) {
        return name
    }
    const dir = step < 0 ? 'down' : 'up'
    return `${name} ${dir}`
}

function close() {
    emit('close-transpose-dialog')
}

function transposeScore(transposeValue) {
    emit('transpose-score', transposeValue)
}

function showStep(transposeValue) {
    transpose.value = getIntervalName(transposeValue)
}
</script>

<template>
    <div class="transpose-dialog">
        <div class="group">
            <SvgIcon name="IconXmark" class="close-icon" @click="close" />
            <input
                type="range"
                id="transpose"
                name="transpose"
                min="-12"
                max="12"
                value="0"
                @change="transposeScore($event.target.value)"
                @input="showStep($event.target.value)"
            />
            <span class="small">{{ transpose }}</span>
        </div>
    </div>
</template>

<style scoped>
div.transpose-dialog {
    grid-row: 3/4;
    grid-column: 2/4;
    padding: 0.5em;
    display: flex;
    margin-left: auto;
    margin-right: auto;
}
div.group {
    padding: 2px 12px 2px 12px;
    display: flex;
    align-items: center;
    box-shadow: rgba(100, 100, 111, 0.25) 0px 7px 29px 0px;
    border-radius: 15px;
}
svg.close-icon {
    width: 16px;
    cursor: pointer;
    margin-right: 0.6em;
}
input#transpose {
    min-width: 25vw;
    margin-right: 1em;
}
span.small {
    font-size: 10pt;
    width: 150px;
}
.keyboard {
    min-width: 350px;
}
</style>
