<script setup>
import MidiInstrument from '../components/MidiInstrument.vue'
import MidiLinks from '../components/MidiLinks.vue'
</script>

<template>
    <MidiInstrument class="midi-instrument" />
    <MidiLinks class="midi-links" />
</template>

<style scoped>
div.midi-instrument {
    grid-row: 2/3;
    grid-column: 2/3;
}
div.midi-links {
    grid-row: 2/3;
    grid-column: 3/5;
}
</style>
