<script setup>
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {})

onUnmounted(() => {})
</script>

<template>
    <div class="midi-links">
        <div class="content">
            <h3>Web MIDI Players</h3>
            <p>For sound output you might consider using a Web MIDI player.</p>
            <ul>
                <li>
                    <a href="https://musicalia.io/piano/" target="_blank">Musicalia</a>
                </li>
                <li>
                    <a
                        href="https://g200kg.github.io/webaudio-tinysynth/soundedit.html"
                        target="_blank"
                        >WebAudio-TinySynth: GM Synth/MIDI Player</a
                    >
                </li>
                <li>
                    <a href="https://mmontag.github.io/dx7-synth-js/" target="_blank">Yamaha DX7</a>
                </li>
            </ul>
            <h4>Hint</h4>
            <p>To use these Web MIDI players you might need to set-up a virtual MIDI bus.</p>
        </div>
    </div>
</template>

<style scoped>
div.midi-links {
    position: var(--column-position);
    overflow: scroll;
    height: 100%;
    width: var(--column-width);
    background-color: var(--color-background);
}

div.content {
    box-sizing: border-box;
    padding: 1em;
}

a {
    text-decoration: none;
    color: var(--accent-color);
    cursor: pointer;
}
</style>
