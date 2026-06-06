<script setup>
import ScoreItem from '../components/ScoreItem.vue'
import LivePanel from '../components/LivePanel.vue'
</script>

<template>
    <ScoreItem class="score-view" />
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
