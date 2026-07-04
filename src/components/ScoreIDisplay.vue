<script setup>
import { inject, watch, onMounted } from 'vue'
import navigation from '../libraries/navigation'

const svg = inject('svg')
const player = inject('player')
const verovioVersion = inject('verovioVersion')

onMounted(() => {
    navigation.setViewLayout('2fr', '1fr', '1fr')
})

watch(
    () => player.value.currentNote,
    (currentNote) => {
        showPlayingNote(currentNote)
    },
    { deep: true },
)

function showPlayingNote(currentNote) {
    if (currentNote != null) {
        placeLine(currentNote.id)
    }
}

function selectNote(noteId) {
    player.value.selectNote(noteId)
}

function selectMeasure(measureId) {
    player.value.selectMeasure(measureId)
}

function findMeasure(x, y) {
    let measures = document.querySelectorAll('g.measure')
    let measure = Array.from(measures).find((measure) => {
        let rect = measure.getBoundingClientRect()
        return rect.left <= x && rect.right > x && rect.top <= y && rect.bottom > y
    })
    return measure
}

function getParentClass(element, name) {
    while (element != null) {
        if (element.className.baseVal == name) {
            return element
        }
        element = element.parentElement
    }
}

function setLine(x, y, width, height) {
    let line = document.getElementById('line')
    let scroller = document.querySelector('div.scroller')
    let scrollerRect = scroller.getBoundingClientRect()
    line.style.left = x - scrollerRect.x + 'px'
    line.style.top = y - scrollerRect.y + scroller.scrollTop + 'px'
    line.style.width = width + 'px'
    line.style.height = height + 'px'
}

function hideLine() {
    let line = document.getElementById('line')
    line.style.left = '-2000px'
}

function findElement(element, className) {
    let parent = element
    do {
        if (parent.className.baseVal === className) {
            return parent
        }
        parent = parent.parentNode
    } while (parent != null)
}

function placeLine(id) {
    let scroller = document.querySelector('div.scroller')
    let line = document.getElementById('line')
    let note = document.getElementById(id)
    if (note != null) {
        let measure = findElement(note, 'measure')
        if (measure != null) {
            let scrollerRect = scroller.getBoundingClientRect()
            let measureRect = measure.getBoundingClientRect()
            let noteRect = note.getBoundingClientRect()
            let x = Math.round(noteRect.x - scrollerRect.x)
            let y = Math.round(measureRect.top - scrollerRect.y) + scroller.scrollTop
            let height = measureRect.height
            let width = noteRect.width
            line.style.left = x + 'px'
            line.style.top = y + 'px'
            line.style.height = height + 'px'
            line.style.width = width + 'px'
            if (window.lastMeasureId != measure.id) {
                window.lastMeasureId = measure.id
                scrollToMeasure(measureRect)
            }
        }
    }
}

function scrollToMeasure(measureRect) {
    let scroller = document.querySelector('div.scroller')
    const measureRange = measureRect.height
    const measureTop = (scroller.offsetHeight - measureRect.height) / 4
    if (Math.abs(measureRect.y - measureTop) > measureRange) {
        let scrollY = Math.round(scroller.scrollTop + measureRect.y - measureTop)
        if (scrollY != null) {
            scroller.scrollTo({ top: scrollY, left: 0, behavior: 'smooth' })
        }
    }
}

function handleScoreClick(event) {
    let note = getParentClass(event.target, 'note')
    if (note != null) {
        let measure = getParentClass(note, 'measure')
        if (measure != null) {
            let noteRect = note.getBoundingClientRect()
            let measureRect = measure.getBoundingClientRect()
            let x = Math.round(noteRect.x)
            let y = Math.round(measureRect.y)
            let height = Math.round(measureRect.height)
            let width = Math.round(noteRect.width)
            setLine(x, y, width, height)
            selectNote(note.id)
        }
    } else {
        let measure = findMeasure(event.pageX - window.scrollX, event.pageY - window.scrollY)
        if (measure != null) {
            let measureRect = measure.getBoundingClientRect()
            let x = Math.round(measureRect.x)
            let y = Math.round(measureRect.y)
            let height = Math.round(measureRect.height)
            let width = Math.round(measureRect.width)
            setLine(x, y, width, height)
            selectMeasure(measure.id)
        } else {
            hideLine()
            selectMeasure()
        }
    }
}
</script>

<template>
    <div class="scroller">
        <div class="score" v-html="svg" @click="handleScoreClick($event)"></div>
        <div id="line"></div>
        <div class="version">Verovio version {{ verovioVersion }}</div>
    </div>
</template>

<style>
div.score > svg {
    height: 100%;
    width: var(--column-width);
    background-color: var(--color-background);
}
</style>

<style scoped>
div.scroller {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: scroll;
}

h1 {
    font-weight: 500;
    font-size: 1rem;
    position: relative;
}

#line {
    position: absolute;
    border-radius: 5px;
    left: -2000px;
    top: 20px;
    width: 16px;
    height: 100px;
    background-color: var(--accent-color);
    opacity: 0.5;
}

div.version {
    position: sticky;
    bottom: 0;
    width: 100%;
    text-align: center;
    font-size: 8pt;
}
</style>
