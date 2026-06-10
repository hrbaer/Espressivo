<script setup>
defineProps(['work'])
</script>

<template>
    <div class="work-flash">
        <div class="content">
            <div class="composer">{{ work.composer }}</div>
            <div class="title" v-for="(title, index) in work.titles" :key="index">
                {{ title }}
            </div>
        </div>
    </div>
</template>

<style scoped>
.work-flash {
    grid-row: 1/4;
    grid-column: 1/5;
    box-sizing: border-box;
    position: absolute;
    display: flex;
    width: 100%;
    height: 100%;
    font-size: 4vw;
    padding-bottom: 10vh;
    pointer-events: none;
}

.composer {
    font-size: 4vw;
    font-weight: 600;
    text-align: center;
}

.title {
    font-size: 3vw;
    font-weight: 300;
    text-align: center;
}

.content {
    backdrop-filter: blur(20px);
    box-shadow: rgba(100, 100, 111, 0.25) 0px 7px 29px 0px;
    border-radius: 0.5em;
    justify-content: center;
    margin: auto;
    padding: 1em;
}
</style>
