<script setup>
import ScoreDisplay from "../components/ScoreDisplay.vue";
import RepertoireItem from "../components/RepertoireItem.vue";
</script>

<template>
  <ScoreDisplay class="score-view" />
  <RepertoireItem class="repertoire-item" />
</template>

<style scoped>
.score-view {
  grid-row: 2/3;
  grid-column: 2/4;
}

.repertoire-item {
  grid-row: 2/3;
  grid-column: 4/5;
}
</style>
