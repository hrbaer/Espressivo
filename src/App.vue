<script setup>
import {
    ref,
    reactive,
    provide,
    nextTick,
    onMounted,
    onBeforeMount,
    onUnmounted,
    watch,
    version,
} from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'

import createVerovioModule from 'verovio/wasm'
import { VerovioToolkit } from 'verovio/esm'

import AboutPanel from './components/AboutPanel.vue'
import ToolBar from './components/ToolBar.vue'
import NavigationPanel from './components/NavigationPanel.vue'
import CircularProgress from './components/CircularProgress.vue'
import WorkFlash from './components/WorkFlash.vue'
import OpenURL from './components/OpenURL.vue'
import TransposeDialog from './components/TransposeDialog.vue'

import MidiIO from './libraries/MidiIO.js'
import GamepadHandler from './libraries/GamepadHandler.js'
import ConverterService from './ConverterService.js'
import meiParser from './mei-parser.js'
import { default as fileExtension } from 'file-extension'

import Player from './libraries/Player.js'
import Clock from './libraries/Clock.js'
import HidHandler from './libraries/HidHandler.js'
import MotionSensor from './libraries/MotionSensor.js'
import Dispatcher from './libraries/Dispatcher.js'
import LogFile from './libraries/LogFile.js'

import navigation from './libraries/navigation'

const defaultRepertoire = './scores/bach_wtc/'
const countInTime = 2000

const repertoireURL = ref('')
const scoreDirectories = reactive([])
const selectedScoreDirectory = ref({})
const scoreFiles = reactive([])
const selectedScoreFile = ref({})
const coverFiles = reactive([])
const noteData = reactive({ noteData: {} })

const midiIO = ref({})
const midiInput = reactive([])
const midiOutput = reactive([])

const gamepads = reactive([])
const hidHandler = ref({})
const gamepadHandler = ref({})
const motionSensor = ref({})

const verovioVersion = ref('')
const svg = ref('')
const mei = ref('')
const showCountIn = ref(false)
const showWork = ref(false)
const isRunning = ref(false)
const player = ref({})
const progress = ref(0.0)
const showOpenURL = ref(false)
const showTransposeDialog = ref(false)

const logfile = ref({})

const route = useRoute()
const router = useRouter()

const playerDisplay = reactive({
    bar: 1,
    beat: 1,
    tempo: 72,
    meter: '4/4',
    key: 'C/a',
    time: '0:00.0',
})

const workFlash = {
    composer: '',
    titles: [],
}

const scoreController = reactive({ toUpperLevel, toLowerLevel, selectCurrentLevel })

// Verovio options.
const options = {
    // svgHtml5: true,
    scale: 90,
    scaleToPageSize: true,
    adjustPageHeight: true,
    svgAdditionalAttribute: 'layer@n',
}

let verovioToolkit
let dispatcher
let clock
let workTree
let currentWork
let counter

provide('progress', progress)
provide('svg', svg)
provide('noteData', noteData)
provide('mei', mei)
provide('midiInput', midiInput)
provide('midiOutput', midiOutput)
provide('midiIO', midiIO)
provide('hidHandler', hidHandler)
provide('gamepadHandler', gamepadHandler)
provide('motionSensor', motionSensor)
provide('coverFiles', coverFiles)

provide('selectDirectory', selectDirectory)
provide('scoreDirectories', scoreDirectories)
provide('selectedScoreDirectory', selectedScoreDirectory)

provide('selectScore', selectScore)
provide('scoreFiles', scoreFiles)
provide('selectedScoreFile', selectedScoreFile)
provide('setRepertoire', setRepertoire)

provide('playerDisplay', playerDisplay)
provide('gamepads', gamepads)
provide('player', player)
provide('isRunning', isRunning)

provide('scoreController', scoreController)
provide('verovioVersion', verovioVersion)

provide('logfile', logfile)

// Note: Vite server does not provide file listing
// Included 'index.json' file
repertoireURL.value = defaultRepertoire

// Life cycle.
onBeforeMount(() => {
    initializeVerovio()
    initializeMidi()
})

onMounted(() => {
    console.log(
        `${import.meta.env.VITE_API_APP_NAME} version ${
            import.meta.env.VITE_API_ESPRESSIVO_VERSION
        }`,
    )
    console.log(`Vue version ${version}`)

    initializePlayer()
    initializeDispatcher()

    initializeGamepads()
    initializeHid()
    initializeMotionSensor()

    initializeLogfile()

    startTimer()
    addEventListeners()
    // queryConverterService()

    resetLayout()
})

onUnmounted(() => {
    stopTimer()
    removeEventListeners()
})

// Watching variables.
watch(
    () => player.value.pausing,
    (pausing) => {
        isRunning.value = !pausing
    },
)

watch(
    () => route.query,
    (query) => {
        if (query.url != null) {
            parseRepertoire(query.url)
        }
    },
    { immediate: true },
)

function addEventListeners() {
    window.addEventListener('resize', sizeChanged)
    document.addEventListener('visibilitychange', visibilityChanged)
    window.addEventListener('keydown', handleKeyEvent)
    window.addEventListener('connectgamepad', connectGamepad)
    window.addEventListener('playstop', receiveStopEvent)
    window.addEventListener('midiinput', midiInputEvent)
    window.addEventListener('clickhandler', handleClick)
}

function removeEventListeners() {
    window.removeEventListener('resize', sizeChanged)
    document.removeEventListener('visibilitychange', visibilityChanged)
    window.removeEventListener('keydown', handleKeyEvent)
    window.removeEventListener('connectgamepad', connectGamepad)
    window.removeEventListener('playstop', receiveStopEvent)
    window.removeEventListener('midiinput', midiInputEvent)
    window.removeEventListener('clickhandler', handleClick)
}

// Called the the window size changed.
function sizeChanged(event) {
    resetLayout(event)
}

// Called when app switches between foreground and background.
function visibilityChanged() {
    const state = document.hidden ? 'hidden' : 'visible'
    console.log(`App is ${state}`)
    player.value?.sleep(document.hidden)
}

// Handles key event.
// Specific key for playing and stopping.
function handleKeyEvent(event) {
    switch (event.code) {
        case 'Space':
        case 'F8':
            startStop()
            event.preventDefault()
            event.stopPropagation()
            break
    }
}

// Adapts the layout.
function resetLayout() {
    const width = window.innerWidth
    navigation.setLayout(width)
}

// Starts a gamepad connection.
function connectGamepad(event) {
    console.log('connectGamepad', event)
    const gamepad = gamepadHandler.value.findGamepad(event.detail)
    if (gamepad != null) {
        gamepadHandler.value.connectGamepad(gamepad)
    }
}

// Called when player stops.
// Currently just terminates the log file entry.
function receiveStopEvent(event) {
    logfile.value.closeEntry()
}

// Receives MIDI input events.
// Currently just shows damper pedal activities.
function midiInputEvent(event) {
    switch (event.detail.controller) {
        // Damper pedal
        case 64:
            player.value.controlPedal(0, event.detail.value / 127)
            break
    }
}

function handleClick(event) {
    if (event.detail == 'reloadscore') {
        reloadScore()
    }
}

// Initializes the Verovio toolkit.
function initializeVerovio() {
    createVerovioModule().then((VerovioModule) => {
        VerovioModule._enableLogToBuffer(true)
        verovioToolkit = new VerovioToolkit(VerovioModule)
        verovioToolkit.setOptions(options)
        // console.log(verovioToolkit.getOptions())
        verovioVersion.value = verovioToolkit.getVersion()
        console.log(`Verovio version ${verovioVersion.value}`)
        initializeRepertoire()
    })
}

// Initialized MIDI input and output.
function initializeMidi() {
    const midi = new MidiIO(midiInput, midiOutput)
    midiIO.value = midi
}

// Initializes the dispatcher.
// Passes a set of callable function.
// The dispatcher is the central program part:
// It translates gamepad events into player instructions.
function initializeDispatcher() {
    const controller = {
        startStop: startStop,
        previousTitle: previousTitle,
        nextTitle: nextTitle,
        rewindTitle: rewindTitle,
        navigateUp: navigateUp,
        navigateDown: navigateDown,
        navigateLeft: navigateLeft,
        navigateRight: navigateRight,
    }
    dispatcher = new Dispatcher(controller, player.value)
}

// Initializes gamepads.
// Passes a set of callable functions.
function initializeGamepads() {
    gamepadHandler.value = new GamepadHandler(dispatcher, {
        findGamepadIndex,
        addGamepad,
        removeGamepad,
        updateGamepad,
    })
}

// Initializes input devices.
// In addition to gamepad input we support general input devices
// in order to access the gamepad's motion sensor.
function initializeHid() {
    hidHandler.value = new HidHandler(dispatcher, {
        findGamepadIndex,
        addGamepad,
        removeGamepad,
        updateGamepad,
    })
}

// Initializes the motions sensor.
// Only for built-in motion sensors on mobile devices.
function initializeMotionSensor() {
    motionSensor.value = new MotionSensor(dispatcher, {
        findGamepadIndex,
        addGamepad,
        removeGamepad,
        updateGamepad,
    })
}

// Initializes log files.
// The log file stores entries for every choosen music piece.
function initializeLogfile() {
    logfile.value = new LogFile()
}

// Configures the dispatcher according to the properties of the score.
function configureDispatcher() {
    dispatcher.configure(gamepads, noteData.noteData.meta)
}

// Finds the index of a given gamepad.
function findGamepadIndex(gamepad) {
    return gamepads.findIndex((pad) => {
        return gamepad.index == pad.index
    })
}

// Adds a gamepad to the list of the active gamepads.
function addGamepad(gamepad) {
    gamepads.push(gamepad)
    configureDispatcher()
}

// Removes a gamepad from the list.
function removeGamepad(gamepad) {
    const index = findGamepadIndex(gamepad)
    if (index != -1) {
        gamepads.splice(index, 1)
        configureDispatcher()
    }
}

// Updates the gamepad.
// Must be called to get the newest gamepad data.
function updateGamepad(gamepad) {
    const index = findGamepadIndex(gamepad)
    if (index != -1) {
        gamepads[index] = gamepad
    }
}

// Initializes the MIDI player.
function initializePlayer() {
    player.value = new Player()
    player.value.setMidiIO(midiIO.value)
    player.value.setPlayerDisplay(playerDisplay)
}

// Call this function to display "count-in" info.
function runCountIn(deltaTime) {
    counter += deltaTime
    if (counter >= countInTime) {
        showCountIn.value = false
        player.value.startStop()
    } else {
        progress.value = (100 * counter) / countInTime
    }
}

// This is the function that drives the musical interpretation.
function beat(deltaTime) {
    player.value.clock(deltaTime)
    gamepadHandler.value.clock?.(deltaTime)
    if (showCountIn.value == true) {
        runCountIn(deltaTime)
    }
}

// The timer we use to run this app.
function startTimer() {
    clock = new Clock(beat)
    clock.start()
}

// Stops the timer.
function stopTimer() {
    if (clock != null) {
        clock.stop()
    }
}

// Gets the most recent log from Verovio and pass it to our log system.
function addLog() {
    const log = verovioToolkit.getLog()
    logfile.value.addLog(log)
}

// Gets the pages of the score.
async function getPages() {
    const pages = verovioToolkit.getPageCount()
    var pageArray = []
    for (let page = 1; page <= pages; page++) {
        console.log(`Loading page ${page} of ${pages}`)
        // progress.value = Math.round(100 * (page / pages))
        await nextTick()
        pageArray.push(`<!-- Page ${page} -->`)
        pageArray.push(verovioToolkit.renderToSVG(page))
        addLog()
    }
    svg.value = pageArray.join('\n')
}

// Starts parsing a score file
function parseScore(name) {
    try {
        logfile.value.openEntry()
        logfile.value.addFilename(name)
        const data = verovioToolkit.getMEI()
        addLog()
        if (data != null) {
            getPages()
            const noteData = meiParser(data)
            publishNoteData(noteData)
            mei.value = data
        }
        hideWaitCursor()
    } catch (error) {
        alert(`Error parsing score: ${error}`)
    }
}

// Lets Verovio load zip data from a buffer.
function loadZipDataBuffer(buffer) {
    verovioToolkit.loadZipDataBuffer(buffer, buffer.size)
}

// Loads score data from a string.
function loadData(string) {
    verovioToolkit.loadData(string)
}

// Converts a score file.
// Uses a converter service from the server.
function convertScore(buffer, name) {
    const service = new ConverterService()
    service.convert(buffer, 'mscore').then((content) => {
        loadZipDataBuffer(content)
        parseScore(name)
    })
}

// Loads score data from a buffer considering different data formats.
function loadFromBuffer(buffer, name) {
    let extension = fileExtension(name)
    switch (extension) {
        case 'mxl':
            loadZipDataBuffer(buffer)
            parseScore(name)
            break
        case 'mscz':
            console.log(`Convert file "${name}"`)
            convertScore(buffer, name)
            break
        default:
            loadData(buffer)
            parseScore(name)
    }
}

// Loads a score from an URL.
async function loadScore(url) {
    const buffer = await getDataFromURL(url)
    loadFromBuffer(buffer, url)
}

// Loads score data from an URL.
async function getDataFromURL(url) {
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`)
        }
        if (['mxl', 'mscz'].includes(fileExtension(url))) {
            return await response.arrayBuffer()
        } else {
            return await response.text()
        }
    } catch (error) {
        console.error(error.message)
    }
}

// Reads a score file considering the data format.
function readFile(file) {
    const reader = new FileReader()
    reader.onload = () => {
        const content = reader.result
        loadFromBuffer(content, file.name)
    }
    reader.onerror = () => {
        console.log('Error reading the file. Please try again.', 'error')
    }
    if (['mxl', 'mscz'].includes(fileExtension(file.name))) {
        reader.readAsArrayBuffer(file)
    } else {
        reader.readAsText(file)
    }
}

// Publishes note data.
function publishNoteData(noteData) {
    const composer = noteData.meta.composer
    const titles = noteData.meta.titles
    flashWork(composer, titles)
    setNoteData(noteData)
    logfile.value.addComposer(composer)
    logfile.value.addTitles(titles)
    if (noteData.meta.verses != null) {
        logfile.value.addVerses(noteData.meta.verses)
    }
}

// Flashes the title of the score for a short time.
function flashWork(composer, titles) {
    workFlash.composer = composer
    workFlash.titles = titles
    // Only show on selected screens
    const path = router.currentRoute.value.path
    if (['/score', '/conductor', '/repertoire'].includes(path)) {
        showWork.value = true
        setTimeout(() => {
            showWork.value = false
        }, 3000)
    }
}

// Presents an open URL dialog.
function openURL() {
    showOpenURL.value = true
}

// Closes the open URL dialog.
function closeUrlPanel() {
    showOpenURL.value = false
}

// Saves the entered URL from the dialog.
function saveUrl(url) {
    console.log('saveUrl', url)
    repertoireURL.value = url
    parseRepertoire(url)
}

// Opens a transpose dialog.
function openTransposeDialog() {
    showTransposeDialog.value = !showTransposeDialog.value
}

// Closes the transpose dialog.
function closeTransposeDialog() {
    showTransposeDialog.value = false
}

// Selects the first entry in the list of scores.
function selectFirstEntry() {
    selectCurrentLevel(workTree.name)
    selectScore(scoreFiles[0])
}

// Initializes the repertoire.
function initializeRepertoire() {
    parseRepertoire(repertoireURL.value)
}

// Publishes cover files
function setCoverFiles(work) {
    coverFiles.splice(0)
    const cover = work.children.filter((e) => {
        return isCoverFile(e.name) && e.type == 'file'
    })
    if (cover.length == 0) {
        if (work.parent != null) {
            setCoverFiles(work.parent)
        }
    } else {
        cover.forEach((e) => {
            coverFiles.push(e)
        })
    }
}

/*
 *  Accessing the musical repertoire.
 */

// Builds a tree from the root URL.
async function buildUrlTree(url, parent) {
    const directory = { children: [], parent: parent }
    if (parent == null) {
        directory.type = 'root'
        directory.name = getLastPathSegment(url)
    }
    let json = await getDirectory0(url)
    if (json != null) {
        for (const record of json) {
            if (record.type == 'directory') {
                const dir = await buildUrlTree(url + record.name + '/', directory)
                dir.url = url
                dir.name = record.name
                dir.type = 'directory'
                directory.children.push(dir)
            } else {
                let file = { url, name: record.name, type: 'file' }
                directory.children.push(file)
            }
        }
    }
    return directory
}

// Builds a tree from a list of files.
function buildFileTree(files) {
    const root = { children: [], type: 'root' }
    for (const file of files) {
        let directory = root
        const path = file.webkitRelativePath || file.fullPath
        const segments = path.split('/').filter((segment) => {
            return segment.length > 0
        })
        let n = 0
        let segment = segments[n]
        while (segment != null) {
            // first segment
            if (n == 0) {
                directory.name = directory.name || segment
            }
            // last segment
            else if (n == segments.length - 1) {
                const dir = {
                    file: file,
                    name: segment,
                    type: 'file',
                }
                directory.children.push(dir)
            }
            // segments inbetween
            else {
                let child = directory.children.find((child) => {
                    return child.name == segment
                })
                if (child == null) {
                    child = {
                        parent: directory,
                        children: [],
                        name: segment,
                        type: 'directory',
                    }
                    directory.children.push(child)
                }
                directory = child
            }
            segment = segments[(n += 1)]
        }
    }
    return root
}

// Filters hidden files.
// This applies to files from any sources whose name starts with a dot.
function filterHiddenFiles(files) {
    return files.filter((e) => {
        const path = e?.webkitRelativePath ?? e?.fullPath
        return e.name[0] != '.' && (path ? path.indexOf('/.') == -1 : true)
    })
}

// Parses the repertoire by URL.
async function parseRepertoire(url) {
    workTree = await buildUrlTree(url)
    presentScoreData(workTree)
    selectFirstEntry()
}

// Parses the repertoire from a file list
function setRepertoire(files) {
    scoreDirectories.splice(0)
    files = filterHiddenFiles(files)
    workTree = buildFileTree(files)
    sortTree(workTree)
    presentScoreData(workTree)
    selectFirstEntry()
}

// Presents the score data.
function presentScoreData(workTree) {
    currentWork = workTree
    setCoverFiles(workTree)
    presentDirectories(workTree)
}

// Presents the score directories.
function presentDirectories(work) {
    if (work == null) {
        return
    }
    let tempDirs = []
    if (work instanceof Array) {
        work.forEach((entry) => {
            if (entry.type == 'directory' || entry.type == 'root') {
                tempDirs.push(entry)
            }
        })
    } else {
        tempDirs.push(work)
    }
    if (tempDirs.length > 0) {
        scoreDirectories.splice(0)
        scoreDirectories.push(...tempDirs)
    }
}

// Presents the files.
function presentFiles(work) {
    const files = collectFiles(work)
    scoreFiles.splice(0)
    scoreFiles.push(...files)
    setCoverFiles(work)
}

// Collects all files from a work tree.
function collectFiles(work) {
    let files = []
    work = work || currentWork
    if (work.children) {
        work.children.forEach((entry) => {
            if (entry.type == 'directory') {
                files = files.concat(collectFiles(entry))
            } else if (entry.type == 'file' && isScoreFile(entry.name)) {
                files.push(entry)
            }
        })
    }
    return files
}

// Gets the last path segment from an URL.
function getLastPathSegment(url) {
    return url
        .split('/')
        .filter((e) => {
            return e.length
        })
        .pop()
}

// Bubbles up a tree to find a directory by name.
function findDirectoryByName(name) {
    let work = currentWork
    while (work != null) {
        const dir = _findDirectoryByName(work, name)
        if (dir != null) {
            return dir
        }
        work = work.parent
    }
}
// Tries to find a directory including its children.
function _findDirectoryByName(work, name) {
    if (work.name == name) {
        return work
    }
    return work.children.find((dir) => {
        return dir.name == name
    })
}

// Moves one step up in tree.
function toUpperLevel() {
    if (currentWork.parent != null) {
        currentWork = currentWork.parent
    }
    presentDirectories(currentWork)
    selectedScoreDirectory.value = null
}

// Moves one step down in tree.
function toLowerLevel() {
    presentDirectories(currentWork.children)
}

// Selects the current level in a tree.
function selectCurrentLevel(name) {
    const dir = findDirectoryByName(name)
    currentWork = dir
    selectedScoreDirectory.value = dir
    presentFiles(currentWork)
}

// Gets the MuseScore version number.
// Currently not used since CORS is not enabled.
function queryConverterService() {
    const service = new ConverterService()
    service.getVersion().then((version) => {
        console.log('Version:', version)
    })
}

// Selects a directory.
function selectDirectory(directory) {
    console.log('dir', directory)
    scoreDirectories.splice(0)
    currentWork.children.forEach((child) => {
        console.log('child', child)
        if (child.type == 'directory') {
            scoreDirectories.push(child)
        }
    })
}

// Selects a score.
function selectScore(score) {
    if (score != null) {
        showWaitCursor()
        if (score.url != null) {
            loadScore(score.url + score.name)
        } else {
            if (score.file?.file != null) {
                score.file.file((file) => {
                    readFile(file)
                })
            } else {
                readFile(score.file)
            }
        }
        selectedScoreFile.value = score
    }
}

// Reloads a score
function reloadScore() {
    selectScore(selectedScoreFile.value)
}

// Sorts files by name (in ascneding order).
function sortFilesByName(files) {
    files?.sort((a, b) => {
        if (a.name < b.name) {
            return -1
        }
        if (a.name > b.name) {
            return 1
        }
        return 0
    })
}

// We currently do not set the window to the score document.
// The window contains the app rather than a score.
function setTitle(title) {
    document.title = title
}

// Changes the score from a score list.
function changeTitle(skip) {
    const index = scoreFiles.indexOf(selectedScoreFile.value) + skip
    if (index >= 0 && index < scoreFiles.length) {
        selectScore(scoreFiles[index])
    }
}

/*
 * Player controls.
 */

// Changes to the previous title.
function previousTitle() {
    changeTitle(-1)
    player.value.stop()
}

// Changes to the next title.
function nextTitle() {
    changeTitle(1)
    player.value.stop()
}

// Moves to the beginning of the score.
function rewindTitle() {
    player.value.rewind()
}

// Starts or stops the player.
function startStop() {
    if (player.value.isAtBeginning() && showCountIn.value == false) {
        showCountIn.value = true
        showWork.value = false
        progress.value = 0
        counter = 0
    } else {
        showCountIn.value = false
        player.value.startStop()
    }
}

// Navigates stepweise in a navigation list.
function navigateStep(step) {
    const routes = router.getRoutes()
    const path = router.currentRoute.value.path
    const index = routes.findIndex((route) => {
        return route.path == path
    })
    if (index != -1) {
        const nextRoute = routes[index + step]
        if (nextRoute != null) {
            console.log('next route:', nextRoute)
            router.push({ path: nextRoute.path })
        }
    }
}

// Navigates one step up.
function navigateUp() {
    navigateStep(-1)
}

// Navigates one step down.
function navigateDown() {
    navigateStep(1)
}

// Navigates to the left (only for small devices).
function navigateLeft() {
    navigation.moveBack()
}

// Navigates to the right (only for small devices).
function navigateRight() {
    navigation.moveForward()
}

// Sets the ornament type (Barock or Classic)
function setOrnamentType(ornamentType) {
    player.value.setOrnamentType(ornamentType)
}

// Sets the color style for the score.
function setColorStyle(colorStyle) {
    // svgAdditionalAttribute: 'layer@n'
    const clonedOptions = Object.assign({}, options)
    if (colorStyle == true) {
        clonedOptions.svgAdditionalAttribute = 'layer@n'
    } else {
        delete clonedOptions.svgAdditionalAttribute
    }
    verovioToolkit.resetOptions()
    verovioToolkit.setOptions(clonedOptions)
    reloadScore()
}

// Transposes a score.
function transposeScore(transposeValue) {
    const clonedOptions = Object.assign({}, options)
    if (transposeValue != 0) {
        clonedOptions.transpose = String(transposeValue)
    } else {
        delete clonedOptions.transpose
    }
    console.log(clonedOptions)
    verovioToolkit.resetOptions()
    verovioToolkit.setOptions(clonedOptions)
    reloadScore()
}

// Sorts a tree of score files.
function sortTree(tree) {
    sortFilesByName(tree.children)
    tree.children?.forEach((entry) => {
        sortTree(entry)
    })
}

// Stores a reference to the score data.
function setNoteData(data) {
    player.value.setNoteData(data)
    noteData.noteData = data
    configureDispatcher()
}

// Checks if it is a score file.
function isScoreFile(name) {
    return ['mxl', 'mei', 'musicxml', 'xml', 'mscz'].includes(fileExtension(name))
}

// Checks if it is a cover file.
function isCoverFile(name) {
    return !isScoreFile(name) && name[0] != '.'
}

// Parses the repertoire.
async function getDirectory(url) {
    try {
        const response = await fetch(url)
        if (response.ok) {
            return await response.json()
        }
    } catch (_e) {
        // console.error(e)
    }
}

// Either gets the index from an index file or from the server.
async function getDirectory0(url) {
    let directory
    if (url.startsWith('./')) {
        directory = await getDirectory(url + 'index.json')
    } else {
        directory = await getDirectory(url)
    }
    return directory
}

// Presents the wait cursor.
function showWaitCursor() {
    document.body.classList.add('wait')
}

// Hides the wait cursor.
function hideWaitCursor() {
    document.body.classList.remove('wait')
}
</script>

<template>
    <AboutPanel />
    <ToolBar
        @set-repertoire="setRepertoire"
        @initialize-repertoire="initializeRepertoire"
        @open-url="openURL"
        @previous-title="previousTitle"
        @next-title="nextTitle"
        @rewind-title="rewindTitle"
        @start-stop="startStop"
        @set-ornament-type="setOrnamentType"
        @set-color-style="setColorStyle"
        @open-transpose-dialog="openTransposeDialog"
    />
    <NavigationPanel />
    <RouterView />
    <WorkFlash v-if="showWork" :work="workFlash" />
    <CircularProgress v-if="showCountIn" />
    <OpenURL v-if="showOpenURL" @close-url-panel="closeUrlPanel" @save-url="saveUrl" />
    <TransposeDialog
        v-if="showTransposeDialog"
        @close-transpose-dialog="closeTransposeDialog"
        @transpose-score="transposeScore"
    />
</template>

<style scoped>
.logo {
    display: block;
    margin: 0 auto 2rem;
}
</style>
