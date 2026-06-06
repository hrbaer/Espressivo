<script setup>
import { onMounted, onUnmounted, inject } from 'vue'
import PianoKeyboard from './PianoKeyboard.vue'
import navigation from '../libraries/navigation'

const midiOutput = inject('midiOutput')
const midiInput = inject('midiInput')
const midiIO = inject('midiIO')

// Life cycle
onMounted(() => {
    navigation.setViewLayout('2fr', '1fr', '1fr')
    if (midiIO.value.hasMidi) {
        if (midiOutput.length == 0) {
            midiIO.value.initialize()
        }
    }
    // Restore the state of the MIDI posrts
    const rememberMidi = localStorage.getItem('rememberMidi')
    if (rememberMidi != null) {
        const ids = JSON.parse(rememberMidi)
        for (const output of midiOutput) {
            if (ids.includes(output.id)) {
                output.open()
            }
        }
    } else {
        midiOutput[0]?.open()
    }
})

onUnmounted(() => {
    // Save the open MIDI output ports.
    const rememberMidi = midiOutput
        .filter((output) => {
            return output.connection == 'open'
        })
        .map((e) => {
            return e.id
        })
    localStorage.setItem('rememberMidi', JSON.stringify(rememberMidi))
})

function playNote(midi, velocity, channel) {
    midiIO.value.noteOn(midi, channel, velocity)
}

function stopNote(midi, channel) {
    midiIO.value.noteOff(midi, channel)
}

function select(inOut, event) {
    if (event.target.checked) {
        inOut.open()
    } else {
        inOut.close()
    }
}
</script>

<template>
    <div class="midi-instrument">
        <div class="content">
            <h3>MIDI Instruments</h3>
            <h4>MIDI Output</h4>
            <div v-for="output in midiOutput" :key="output.id">
                <input
                    type="checkbox"
                    @click="select(output, $event)"
                    :id="output.id"
                    :name="output.id"
                    :checked="output.connection == 'open'"
                />
                <label :for="output.id">{{ output.name }}</label>
            </div>
            <h4>MIDI Input</h4>
            <div v-for="input in midiInput" :key="input.id">
                <input
                    type="checkbox"
                    @click="select(input, $event)"
                    :id="input.id"
                    :name="input.id"
                    :checked="input.connection == 'open'"
                />
                <label :for="input.id">{{ input.name }}</label>
            </div>
            <div class="line" />
            <h3>Sound Check</h3>
            <PianoKeyboard
                class="keyboard"
                :min-key="21"
                :max-key="108"
                @play-note="playNote"
                @stop-note="stopNote"
            />
            <!--
            <hr />
            <button @click="clearLog">Clear Log</button>
            <button @click="initialize">Inirialize</button>
            <pre id="messagelog" class="messagelog"></pre>
            -->
        </div>
    </div>
</template>

<style>
.messagelog {
    border: 0.5px solid #888888;
    min-height: 250px;
    border-radius: 10px;
    overflow: auto;
    font-size: 8pt;
    padding: 1em;
}
</style>

<style scoped>
div.midi-instrument {
    position: var(--column-position);
    overflow-x: hidden;
    overflow-y: scroll;
    width: var(--column-width);
    height: 100%;
    background-color: var(--color-background);
}

div.content {
    box-sizing: border-box;
    padding: 1em;
}

label {
    margin-left: 0.5em;
}

div.line {
    margin-top: 1em;
    height: 1px;
    background-color: rgba(128, 128, 128, 0.193);
}
</style>
