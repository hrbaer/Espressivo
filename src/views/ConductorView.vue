<script setup>
import ScoreDisplay from '../components/ScoreIDisplay.vue/index.js'
import LivePanel from '../components/LivePanel.vue'
</script>

<template>
    <ScoreDisplay class="score-view" />
    <LivePanel class="live-panel" />
</template>

<style scoped>
.score-view {
    grid-row: 2/3;
    grid-column: 2/4;
}
.live-panel {
    grid-row: 2/3;
    grid-column: 4/5;
}
</style>
