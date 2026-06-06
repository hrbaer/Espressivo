<script setup>
import WelcomePanel from '../components/WelcomePanel.vue'
import CreditsPanel from '../components/CreditsPanel.vue'
</script>

<template>
    <WelcomePanel class="welcome-panel" />
    <CreditsPanel class="credits-panel" />
</template>

<style scoped>
div.welcome-panel {
    grid-row: 2/3;
    grid-column: 2/3;
}

div.credits-panel {
    grid-row: 2/3;
    grid-column: 3/5;
}
</style>
