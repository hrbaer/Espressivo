<script setup>
import RepertoirePanel from '../components/RepertoirePanel.vue'
import WorkPanel from '../components/WorkPanel.vue'
import RepertoireItem from '../components/RepertoireItem.vue'
import DropZone from '../components/DropZone.vue'
</script>

<template>
    <RepertoirePanel class="repertoire-panel" />
    <WorkPanel class="work-panel" />
    <RepertoireItem class="repertoire-item" />
    <DropZone />
</template>

<style scoped>
div.repertoire-panel {
    grid-row: 2/3;
    grid-column: 2/3;
}

div.work-panel {
    grid-row: 2/3;
    grid-column: 3/4;
}

div.repertoire-item {
    grid-row: 2/3;
    grid-column: 4/5;
}
</style>
