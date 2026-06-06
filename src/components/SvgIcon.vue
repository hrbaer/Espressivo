<!--
Source - https://stackoverflow.com/a/71179802
Posted by Roland, modified by community. See post 'Timeline' for change history
Retrieved 2026-02-19, License - CC BY-SA 4.0
-->

<script>
import { defineAsyncComponent } from 'vue'

export default {
    props: {
        name: {
            type: String,
            required: true,
        },
    },

    computed: {
        dynamicComponent() {
            const name = this.name
            return defineAsyncComponent(() => import(`./icons/${name}.vue`))
        },
    },
}
</script>

<template>
    <component :is="dynamicComponent" />
</template>
