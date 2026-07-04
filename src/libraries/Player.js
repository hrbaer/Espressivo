/*
 * P L A Y E R
 * 2026-03-16
 */

// Forces a value to be in a given range.
Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max)
}

// Number with 2 digits and leading zero.
function n00(n) {
    return String(n).padStart(2, '0')
}

// Creates a copy of a note.
function copyNote(note) {
    return {
        duration: note.duration,
        id: note.id,
        index: note.index,
        kind: note.kind,
        measure: note.measure,
        midi: note.midi,
        number: note.number,
        pitch: note.pitch,
        staff: note.staff,
        voice: note.voice,
    }
}

// Setting determines the execution of trills.
const ornamentTypes = ['barock', 'classic']

import Trill from './Trill.js'
import Turn from './Turn.js'
import Mordent from './Mordent.js'
import LongMordent from './LongMordent.js'
import { Kind, Fifths } from './mei-parser.js'

const staccatoNotesRatio = 70 / 100
const staccatissimoNotesRatio = 50 / 100
const marcatoNotesRatio = 80 / 100

/*
 *  P L A Y E R
 *
 *  This is the heart of the app.
 *  - Gets the parsed notes
 *  - Runs the clock
 *  - Processes controller input
 *  - Creates MIDI events
 *
 */
export default class Player {
    constructor() {
        this.currentMeasure = 0.0
        this.maxMeasure = 1.0
        this.currentTime = 0.0
        this.currentMeter = { count: 4, unit: 4 }
        this.currentTempo = 120
        this.currentKey = '0'
        this.noteIndex = 0
        this.currentNote = null
        this.running = false
        this.pausing = true
        this.wasPausing = true
        this.playingNotes = []
        this.tempoRate = 0
        this.velocityValues = [42]
        this.articulationRates = []
        this.pedals = []
        this.ornaments = []
        this.ornamentType = ornamentTypes[0]

        this.markerIndex = 0
        this.endingEndIndex = 0
        this.pendingRepeat = false
        this.pendingMarker = false
        this.fromMarker = false
        this.repeatNum = 1
        this.numRepeats = 2
        this.endingNums = new Set()
        this.currentSection = 0

        this.multiChannel = false
    }

    // Sets the parsed note data.
    setNoteData(noteData) {
        this.noteData = noteData
        this.resetPlayer()
    }

    // Return the currently used note data.
    getNoteData() {
        return this.noteData
    }

    // Sets the MIDI output and input handler.
    setMidiIO(midiIO) {
        this.midiIO = midiIO
    }

    // Holds a reference to the player display
    setPlayerDisplay(playerDisplay) {
        this.playerDisplay = playerDisplay
    }

    // Gets the next note.
    getNextNote() {
        // First look for pending ornamental notes
        const ornamentalNote = this.getOrnamentalNote()
        if (ornamentalNote != null) {
            return ornamentalNote
        }

        const notes = this.noteData.notes
        const note = notes[this.noteIndex]

        if (note == null) {
            this.stop()
        } else if (note.measure <= this.currentMeasure) {
            this.noteIndex += 1
            return note
        }
    }

    // Gets the note that needs to be stopped.
    getStopNote() {
        const stopNoteIndex = this.playingNotes.findIndex((note) => {
            return note.measure + note.duration * this.getArticulation(note) <= this.currentMeasure
        })
        if (stopNoteIndex >= 0) {
            return this.playingNotes.splice(stopNoteIndex, 1)[0]
        }
    }

    // Adds a note to the list of currently playing notes.
    addPlayingNote(note) {
        this.playingNotes.push(note)
    }

    // Handles the playing of a note.
    handleNote(note) {
        note = this.articulateNote(note)
        this.playNote(note)
        this.addPlayingNote(note)
    }

    // Finds a currently active setting
    findElement(elements, measure) {
        return elements.findLast((e) => {
            return e.measure <= measure
        })
    }

    // Updates the currently acitve tempo.
    handleTempo(measure) {
        let element = this.findElement(this.noteData.tempi, measure)
        if (element) {
            this.currentTempo = element.tempo
        }
    }

    // Updates the currently acitve measure.
    handleMeter(measure) {
        let element = this.findElement(this.noteData.meters, measure)
        if (element) {
            this.currentMeter.count = element.count
            this.currentMeter.unit = element.unit
        }
    }

    // Sets the current key.
    handleKey(measure) {
        let element = this.findElement(this.noteData.keys, measure)
        if (element) {
            this.currentKey = element.fifths
        }
    }

    // Handles the measure update.
    handleMeasure(measure) {
        this.handleTempo(measure.measure)
        this.handleMeter(measure.measure)
        this.handleKey(measure.measure)
        this.playerDisplay.bar = measure.number
        this.playerDisplay.tempo = this.currentTempo
        this.playerDisplay.meter = `${this.currentMeter.count}/${this.currentMeter.unit}`
        this.playerDisplay.key = Fifths[this.currentKey]
    }

    // Returns the fraction of a measure since the last clock.
    getDeltaMeasure(deltaTime) {
        const meter = this.currentMeter.count / this.currentMeter.unit
        return (deltaTime * this.currentTempo * (1 + this.tempoRate / 100)) / (4 * meter * 60000)
    }

    // Gets the number of beats.
    get numBeats() {
        return this.currentMeter.count
    }

    /**
     *  Repeatedly called.
     *  Delta time in milliseconds.
     */
    clock(deltaTime) {
        if (!this.pausing) {
            const deltaMeasure = this.getDeltaMeasure(deltaTime)
            let note
            // Stop previous notes.
            while ((note = this.getStopNote()) != null) {
                this.stopNote(note)
            }
            // Play next notes.
            while ((note = this.getNextNote()) != null) {
                if (this.initOrnaments(note, deltaMeasure, deltaTime)) {
                    break
                }
                if (note.kind == Kind.note) {
                    this.handleNote(note)
                } else if (note.kind == Kind.measure) {
                    if (this.processMeasure(note) == false) {
                        return
                    }
                    this.handleMeasure(note)
                }
            }
            // Handle incomplete measures such as up-beats or endings
            if (this.currentMeasure >= this.maxMeasure) {
                this.currentMeasure = Math.ceil(this.currentMeasure)
            }

            this.currentMeasure += deltaMeasure
            this.currentTime += deltaTime
            this.setPlaytime()
            this.setBeat()
        }
    }

    // Processes a measure.
    processMeasure(measure) {
        // Handling of marker takes precedence
        if (this.pendingMarker == true) {
            this.jumpToNote(this.markerIndex)
            this.pendingMarker = false
            return false
        }
        // Handle repeats only if there is no marker such as dacapo or dalsegno.
        if (this.pendingRepeat == true && this.fromMarker == false) {
            this.repeatNum += 1
            this.jumpToNote(this.repeatStartIndex)
            this.pendingRepeat = false
            return false
        }
        // Handle musical settings
        this.meter = this.findParams(measure.measure, this.noteData?.meters)

        const tempo = this.findParams(measure.measure, this.noteData?.tempi)
        let ratio = this.meter.unit / this.meter.count
        this.tempo = Math.round(tempo.tempo * ratio) + this.tempoChange

        this.key = this.findParams(measure.measure, this.noteData?.keys)

        // bar = getBarNumber(measure)
        if (measure.duration > 0) {
            this.maxMeasure = measure.measure + measure.duration
        }

        // Process notations
        return this.processNotations(measure)
    }

    // Processes notations.
    // Notations are additional information for notes and measures
    processNotations(measure) {
        if (measure.notations?.length > 0) {
            const expansion = this.getExpansions()
            if (expansion != null) {
                const startSection = this.getNotationValue(measure, 'startsect')
                if (startSection != null) {
                    this.processStartSection(startSection, expansion)
                }
                const endSection = this.getNotationValue(measure, 'endsect')
                if (endSection != null) {
                    this.processEndSection(endSection, expansion)
                }
            } else {
                // Bar line to the left
                this.processRepeatStartNotation(measure)

                // Ending of an ending
                this.processEndEndingNotation(measure)

                // Beginning of an ending
                if (this.processStartEndingNotation(measure) == true) {
                    // Bar line to the right
                    if (this.processRepeatEndNotation(measure) == true) {
                        // When no repeats are pending look for da capos
                        this.processInstructionType(measure)
                    }
                }
            }
        }
        return true
    }

    // Processes instructions.
    processInstructionType(measure) {
        const param = this.getNotationValue(measure, 'type')
        if (param == null) {
            return
        }

        switch (param) {
            case 'dacapo':
                // Should we allow dacapo if repeating is disabled?
                if (this.fromMarker == false) {
                    // make sure there is only one da capo
                    this.markerIndex = 0
                    this.pendingMarker = true
                    this.fromMarker = true
                    this.repeatNum = 1
                }
                break

            case 'dalsegno':
                // Dalsegno is only considered when there is no pending repeat.
                if (this.pendingRepeat == false) {
                    const measure = this.findMeasureWithNotation('type', 'segno')
                    if (measure != null) {
                        this.markerIndex = measure.index - 1
                        this.pendingMarker = true
                        this.fromMarker = true
                        this.repeatNum = 1
                    }
                }
                break

            case 'tocoda':
                if (this.fromMarker == true) {
                    const measure = this.findMeasureWithNotation('type', 'coda')
                    if (measure != null) {
                        this.markerIndex = measure.index - 1
                        this.pendingMarker = true
                        this.repeatNum = 1
                    }
                }
                break

            case 'segno':
                if (this.pendingRepeat == false) {
                    // Run for each verse
                    const n = this.getNotationValue(measure, 'n')
                    if (n != null) {
                        this.numRepeats = parseInt(n)
                        const segnoMeasure = this.findMeasureWithNotation('type', 'segno')
                        if (segnoMeasure != null) {
                            // Find out if there is a previous segno
                            if (segnoMeasure.index < measure.index) {
                                if (this.repeatNum < this.numRepeats) {
                                    this.repeatNum += 1
                                    this.markerIndex = segnoMeasure.index - 1
                                    this.pendingMarker = true
                                    this.fromMarker = true
                                }
                            } else {
                                this.fromMarker = this.repeatNum == this.numRepeats
                            }
                        }
                        print('Repeats', this.repeatNum, this.numRepeats)
                    }
                }
                break

            case 'fine':
                if (this.pendingRepeat == false) {
                    if (this.fromMarker == true) {
                        // Just jump to the last note which is a measure.
                        const index = this.noteData?.notes.count
                        if (index != null) {
                            this.markerIndex = index - 1
                            this.pendingMarker = true
                            this.fromMarker = false
                        }
                    }
                }
        }
    }

    // Processes repeat end.
    processRepeatEndNotation(measure) {
        if (this.fromMarker == false) {
            if (this.hasNotation(measure, 'right', 'rptend')) {
                this.repeatEndMeasure = measure.measure
                const n = this.getNotationValue(measure, 'n')
                if (n != null) {
                    this.numRepeats = parseInt(n) ?? this.numRepeats
                }
                if (this.repeatNum < this.numRepeats) {
                    this.pendingRepeat = true
                    return false
                } else {
                    this.repeatStartIndex = this.findNextMeasureIndex(measure.index - 1)
                    this.repeatNum = 1
                }
            }
            if (this.hasEndNotation(measure)) {
                if (this.getNotationValue(measure, 'type') == null) {
                    this.repeatStartIndex = this.findNextMeasureIndex(measure.index - 1)
                    this.repeatNum = 1
                    // TODO: Check if any side-effects.
                    this.endingNums.clear()
                    return false
                }
            }
        }
        return true
    }

    // Processes start of ending.
    processStartEndingNotation(measure) {
        const startending = this.getNotationValue(measure, 'startending')
        if (startending != null) {
            // After a da capo jump to the last ending
            if (this.fromMarker == true) {
                const type = this.getNotationValue(measure, 'type')
                if (type != 'tocoda') {
                    if (this.jumpToLastEnding(measure)) {
                        return false
                    }
                }
            } else {
                this.endingNums.union(new Set(startending.split(' ')))
                // When exhausted, jump to next ending
                if (this.repeatNum > this.endingNums.count) {
                    this.pendingRepeat = false
                    this.jumpToNote(this.endingEndIndex)
                    return false
                }
            }
        }
        return true
    }

    // Processes end of ending.
    processEndEndingNotation(measure) {
        const endending = this.getNotationValue(measure, 'endending')
        if (endending != null) {
            if (this.hasNotation(measure, 'volta', 'open')) {
                this.endingEndIndex = measure.index
                return
            }
            this.endingEndIndex = this.findNextMeasureIndex(measure.index)
            this.repeatEndMeasure = measure.measure
        }
    }

    // Processes repeat starts.
    processRepeatStartNotation(measure) {
        if (this.hasNotation(measure, 'left', 'rptstart')) {
            this.repeatStartIndex = measure.index - 1
            if (this.repeatEndMeasure < measure.measure) {
                // first enter ||:
                this.repeatNum = 1
                this.endingNums.clear()
            }
        }
    }

    // Processes the start of a section.
    processStartSection(section, expansion) {
        if (this.currentSection < expansion.count) {
            const id = expansion[this.currentSection]
            if (id != section) {
                const measure = this.findMeasureWithNotation('startsect', id)
                if (measure != null) {
                    this.jumpToNote(measure.index - 1)
                }
            }
        } else {
            this.jumpToEnd()
        }
    }

    // Processes the end of a section.
    processEndSection(section, expansions) {
        this.currentSection += 1
        if (this.currentSection < expansions.length) {
            const id = expansions[this.currentSection]
            const measure = this.findMeasureWithNotation('startsect', id)
            if (measure != null) {
                this.markerIndex = measure.index - 1
                this.pendingMarker = true
                this.fromMarker = true
                this.setRepeatNumberFromSection()
            }
        }
    }

    // For a given note the enclosing section is returned.
    findEnclosingSection() {
        return this.noteData?.notes.findLast((note) => {
            return (
                note.kind == Kind.measure &&
                note.index - 1 <= this.noteIndex &&
                this.getNotation(note, 'startsect') != null
            )
        })
    }

    // Sets the repeat start.
    setRepeatStart() {
        // If there are expansions, we also have to set the current section.
        if (this.hasExpansions) {
            const measure = this.findEnclosingSection()
            if (measure != null) {
                const label = this.getNotationValue(measure, 'startsect')
                if (label != null) {
                    // We choose the first section contained in the expansion list
                    const expansion = this.getExpansions()
                    if (expansion != null) {
                        this.currentSection = expansion.findIndex((exp) => {
                            return exp == label
                        })
                        this.setRepeatNumberFromSection()
                    }
                }
            }
        } else {
            this.repeatStartIndex = 0
            this.repeatNum = 1
            const measure = this.findPreviousRepeatStart()
            if (measure != null) {
                this.repeatStartIndex = measure.index - 1
            }
        }
    }

    // Gets the expansions.
    // Expansions tell what sections need to be playes.
    getExpansions() {
        return this.noteData.meta.expansions?.[0]
    }

    // Checks if sections are available.
    get hasExpansions() {
        return this.noteData.meta.expansions?.length > 0
    }

    // Gets the notation for a given key.
    getNotation(note, key) {
        return note.notations?.find((notation) => {
            return notation.params[key] != null
        })
    }

    // Gets a notation value for a given key.
    getNotationValue(note, key) {
        return this.getNotation(note, key)?.params[key]
    }

    // Checks if a notation includes a given key-value pair.
    hasNotation(note, key, value) {
        note.notations.includes((notation) => {
            return notation.params[key] == value
        })
    }

    // Checks if an end notation exists.
    hasEndNotation(measure) {
        return (
            this.hasNotation(measure, 'right', 'end') || this.hasNotation(measure, 'right', 'dbl')
        )
    }

    // Tells the player to jump to a given note.
    jumpToNote(index) {
        this.noteIndex = index
        this.currentMeasure = this.noteData?.notes[index].measure ?? 0.0
    }

    // Tells the player to jump to the endd of the music piece.
    jumpToEnd() {
        const index = this.noteData?.notes.count
        if (index != null) {
            this.jumpToNote(index - 1)
        }
    }

    // Sets the repeat number for a given sections
    setRepeatNumberFromSection() {
        const expansion = this.getExpansions()
        if (expansion != null) {
            const label = expansion[this.currentSection]
            this.repeatNum = 1
            for (let i = 0; i < this.currentSection; i++) {
                if (label == expansion[i]) {
                    this.repeatNum += 1
                }
            }
        }
    }

    // Looks for a measure including a given key-value pair.
    findMeasureWithNotation(key, value) {
        return this.noteData?.notes.find((note) => {
            return (
                note.kind == Kind.measure &&
                note.notations?.find((notation) => {
                    return notation.params[key] == value
                }) != null
            )
        })
    }

    // Finds the currently active parameter.
    findParams(measure, params) {
        if (measure < params[0]?.measure || params.length == 1) {
            return params[0]
        }
        if (measure >= params.slice(-1)[0]?.measure) {
            return params.slice(-1)[0]
        }
        const index = params.findIndex((param) => {
            return param.measure > measure
        })
        return params[index - 1]
    }

    // Finds a previous repeats start.
    findPreviousRepeatStart() {
        const measure = this.noteData?.notes.findLast((note) => {
            return (
                note.kind == Kind.measure &&
                note.index <= this.noteIndex &&
                (this.hasNotation(note, 'left', 'rptstart') || this.hasEndNotation(note))
            )
        })
        if (measure != null) {
            // An end notation starts at the following measure
            if (this.hasEndNotation(measure)) {
                return this.findFollowingMeasure(measure)
            }
            return measure
        }
        return null
    }

    // Resets the player.
    resetPlayer() {
        this.running = false
        this.pausing = true
        this.currentMeasure = 0.0
        this.currentTime = 0.0
        this.noteIndex = 0

        this.playingNotes.splice(0)
        const note = this.noteData.notes[this.noteIndex]
        this.currentNote = note
        this.currentMeasure = note.measure
        this.handleMeasure(note)
        this.processMeasure(note)
        this.setRepeatStart()
        this.playingNotes.push(note)

        this.markerIndex = 0
        this.endingEndIndex = 0
        this.pendingRepeat = false
        this.pendingMarker = false
        this.fromMarker = false
        this.repeatNum = 1
        this.numRepeats = 2
        this.endingNums = new Set()
        this.currentSection = 0
    }

    /*
     * Updates the player display.
     */

    // Sets the current play time.
    setPlaytime() {
        const playTime = this.currentTime
        const mins = Math.floor(playTime / 60000)
        const secs = n00(Math.floor(playTime / 1000) % 60)
        const tenths = Math.floor(playTime / 100) % 10
        this.playerDisplay.time = `${mins}:${secs}.${tenths}`
    }

    // Sets the number of beats
    setBeat() {
        const count = this.currentMeter.count
        const beat = Math.floor((this.currentMeasure % 1) * count) + 1
        this.playerDisplay.beat = beat
    }

    // Sets the current bar number
    setBar() {
        this.playerDisplay.bar = this.currentNote.number
    }

    // Updates the display.
    updateDisplay() {
        this.setPlaytime()
        this.setBeat()
        this.setBar()
    }

    // Sets the ornament type.
    setOrnamentType(ornamentType) {
        if (ornamentTypes.includes(ornamentType)) {
            this.ornamentType = ornamentType
        }
    }

    // Switches the ornament type.
    switchOrnamentType() {
        let index = ornamentTypes.indexOf(this.ornamentType)
        index = (index + 1) % ornamentTypes.length
        this.ornamentType = ornamentTypes[index]
    }

    // Sends a stop event.
    sendStopEvent() {
        window.dispatchEvent(new CustomEvent('playstop'))
    }

    // Starts running the player
    start() {
        if (!this.running) {
            this.playingNotes.splice(0)
            // this.currentMeasure = 0.0
            this.currentTime = 0.0
            this.running = true
        }
        this.pausing = false
    }

    // Stops the player.
    stop() {
        this.soundOff()
        this.resetPlayer()
        this.sendStopEvent()
    }

    // Starts of stops the player.
    startStop() {
        if (this.pausing) {
            this.start()
        } else {
            this.pause()
        }
        return !this.pausing
    }

    // Pauses the player.
    pause() {
        this.pausing = true
        this.soundOff()
    }

    // Resumes the player.
    resume() {
        this.pausing = false
    }

    // Temporarily pauses the player when app is in background.
    sleep(state) {
        // Go to sleep
        if (state == true) {
            this.wasPausing = this.pausing
            this.pause()
        }
        // Wake up
        else {
            if (!this.wasPausing) {
                this.resume()
            }
        }
    }

    // Rewinds the player.
    rewind() {
        this.stop()
        this.updateDisplay()
        this.setRepeatStart()
    }

    // Tell if the player is at the beginning.
    isAtBeginning() {
        return this.noteIndex == 0
    }

    // Selects a note.
    selectNote(noteId) {
        const index = this.noteData.notes.findIndex((note) => {
            return note.id == noteId
        })
        if (index >= 0) {
            const note = this.noteData.notes[index]
            this.currentTime = 0
            this.noteIndex = index
            this.currentMeasure = note.measure
            this.currentNote = note
            this.setRepeatStart()
            this.updateDisplay()
        }
    }

    // Selects a measure
    selectMeasure(measureId) {
        // We do not distinguish between notes and measures.
        this.selectNote(measureId)
    }

    // Controls the tempo
    controlTempo(tempoRate) {
        this.tempoRate = tempoRate
    }

    // Controls the velocity.
    controlVelocity(velocityValue) {
        this.velocityValues[0] = velocityValue
    }

    // Controls the staff velocity.
    controlVelocityStaff(velocity, staff) {
        if (this.velocityValues[staff] == null) {
            this.velocityValues[staff] = []
        }
        this.velocityValues[staff][0] = velocity
    }

    // Controls the staff and voice velocity.
    controlVelocityStaffVoice(velocity, staff, voice) {
        if (this.velocityValues[staff] == null) {
            this.velocityValues[staff] = []
        }
        this.velocityValues[staff][voice] = velocity
    }

    // Controls the staff articulation.
    controlArticulationStaff(articulation, staff) {
        this.articulationRates[staff] = articulation
    }

    // Controls the pedal
    controlPedal(which, pressed) {
        this.pedals[which] = pressed
        this.midiIO.setPedal(pressed)
    }

    // Clears controller values.
    clearControllers() {
        this.velocityValues.splice(1)
        this.articulationRates.splice(0)
        this.pedals.splice(0)
    }

    // Gets the velocity for a note.
    getVelocity(note) {
        return (
            this.velocityValues[0] +
            (this.velocityValues[note.staff]?.[0] ?? 0) +
            (this.velocityValues[note.staff]?.[note.voice] ?? 0)
        )
    }

    // Gets the articulation for a note.
    getArticulation(note) {
        return (
            1 -
            0.01 * ((this.articulationRates[0] ?? 0) + (this.articulationRates[note.staff] ?? 0))
        ).clamp(0.1, 1)
    }

    /// Articulates a note.
    /// - Parameter note: the note to articulate
    /// - Returns: The modified Note object
    articulateNote(note) {
        if (note.notations != null) {
            const notation = note.notations.find((notation) => {
                return notation.params['artic'] != null
            })
            if (notation != null) {
                const artic = notation.params['artic']
                const articNote = copyNote(note)
                if (artic == 'stacc') {
                    articNote.duration *= staccatoNotesRatio
                } else if (artic == 'stacciss') {
                    articNote.duration *= staccatissimoNotesRatio
                } else if (artic == 'marc') {
                    articNote.duration *= marcatoNotesRatio
                }
                return articNote
            }
        }
        return note
    }

    /// Initializes ornaments.
    /// - Parameters:
    ///   - note: The note to ornament
    ///   - deltaMeasure: The amount the measure advances
    /// - Returns: True if there is an ornament, false otherwise
    initOrnaments(note, deltaMeasure, deltaTime) {
        let hasOrnament = false
        if (note.notations != null) {
            for (const notation of note.notations) {
                // Add an ornament
                const params = notation.params
                const ornamentType = params['ornament']
                if (ornamentType != null) {
                    let ornament
                    const upper = parseInt(params['upper'])
                    const lower = parseInt(params['lower'])
                    const delay = parseFloat(params['delay'])
                    const beatTime = Math.floor(deltaTime / (deltaMeasure * this.numBeats))

                    switch (ornamentType) {
                        case 'mordent':
                            {
                                let midi = params['form'] == 'upper' ? upper : lower
                                if (params['long'] == 'true') {
                                    ornament = new LongMordent(
                                        note,
                                        this.numBeats,
                                        beatTime,
                                        midi,
                                        delay,
                                    )
                                } else {
                                    ornament = new Mordent(
                                        note,
                                        this.numBeats,
                                        beatTime,
                                        midi,
                                        delay,
                                    )
                                }
                            }
                            break

                        case 'trill':
                            ornament = new Trill(
                                note,
                                this.numBeats,
                                beatTime,
                                upper,
                                delay,
                                this.ornamentType,
                            )
                            break

                        case 'turn':
                            ornament = new Turn(note, this.numBeats, beatTime, upper, lower, delay)
                            break

                        default:
                            console.log('Unknown ornament:', notation.params)
                    }

                    if (ornament != null) {
                        this.ornaments.push(ornament)
                        hasOrnament = true
                    }
                }
            }
        }
        return hasOrnament
    }

    /// Gets the next ornamental note.
    /// - Returns: An optional Note object
    getOrnamentalNote() {
        let note
        for (const ornament of this.ornaments) {
            note = ornament.getNextNote(this.currentMeasure)
            if (note != null) {
                break
            }
        }
        this.releaseOrnaments()
        return note
    }

    /// Releases ornaments.
    releaseOrnaments() {
        // Remove exhausted ornaments
        if (this.ornaments.length) {
            this.ornaments = this.ornaments.filter((ornament) => {
                return !ornament.isExhausted()
            })
        }
    }

    // Switches between single and multi-channel MIDI output.
    setMultiChannel(multiChannel) {
        this.multiChannel = multiChannel
    }

    // Plays a note
    playNote(note) {
        const velocity = Math.round(this.getVelocity(note))
        const channel = this.multiChannel ? note.staff : 0
        this.midiIO?.noteOn(note.midi, channel, velocity)
        this.currentNote = note
    }

    // Stops a note
    stopNote(note) {
        const channel = this.multiChannel ? note.staff : 0
        this.midiIO?.noteOff(note.midi, channel)
    }

    // Turns the sound off.
    soundOff() {
        // console.log('sound off')
        // this.midiIO?.changeControl(120, 0)
        // this.midiIO?.changeControl(123, 0)
        for (let i = 0; i < 127; i++) {
            this.midiIO?.noteOff(i, 0)
        }
    }
}
