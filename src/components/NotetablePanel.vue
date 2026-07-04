<script setup>
import { onMounted, onUnmounted, inject, watch } from 'vue'

const noteData = inject('noteData')

function selectRow(note) {
    console.log(note)
}

watch(
    () => noteData,
    async (newData) => {
        console.log('new data', newData)
    },
)

// lifecycle hooks
onMounted(() => {})

onUnmounted(() => {})
</script>

<template>
    <div class="scroller">
        <table>
            <thead>
                <tr>
                    <th>Index</th>
                    <th>Position</th>
                    <th>Pitch</th>
                    <th>Duration</th>
                    <th>Measure</th>
                    <th>Midi</th>
                    <th>Staff</th>
                    <th>Voice</th>
                    <th>Id</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(note, index) in noteData.noteData.notes"
                    class="stripes"
                    :key="note.id"
                    @click="selectRow(note)"
                >
                    <td>{{ index + 1 }}</td>
                    <td>{{ note.measure.toFixed(4) }}</td>
                    <td>{{ note.pitch }}</td>
                    <td>{{ note.duration.toFixed(4) }}</td>
                    <td>{{ note.number }}</td>
                    <td>{{ note.midi }}</td>
                    <td>{{ note.staff }}</td>
                    <td>{{ note.voice }}</td>
                    <td>{{ note.id }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
div.scroller {
    position: var(--column-position);
    height: 100%;
    overflow: scroll;
    width: var(--column-width);
    background-color: var(--color-background);
}

thead {
    position: sticky;
    top: 0;
    backdrop-filter: blur(8px);
}

tr.stripes:nth-child(2n) {
    background: rgba(127, 127, 127, 0.1);
}

th,
td {
    padding: 2px 10px 2px 10px;
    text-align: center;
}

table,
th,
td {
    border: 1px solid rgba(127, 127, 127, 0.153);
    border-collapse: collapse;
}
</style>
