<script setup>
import { onMounted, onUnmounted, inject, computed } from 'vue'
import SimpleMeter from './SimpleMeter.vue'

const player = inject('player')

onMounted(() => {})

onUnmounted(() => {})

const tempoRate = computed(() => {
    return player.value.tempoRate
})

const velocity = computed(() => {
    return player.value.velocityValues?.[0]
})

const velocities = computed(() => {
    return player.value.velocityValues
})

const articulations = computed(() => {
    return player.value.articulationRates.slice(1)
})

const pedals = computed(() => {
    return player.value.pedals
})

function pedalType(index) {
    return ['Sustain', 'Sostenuto', 'Soft'][index]
}

function voiceVelocity(staffVelocity) {
    return staffVelocity?.slice(1)
}
</script>

<template>
    <div class="live-panel">
        <div class="meters">
            <!-- Tempo -->
            <div class="title1">Tempo</div>
            <SimpleMeter class="tempo" :min="-100" :max="100" :value="tempoRate" />
            <!-- Velocities -->
            <div class="title1">Velocity</div>
            <template v-for="(staffVelocity, staffIndex) in velocities" :key="staffIndex">
                <template v-if="staffIndex == 0">
                    <SimpleMeter class="velocity" :min="0" :max="127" :value="staffVelocity" />
                </template>
                <template v-else>
                    <template
                        v-for="(voiceVelocity, voiceIndex) in staffVelocity"
                        :key="voiceIndex"
                    >
                        <!-- Staff velocities -->
                        <template v-if="voiceIndex == 0">
                            <div class="title2">Staff {{ staffIndex }}</div>
                            <SimpleMeter
                                v-if="voiceVelocity != null"
                                class="velocity"
                                :min="-40"
                                :max="40"
                                :value="voiceVelocity ?? 0"
                            />
                        </template>
                        <!-- Voice velocities -->
                        <template v-else>
                            <div class="title3">Voice {{ voiceIndex }}</div>
                            <SimpleMeter
                                class="velocity"
                                :min="0"
                                :max="40"
                                :value="voiceVelocity ?? 0"
                            />
                        </template>
                    </template>
                </template>
            </template>
            <!-- Articulation -->
            <div class="title1">Articulation</div>
            <div v-for="(articulation, index) in articulations" :key="index">
                <div class="title2">Staff {{ index + 1 }}</div>
                <SimpleMeter class="articulation" :min="0" :max="50" :value="articulation" />
            </div>
            <!-- Pedal -->
            <div class="title1">Pedal</div>
            <div v-for="(pedal, index) in pedals" :key="index">
                <div class="title2">{{ pedalType(index) }}</div>
                <SimpleMeter class="pedal" :min="0" :max="1" :value="pedal" />
            </div>
        </div>
    </div>
</template>

<style scoped>
div.live-panel {
    position: var(--column-position);
    width: var(--column-width);
    height: 100%;
    overflow: scroll;
    box-sizing: border-box;
    font-size: 10pt;
    background-color: var(--color-background);
}
div.title1 {
    font-weight: 800;
    margin-top: 0.7em;
    font-size: 105%;
}
div.title2 {
    font-weight: 400;
    margin-left: 16px;
    font-size: 100%;
}
div.title3 {
    font-weight: 200;
    margin-left: 32px;
    font-size: 95%;
}
div.meters {
    padding: 1em;
}
meter {
    width: 100%;
}
.tempo:deep() div.meter {
    background: #c12f00;
}
.velocity:deep() div.meter {
    background: #006bd6;
}
.articulation:deep() div.meter {
    background: #f4c500;
}
.pedal:deep() div.meter {
    background: rgb(127, 127, 127);
}
hr {
    margin-top: 14px;
    margin-bottom: 6px;
    opacity: 0.15;
}
</style>
