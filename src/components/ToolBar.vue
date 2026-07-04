<script setup>
import { onMounted, onUnmounted, inject, computed, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import navigation from '../libraries/navigation'

import SvgIcon from './SvgIcon.vue'
import PlayerDisplay from './PlayerDisplay.vue'
import SwitchButton from './SwitchButton.vue'

const route = useRoute()

const player = inject('player')
const hidHandler = inject('hidHandler')
const motionSensor = inject('motionSensor')

const emit = defineEmits([
    'set-repertoire',
    'initialize-repertoire',
    'open-url',
    'previous-title',
    'next-title',
    'rewind-title',
    'start-stop',
    'set-ornament-type',
    'set-color-style',
    'open-transpose-dialog',
])

const showRepertoire = ref(false)
const showPerformanceTools = ref(false)
const showGamepadTools = ref(false)
const colorStyle = ref(true)
const isRunning = inject('isRunning')
const leftSidepanelWidths = ['165px', '0px']
const leftSidepanelVarname = '--left-sidebar'
const musicStyle = ['Barock', 'Classic']
const ornamentTypes = ['barock', 'classic']
const multiChannel = ref(false)

var switchHandler
var ornamentIndex = 0

// lifecycle hooks
onMounted(() => {
    window.addEventListener('clickhandler', handleClick)
    ornamentIndex = ornamentTypes.indexOf(player.value.ornamentType)
})

onUnmounted(() => {
    window.removeEventListener('clickhandler', handleClick)
})

watch(
    () => route.path,
    (path) => {
        showRepertoire.value = path == '/repertoire'
        showPerformanceTools.value = path == '/score' || path == '/conductor'
        showGamepadTools.value = path == '/gamepad'
    },
    { immediate: true },
)

function registerSwitchHandler(handler) {
    switchHandler = handler
}

function handleClick(event) {
    if (event.detail == 'switchstyle') {
        if (switchHandler != null) {
            switchHandler()
        }
    }
}

function flipLeftSidepanelWidth() {
    leftSidepanelWidths.reverse()
    navigation.setRootProperty(leftSidepanelVarname, leftSidepanelWidths[0])
}

function moveBack() {
    navigation.moveBack()
}

function moveForward() {
    navigation.moveForward()
}

function home() {
    emit('initialize-repertoire')
}

function previousTitle() {
    emit('previous-title')
}

function nextTitle() {
    emit('next-title')
}

function rewindTitle() {
    emit('rewind-title')
}

function playTitle() {
    emit('start-stop')
}

function openFiles() {
    document.querySelector('.file-dialog').click()
}

function openURL() {
    emit('open-url')
}

function openFiles_(event) {
    emit('set-repertoire', Array.from(event.target.files))
    event.target.value = ''
}

function switchStyle(index) {
    const ornamentType = ornamentTypes[index]
    emit('set-ornament-type', ornamentType)
    ornamentIndex = index
}

function setColorStyle(_event) {
    console.log('color style')
    colorStyle.value = !colorStyle.value
    emit('set-color-style', colorStyle.value)
}

function colorStyleIcon() {
    return colorStyle.value ? 'IconColorPaletteBW' : 'IconColorPaletteColor'
}

function setMultiChannel() {
    multiChannel.value = !multiChannel.value
    player.value.setMultiChannel(multiChannel.value)
}

function multiChannelIcon() {
    return multiChannel.value ? 'IconMultiChannel' : 'IconSingleChannel'
}

function openTransposeDialog() {
    emit('open-transpose-dialog')
}

const manuallyConnect = computed(() => {
    return hidHandler.value.hasHID
})

const sensorButtonTitle = computed(() => {
    return motionSensor.value.isConnected ? 'Disconnect Sensor' : 'Connect Sensor'
})

function connectHid() {
    hidHandler.value.requestDevice()
}

function connectMotionSensor() {
    motionSensor.value.toggleMotionSensor()
}
</script>

<template>
    <header>
        <div
            class="icon-container large-media navigate-button"
            @click="flipLeftSidepanelWidth"
            title="Show or hide sidebar"
        >
            <SvgIcon name="IconSidebarLeft" class="toolbar-icon" />
        </div>
        <div
            class="icon-container small-media navigate-button"
            @click="moveBack"
            title="Move to previous panel"
        >
            <SvgIcon name="IconChevronLeft" class="toolbar-icon" />
        </div>
        <div class="toolbar">
            <div v-if="showRepertoire" class="toolbargroup">
                <div class="icon-container" @click="home" title="Use default score collection">
                    <SvgIcon name="IconMusicNoteHouse" class="toolbar-icon" />
                </div>
                <div
                    class="icon-container"
                    @click="openFiles"
                    title="Choose scores from local file system"
                >
                    <SvgIcon name="IconFilemenuPointer" class="toolbar-icon" />
                </div>
                <div class="icon-container" @click="openURL" title="Get scores from the Web">
                    <SvgIcon name="IconNetwork" class="toolbar-icon" />
                </div>
            </div>
            <div v-if="showPerformanceTools" class="toolbargroup">
                <div
                    class="icon-container"
                    @click="previousTitle()"
                    title="Go to the previous title"
                >
                    <SvgIcon name="IconBackward" class="toolbar-icon" />
                </div>
                <div class="icon-container" @click="nextTitle()" title="Go to the next title">
                    <SvgIcon name="IconForward" class="toolbar-icon" />
                </div>
                <div
                    class="icon-container"
                    @click="rewindTitle()"
                    title="Go to the beginning of the score"
                >
                    <SvgIcon name="IconBackwardEnd" class="toolbar-icon" />
                </div>
                <div
                    class="icon-container fixed-width"
                    @click="playTitle()"
                    v-if="isRunning"
                    title="Pause playing"
                >
                    <SvgIcon name="IconPause" class="toolbar-icon" />
                </div>
                <div
                    class="icon-container fixed-width"
                    @click="playTitle()"
                    title="Start or resume playing"
                    v-else
                >
                    <SvgIcon name="IconPlay" class="toolbar-icon" />
                </div>
            </div>
            <div v-if="showPerformanceTools" class="player-display">
                <PlayerDisplay />
            </div>
            <div v-if="showPerformanceTools" class="toolbargroup">
                <div
                    class="icon-container large-width"
                    title="Choose between Barock and Classic style"
                >
                    <SwitchButton
                        @switch-handler="switchStyle"
                        @register-switcher="registerSwitchHandler"
                        :select="musicStyle"
                        :index="ornamentIndex"
                    />
                </div>
                <div
                    class="icon-container fixed-width"
                    @click="setColorStyle($event)"
                    title="Switch between colored and black-and-white voices"
                >
                    <SvgIcon :name="colorStyleIcon()" class="toolbar-icon" />
                </div>
                <div class="icon-container" @click="openTransposeDialog" title="Transpose score">
                    <SvgIcon name="IconArrowUpArrowDown" class="toolbar-icon" />
                </div>

                <div
                    class="icon-container fixed-width"
                    @click="setMultiChannel"
                    title="Switch between single-channel and multi-channel MIDI output"
                >
                    <SvgIcon :name="multiChannelIcon()" class="toolbar-icon" />
                </div>

            </div>
            <div v-if="showGamepadTools">
                <div
                    v-if="manuallyConnect"
                    class="icon-button"
                    title="Select Gamepad"
                    @click="connectHid"
                >
                    <SvgIcon name="IconGamepad" class="toolbar-icon" />
                    <span class="info">Select gamepad</span>
                </div>
                <div class="icon-button" title="Connect motion sensor" @click="connectMotionSensor">
                    <SvgIcon name="IconRotate3d" class="toolbar-icon" />
                    <span class="info">{{ sensorButtonTitle }}</span>
                </div>
            </div>
            <input
                @change="openFiles_($event)"
                type="file"
                class="file-dialog"
                webkitdirectory
                multiple
            />
        </div>
        <div class="spacer"></div>
        <div
            class="icon-container small-media navigate-button"
            @click="moveForward"
            title="Move to next panel"
        >
            <SvgIcon name="IconChevronRight" class="toolbar-icon" />
        </div>
    </header>
</template>

<style scoped>
header {
    grid-row: 1/2;
    grid-column: 2/5;
    display: flex;
    width: 100%;
    align-items: center;
    white-space: nowrap;
}

div.toolbar {
    position: relative;
    display: flex;
    width: 100%;
    align-items: center;
}

.toolbargroup {
    height: 38px;
    margin-left: 6px;
    margin-right: 6px;
    border-radius: 50px;
    box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
    display: flex;
    align-items: center;
}

.toolbar-icon {
    height: 14px;
}

.icon-container {
    padding: 4px 7px 4px 7px;
    border-radius: 50px;
    display: inline-block;
}

.icon-button {
    align-items: center;
    padding: 4px 8px 4px 8px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
}

.icon-button:hover {
    background: rgba(127, 127, 127, 0.1);
}

span.info {
    margin-left: 0.6em;
}

.fixed-width {
    width: 20px;
}

.navigate-button {
    width: 20px;
    margin-left: 0.8em;
    margin-right: 0.8em;
}

.large-width {
    min-width: 56px;
}

.icon-container:hover {
    background: rgba(127, 127, 127, 0.1);
}

.spacer {
    flex-grow: 1;
    height: 100%;
}

.player-display {
    margin-left: 6px;
    margin-right: 6px;
    background-color: #505050;
    border-radius: 6px;
}

@media (width <= 750px) {
    .player-display {
        display: none;
    }
}

@media (width > 750px) {
    .player-display {
        display: inline-block;
    }
}

.file-dialog {
    display: none;
}

dialog#transpose-dialog {
    border: none;
    border-radius: 7px;
}

@media (width < 600px) {
    div.large-media {
        display: none;
    }
}

@media (width >= 600px) {
    div.small-media {
        display: none;
    }
}
</style>
