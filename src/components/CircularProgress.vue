<script setup>
import SvgIcon from './SvgIcon.vue'
</script>

<template>
    <div class="circular-progress">
        <SvgIcon name="IconCircularProgress" />
    </div>
</template>

<style scoped>
div.circular-progress {
    grid-row: 1/4;
    grid-column: 1/5;
    position: absolute;
    display: flex;
    width: 100%;
    height: 100%;
    background: transparent;
    margin: auto;
}
</style>
