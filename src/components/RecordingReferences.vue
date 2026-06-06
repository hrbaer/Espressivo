<script setup>
defineProps({
    coverUrl: String,
})
</script>

<template>
    <div class="container">
        <embed class="reference" type="text/html" :src="coverUrl" />
    </div>
</template>

<style scoped>
.container {
    position: var(--column-position);
    height: 100%;
    width: var(--column-width);
    background-color: var(--color-background);
}

embed.reference {
    width: 100%;
    height: 100%;
}
</style>
