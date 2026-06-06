<script setup>
import { onMounted, onUnmounted, inject } from 'vue'

const setRepertoire = inject('setRepertoire')

// Life cycle
onMounted(() => {
    document.body.addEventListener('dragenter', dragEnter)
    document.body.addEventListener('dragleave', dragLeave)
    document.body.addEventListener('dragover', dragOver)
    document.body.addEventListener('drop', drop)
})

onUnmounted(() => {
    document.body.removeEventListener('dragenter', dragEnter)
    document.body.removeEventListener('dragleave', dragLeave)
    document.body.removeEventListener('dragover', dragOver)
    document.body.removeEventListener('drop', drop)
})

function dragEnter(e) {
    // console.log('drag enter', e)
    e.preventDefault()
}

function dragLeave(e) {
    // console.log('drag leave', e)
    e.preventDefault()
}

function dragOver(e) {
    // console.log('drag over', e)
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
}

function readDirectory(directory) {
    return new Promise((resolve, reject) => {
        let dirReader = directory.createReader()
        let entries = []

        let getEntries = () => {
            dirReader.readEntries(
                (results) => {
                    if (results.length) {
                        const p = []
                        for (const entry of results) {
                            if (entry.isDirectory) {
                                p.push(readDirectory(entry))
                            } else {
                                p.push(Promise.resolve(entry))
                            }
                        }
                        Promise.all(p).then((res) => {
                            for (const e of res) {
                                if (Array.isArray(e)) entries.push(...e)
                                else entries.push(e)
                            }
                            resolve(entries)
                        })
                    } else {
                        resolve([])
                    }
                },
                (error) => {
                    console.error(error)
                    /* handle error — error is a FileError object */
                },
            )
        }
        getEntries()
    })
}

async function drop(event) {
    const items = event.dataTransfer.items
    event.preventDefault()
    // We expect one root directory.
    const entry = items[0].webkitGetAsEntry()
    const files = await readDirectory(entry)
    setRepertoire(files)
}
</script>

<template>
    <div class="drop-zone">
        <!-- div class="drop-info"><span class="symbol">⬇️</span>Drop score file directories here</div -->
    </div>
</template>

<style scoped>
div.drop-zone {
    grid-row: 2/3;
    grid-column: 3/5;
    box-sizing: border-box;
    display: flex;
    color: rgba(128, 128, 128);
}
div.drop-info {
    margin: 0px auto auto auto;
    font-size: 16px;
    font-weight: 100;
}
span.symbol {
    margin-right: 0.5em;
}
</style>
