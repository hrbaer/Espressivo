<script setup>
import { inject } from 'vue'

const playerDisplay = inject('playerDisplay')
</script>

<template>
    <div class="display">
        <div class="large">{{ playerDisplay.bar }}</div>
        <div class="large">{{ playerDisplay.beat }}</div>
        <div class="small">{{ playerDisplay.tempo }}</div>
        <div class="small">{{ playerDisplay.meter }}</div>
        <div class="small">{{ playerDisplay.key }}</div>
        <div class="large fw">{{ playerDisplay.time }}</div>

        <div class="label">BAR</div>
        <div class="label">BEAT</div>
        <div class="label">TEMPO</div>
        <div class="label">METER</div>
        <div class="label">KEY</div>
        <div class="label">TIME</div>
    </div>
</template>

<style scoped>
div.display {
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: 60px 30px 40px 50px 50px 100px;
    padding-top: 3px;
    padding-bottom: 5px;
    align-items: baseline;
    color: #e8e8e8;
    user-select: none;
}
div.display > div {
    margin-left: auto;
    margin-right: auto;
}
div.large {
    font-size: 18pt;
    line-height: 20px;
}
div.small {
    font-size: 10pt;
    line-height: 20px;
}
div.label {
    font-size: 8pt;
    line-height: 12px;
    color: #a0a0a0;
}
div.fw {
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
}
</style>
