<script setup></script>

<template>
    <div class="container">
        <h1 class="title">404: Not Found</h1>
    </div>
</template>

<style scoped>
.container {
    grid-row: 2/4;
    grid-column: 2/5;
    z-index: 100;
    display: flex;
    background: rgba(255, 255, 0, 0.7);
    backdrop-filter: blur(5px);
}
.title {
    font-size: 7vw;
    margin: auto;
    padding-bottom: 1em;
}
</style>
