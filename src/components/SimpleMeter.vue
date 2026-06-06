<script setup>
import { computed } from 'vue'
const props = defineProps({ min: Number, max: Number, value: Number })

const percentage = computed(() => {
    return String((100 * (props.value - props.min)) / (props.max - props.min)) + '%'
})
</script>

<template>
    <div class="background">
        <div class="meter" :style="{ width: percentage }" />
    </div>
</template>

<style scoped>
.background {
    box-sizing: border-box;
    height: 5px;
    margin-top: 5px;
    margin-bottom: 5px;
    background: rgba(128, 128, 128, 0.2);
    border-radius: 3px;
    overflow: hidden;
}

.meter {
    height: 100%;
    width: 33%;
    border-radius: 4px;
}
</style>
