<script setup>
import GamepadPanel from '../components/GamepadPanel.vue'
import LivePanel from '../components/LivePanel.vue'
</script>

<template>
    <GamepadPanel class="gamepad-panel" />
    <LivePanel class="live-panel" />
</template>

<style scoped>
.gamepad-panel {
    grid-row: 2/3;
    grid-column: 2/4;
}
.live-panel {
    grid-row: 2/3;
    grid-column: 4/5;
}
</style>
