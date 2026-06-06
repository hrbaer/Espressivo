<script setup>
import { ref, onMounted } from 'vue'
const props = defineProps({ select: Array })
const index = ref(0)

const emit = defineEmits(['switch-handler', 'register-switcher'])

onMounted(() => {
    emit('register-switcher', switchValue)
})

function switchValue() {
    index.value = (index.value + 1) % props.select.length
    emit('switch-handler', index.value)
}
</script>

<template>
    <div class="switch-button" @mousedown="switchValue">{{ select[index] }}</div>
</template>

<style scoped>
.switch-button {
    font-size: 8pt;
    cursor: pointer;
    text-align: center;
    text-transform: uppercase;
}
</style>
