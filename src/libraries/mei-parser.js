/*
 *  M E I - P A R S E R
 *
 *  Parses a MEI file.
 *
 */

import xmlTools from './xml-tools.js'
import Music from './Music.js'

// Just skips the first character.
String.prototype.code = function () {
    return this.substring(1)
}

// Defines the type of notes.
export const Kind = Object.freeze({
    note: 0,
    rest: 1,
    measure: 2,
    invalid: 3,
})

// Describes the fifths code.
export const Fifths = Object.freeze({
    '7f': 'C♭/a♭',
    '6f': 'G♭/e♭',
    '5f': 'D♭/b♭',
    '4f': 'A♭/f',
    '3f': 'E♭/c',
    '2f': 'B♭/g',
    '1f': 'F/d',
    0: 'C/a',
    '1s': 'G/e',
    '2s': 'D/h',
    '3s': 'A/f♯',
    '4s': 'E/c♯',
    '5s': 'B/g♯',
    '6s': 'F♯/d♯',
    '7s': 'C♯/a♯',
})

// Parses a MEI document.
export default function (mei, file) {
    const parser = new DOMParser()

    const doc = parser.parseFromString(mei, 'text/xml')
    return parseMEI(doc, file)

    // Internal parser function.
    function parseMEI(doc, file) {
        // Maps accidental codes to MIDI pitch differences.
        const midiAccidentals = Object.freeze({
            ff: -2,
            f: -1,
            s: 1,
            ss: 2,
            x: 2,
        })

        const accidentals = ['𝄫', '♭', '♮', '♯', '𝄪']

        const steps = Object.freeze({
            A: 21,
            B: 23,
            C: 12,
            D: 14,
            E: 16,
            F: 17,
            G: 19,
        })

        // Returns a numeric value for the fifths code.
        function fifthValue(fifth) {
            fifth = fifth ?? '0'
            return fifth?.length < 2 ? 0 : Number(fifth[0]) * (fifth[1] == 'f' ? -1 : 1)
        }

        function getName(file) {
            return file.substring(file.lastIndexOf('/') + 1)
        }

        const shortNoteLength = 80
        const shortAppoggiaturaLength = 100
        const repeatedNotesPercentage = 75
        const removeIdenticalNotes = true
        const holdSameNotes = true
        const defaultTempo = 120.0
        const sameMeasure = 1e-3

        let noteData
        let notes = []
        let currentNote
        let currentMeasure = {}
        let currentTempo
        let currentMeter
        let currentChord
        let currentSection
        let currentStaff = 1
        let lastMeasureIndex = 0
        let currentKey
        let meters = []
        let tempi = []
        let keys = []
        let noteRefs = {}
        let ties = []
        let tremolo
        let measureNum = 0
        let measureFraction = 0.0
        let chords = []
        let ending
        let directive
        let pitch
        let quarterDivs
        let divisions = 0.0
        let position = 0.0
        let maxPosition = 0.0
        let tuplet
        let meta = { numStaffs: 0, titles: [], composer: getName(file) }
        let role
        let number = 0
        let beam = false
        let pagebreak = false
        let verses = []
        let verse
        let sylAttrs

        // console.log(doc)

        // Gets the pitch.
        function getPitch(attrs) {
            return {
                alter: midiAccidentals[attrs['accid.ges'] ?? attrs['accid'] ?? ''],
                octave: parseInt(attrs['oct.ges'] ?? attrs['oct'] ?? '0') ?? 0,
                step: (attrs['pname'] ?? 'a').toUpperCase(),
            }
        }

        // Gets the basic MIDI pitch from a note name.
        function getPitchSteps(name) {
            return steps[name] ?? 0
        }

        // Gets the accidental sign
        function getAccidentalSteps(alteration) {
            return alteration == null ? '' : accidentals[alteration + 2]
        }

        // Converts pitch notation to MIDI value.
        function pitchToMidi(pitch) {
            return getPitchSteps(pitch.step) + (pitch.alter ?? 0) + 12 * pitch.octave
        }

        // Converts pitch to scientific notation.
        function pitchToNotation(pitch) {
            return pitch.step + getAccidentalSteps(pitch.alter) + String(pitch.octave)
        }

        // Gets the measure fraction.
        function getMeasureFraction(attrs) {
            if (attrs) {
                // FIXME: consider dotted notes.
                if (!quarterDivs) {
                    const ppq = attrs['dur.ppq']
                    const dur = attrs['dur']
                    if (ppq != null && dur != null) {
                        quarterDivs = 0.25 * Number(ppq) * Number(dur)
                        divisions = getDivisionsPerMeasure()
                    }
                }
            }
            return position / divisions
        }

        // Calculates the number of divisions per measure.
        function getDivisionsPerMeasure() {
            // FIXME: Default (changed from 1.0 to 0.25)
            return (quarterDivs ?? 0.25) * getMeter() * 4
        }

        // Calculates the number of divisions from a dur attribute
        function getDivisions(length) {
            return divisions / (length * getMeter())
        }

        // Gets the meter value.
        function getMeter() {
            return (currentMeter?.count ?? 4) / (currentMeter?.unit ?? 4)
        }

        // Calculates the time per quarter.
        function getTimePerQuarter() {
            return 60000.0 / (currentTempo?.tempo ?? Math.round(defaultTempo))
        }

        // Calculates the time per measure in milliseconds.
        function getTimePerMeasure() {
            return 4 * getTimePerQuarter() * getMeter()
        }

        // Converts a tstamp to a measure.
        function tstampToMeasure(tstamp) {
            const meter = currentMeter ?? { count: 4 }
            return measureNum + (tstamp - 1.0) / meter.count
        }

        // Converts a tstamp2 attribute to a duration.
        function tstamp2ToDuration(tstamp2, index) {
            let duration
            const parts = tstamp2.split('m')
            const measures = Number(parts[0])
            const beats = Number(parts[1])
            if (!isNaN(measures) && !isNaN(beats)) {
                const fp = notes[index].measure % 1
                const meter = currentMeter ?? { count: 4 }
                duration = measures + (beats - 1.0) / meter.count - fp
            }
            return duration
        }

        // Converts time in milliseconds to duration.
        function time2duration(time) {
            return time / getTimePerMeasure()
        }

        // Calculates the duration from note attributes.
        function getDuration(attrs) {
            let duration = 0.0
            let dur = Number(attrs['dur.ppq'])
            if (!isNaN(dur)) {
                duration = dur
            } else if (attrs['grace'] == 'unacc') {
                duration = 0.0
            } else {
                dur = Number(attrs['dur'])
                if (!isNaN(dur)) {
                    duration = 1.0 / dur
                    const dots = Number(attrs['dots'])
                    if (!isNaN(dots)) {
                        if (dots == 1) {
                            duration = 1.5 * duration
                        } else if (dots == 2) {
                            duration = 1.75 * duration
                        }
                    }
                    dur = tuplet?.value
                    if (dur != null) {
                        duration *= dur
                    }
                }
            }
            return duration
        }

        // Adds a notation.
        function addNotation(attrs, keys) {
            const notation = { params: {} }
            for (const key of keys) {
                const value = attrs[key]
                if (value != null) {
                    notation.params[key] = value
                }
            }
            return notation
        }

        // Checks if a notation contains a given key-value pair.
        function hasNotation(notation, key, value) {
            // return notation.params.find((e) => e.key == key && e.value == value) != null
            return notation.params[key] == value
        }

        // Adds an ornament from name and attributes.
        function addOrnament(name, attrs) {
            const notation = addNotation(attrs, ['staff', 'form', 'long'])
            notation.params['ornament'] = name
            const ref = findNoteRef(attrs)
            const index = noteRefs[ref]
            if (ref != null && index != null) {
                const tstamp2 = attrs['tstamp2']
                if (tstamp2 != null) {
                    const duration = tstamp2ToDuration(tstamp2, index)
                    if (duration != null) {
                        notation.params['duration'] = String(duration)
                    }
                }
                const accidupper = attrs['accidupper']
                if (accidupper != null) {
                    notation.params['accidupper'] = accidupper
                }
                const accidlower = attrs['accidlower']
                if (accidlower != null) {
                    notation.params['accidlower'] = accidlower
                }
                addOrnamentIndex(notation, index)
            } else {
                const startid = attrs['startid']
                if (startid != null) {
                    const chord = chords.find((e) => e.ref === startid.code())
                    if (chord != null) {
                        for (const ref in chord.refs) {
                            const index = noteRefs[ref]
                            if (index != null) {
                                addOrnamentIndex(notation, index)
                            }
                        }
                    }
                }
            }
        }

        // Adds an ornament from notation and note index.
        function addOrnamentIndex(notation, index) {
            notation = structuredClone(notation)
            const midi = notes[index].midi
            const fifths = fifthValue(currentKey.fifths)
            const delay = time2duration(shortNoteLength)
            const accidupper = notation.params['accidupper']
            const accidlower = notation.params['accidlower']
            notation.params['upper'] = String(Music.upperDiatone(midi, fifths, accidupper))
            notation.params['lower'] = String(Music.lowerDiatone(midi, fifths, accidlower))
            notation.params['delay'] = String(delay)
            if (notes[index].notations == null) {
                notes[index].notations = []
            }
            notes[index].notations.push(notation)
        }

        // Adds syllable to text.
        function addSyllable(text) {
            let space = ''
            switch (sylAttrs['wordpos']) {
                case 's':
                case 't':
                    space = ' '
                    break
                default:
                    break
            }
            verse.text += text + space
        }

        // Creates a relative tuplet duration.
        function makeTuplet(attrs) {
            const num = Number(attrs['num'])
            if (!isNaN(num)) {
                const numBase = Number(attrs['numBase'])
                if (!isNaN(numBase)) {
                    tuplet = { value: numBase / num }
                }
            }
        }

        // Tries to find a note index from measure and staff.
        function findNoteRef(attrs) {
            let ref
            const startid = attrs['startid']
            if (startid != null) {
                ref = startid.code()
            } else {
                const tstamp = Number(attrs, 'tstamp')
                if (!isNaN(tstamp)) {
                    const measure = tstampToMeasure(tstamp)
                    const note = findNote(measure, parseInt(attrs, 'staff'))
                    if (note != null) {
                        ref = note.id
                    }
                }
            }
            return ref
        }

        // Tries to find a note from measure and staff.
        function findNote(measure, staff) {
            return notes.find((e) => e.staff === staff && isMeasureWithinNote(e, measure))
        }

        // Finds a bar by its measure number.
        function findMeasure(measure) {
            return notes.find((e) => e.kind == Kind.measure && Math.round(e.measure) == measure)
        }

        // Checks if a measure is within the note's duration.
        function isMeasureWithinNote(note, measure) {
            return measure >= note.measure && measure < note.measure + note.duration
        }

        // Expands fingered tremolo notes.
        function expandFingeredTremoloNotes() {
            const beams = tremolo.notation.params['beams']
            if (beams != null) {
                const measure = tremolo.notes[0].measure
                const duration = tremolo.notes[0].duration
                if (measure != null && duration != null) {
                    const meter = getMeter()
                    const n = Math.round(duration * meter * (4 << parseInt(beams)))
                    const f = 1.0 / n
                    for (let i = 0; i < n; i++) {
                        for (const note of tremolo.notes) {
                            const noteCopy = Object.assign({}, note)
                            if (i != 0) {
                                noteCopy.id = `${note.id}:${i})`
                            }
                            noteCopy.measure =
                                measure + f * (2 * i * duration + (noteCopy.measure - measure))
                            noteCopy.duration = duration * f
                            notes.push(noteCopy)
                        }
                    }
                }
            }
        }

        // Expands bowed tremolo notes.
        function expandBowedTremoloNotes() {
            const params = tremolo.notation?.params
            if (params != null) {
                const measure = tremolo.notes[0].measure
                const duration = tremolo?.notes[0].duration
                if (measure != null && duration != null) {
                    let stemMod = parseInt(params['stem.mod']?.[0])
                    stemMod = isNaN(stemMod) ? 1 : stemMod
                    const meter = getMeter()
                    let n = parseInt(duration * meter * (4 << stemMod))
                    if (tuplet != null) {
                        n = parseInt(n / tuplet.value)
                    }
                    const f = 1.0 / n
                    for (let i = 0; i < n; i++) {
                        for (const note of tremolo.notes) {
                            const noteCopy = Object.assign({}, note)
                            if (i != 0) {
                                noteCopy.id = ''
                            }
                            noteCopy.measure = measure + f * i * duration
                            noteCopy.duration = duration * f
                            notes.push(noteCopy)
                        }
                    }
                }
            }
        }

        const root = doc.documentElement
        if (root.nodeName !== 'mei') {
            throw new Error('Root element must be <mei>.')
        }
        const version = xmlTools.getAttribute(root, 'meiversion')
        console.log(`MEI version ${version}`)
        const children = root.childNodes
        for (const i in children) {
            const child = children[i]
            if (child.nodeType === Node.ELEMENT_NODE) {
                recursiveParser(child, startElement, endElement)
            }
        }
        processNotes()

        // Recursively runs the parser.
        function recursiveParser(node, startElement, endElement) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (startElement) {
                    startElement(node)
                }
                const children = node.childNodes
                for (const i in children) {
                    const child = children[i]
                    recursiveParser(child, startElement, endElement)
                }
                if (endElement) {
                    endElement(node)
                }
            }
        }

        // Function called when an element starts.
        function startElement(node) {
            switch (node.nodeName) {
                // MARK: Start accidental
                case 'accid':
                    {
                        const attrs = xmlTools.getAllAttributes(node)
                        const accid = attrs['accid'] ?? attrs['accid.ges']
                        if (accid != null) {
                            const alter = midiAccidentals[accid] ?? 0
                            if (alter != 0) {
                                pitch.alter = alter
                                currentNote.midi = pitchToMidi(pitch)
                                currentNote.pitch = pitchToNotation(pitch)
                            }
                        }
                    }
                    break

                // MARK: Start arpeggio
                case 'arpeg':
                    {
                        const plist = xmlTools.getAttribute(node, 'plist')
                        if (plist) {
                            const pitems = plist.split(' ') // plist is a space-separated list
                            // Collect all note indices of the arpeggio
                            for (const pitem of pitems) {
                                const noteIndices = []
                                const chord = chords.find((e) => {
                                    return e.ref == pitem.code()
                                })
                                if (chord != null) {
                                    for (
                                        let refIndex = 0;
                                        refIndex < chord.refs.length;
                                        refIndex++
                                    ) {
                                        const index = noteRefs[chord.refs[refIndex]]
                                        if (index) {
                                            noteIndices.push(index)
                                        }
                                    }
                                }
                                const total = noteIndices.length
                                // Sort the note indices by increasing midi values
                                noteIndices.sort((note0, note1) => note0.midi - note1.midi)
                                let num = 0
                                for (const index of noteIndices) {
                                    const delay = time2duration(shortNoteLength)
                                    const notation = { params: {} }
                                    notation.params['reposition'] = node.nodeName
                                    notation.params['index'] = `${num}/${total}`
                                    notation.params['delay'] = `${delay}`
                                    notes[index].notations = notes[index].notations ?? []
                                    notes[index].notations.push(notation)
                                    num += 1
                                }
                            }
                        }
                    }
                    break

                // MARK: Start artic
                case 'artic':
                    {
                        const attrs = xmlTools.getAllAttributes(node)
                        const notation = addNotation(attrs, ['artic'])
                        if (currentChord != null) {
                            currentChord.attrs['artic'] = attrs['artic']
                        } else {
                            currentNote.notations = currentNote.notations ?? []
                            currentNote.notations.push(notation)
                        }
                    }
                    break

                // MARK: Start beam
                case 'beam':
                    beam = true
                    break

                // MARK: Start bowed tremolo
                case 'bTrem':
                    {
                        const attrs = xmlTools.getAllAttributes(node)
                        const notation = addNotation(attrs, ['unitdur'])
                        tremolo = { notation: notation }
                    }
                    break

                // MARK: Start chord
                case 'chord':
                    {
                        const attrs = xmlTools.getAllAttributes(node)
                        const duration = getDuration(attrs)
                        const ref = attrs['xml:id']
                        if (ref != null) {
                            currentChord = {
                                value: duration,
                                attrs: attrs,
                                ref: ref,
                            }
                        }
                        if (tremolo) {
                            tremolo.notation.params['stem.mod'] = attrs['stem.mod']
                        }
                    }
                    break

                // MARK: Start directive
                case 'dir':
                    {
                        const attrs = xmlTools.getAllAttributes(node)
                        directive = addNotation(attrs, ['type', 'tstamp'])
                        directive.params['directive'] = node.nodName
                    }
                    break

                // MARK: Start ending
                case 'ending':
                    {
                        const attrs = xmlTools.getAllAttributes(node)
                        if (!meta.expansions) {
                            ending = { params: {} } // save ending since the measure does not yet exist
                            ending.params['startending'] = attrs['n']
                            if (attrs['lendsym'] == 'none') {
                                ending.params['volta'] = 'open'
                            }
                        } else {
                            currentSection = { label: attrs['xml:id'], start: true }
                        }
                    }
                    break

                // MARK: Start expansion
                case 'expansion':
                    {
                        const plist = xmlTools.getAttribute(node, 'plist')
                        if (plist != null) {
                            const expansion = plist.split(' ').map((e) => e.code())
                            meta.expansions = meta.expansions ?? []
                            meta.expansions.push(expansion)
                        }
                    }
                    break

                // MARK: Start fingered tremolo
                case 'fTrem':
                    {
                        const attrs = xmlTools.getAllAttributes(node)
                        const notation = addNotation(attrs, ['unitdur', 'beams'])
                        tremolo = { notation: notation }
                    }
                    break

                // MARK: Start key signature
                case 'keySig':
                    keys.push({
                        measure: measureNum,
                        staff: currentStaff,
                        fifths: xmlTools.getAttribute(node, 'sig'),
                    })
                    currentKey = keys.at(-1)
                    break

                // MARK: Start label
                case 'label':
                    break

                // MARK: Start layer
                case 'layer':
                    {
                        const voice = xmlTools.getAttributeValue(node, 'n', 1)
                        currentMeasure.voice = ((voice - 1) % 4) + 1
                        position = 0.0
                    }
                    break

                // MARK: Start measure
                case 'measure':
                    position = 0.0
                    maxPosition = 0.0
                    currentMeasure = {
                        id: xmlTools.getAttribute(node, 'xml:id'),
                        kind: Kind.measure,
                        measure: measureNum,
                        duration: 1.0,
                        pitch: 'M',
                        midi: 0,
                        number: xmlTools.getAttribute(node, 'n'),
                    }
                    if (!meta.expansions || meta.expansions.length === 0) {
                        const attrs = xmlTools.getAllAttributes(node)
                        const notation = addNotation(attrs, ['left', 'right'])
                        if (verses.length === 0 && attrs['right'] == 'rptend') {
                            notation.params['n'] = String(verses.length)
                        }
                        if (notation.params.length === 0) {
                            currentMeasure.notations.push(notation)
                        }
                        if (ending != null) {
                            currentMeasure.notations = currentMeasure.notations ?? []
                            currentMeasure.notations.push(structuredClone(ending))
                            self.ending = null
                        }
                    }
                    if (currentSection.start == true) {
                        const notation = { params: {} }
                        notation.params['startsect'] = currentSection.label
                        currentMeasure.notations = currentMeasure.notations ?? []
                        currentMeasure.notations.push(notation)
                        currentSection.start = false
                    }
                    {
                        const ref = xmlTools.getAttribute(node, 'xml:id')
                        if (ref != null) {
                            noteRefs[ref] = notes.length
                        }
                    }
                    if (pagebreak == true) {
                        const notation = { params: {} }
                        notation.params['pb'] = String(measureNum)
                        currentMeasure.notations = currentMeasure.notations ?? []
                        currentMeasure.notations.push(notation)
                        pagebreak = false
                    }
                    break

                // MARK: Start meter signature
                case 'meterSig':
                    currentMeter = {
                        measure: measureNum,
                        staff: currentStaff,
                        count: xmlTools.getAttributeValue(node, 'count', 4),
                        unit: xmlTools.getAttributeValue(node, 'unit', 4),
                    }
                    if (currentMeter.count == 0) {
                        currentMeter.count = currentMeter.unit
                    }
                    meters.push(currentMeter)
                    break

                // MARK: Start mordent
                case 'mordent':
                    addOrnament(node.nodeName, xmlTools.getAllAttributes(node))
                    break

                // MARK: Start mRest
                case 'mRest':
                    measureFraction = getMeasureFraction(xmlTools.getAllAttributes(node))
                    currentNote = {
                        id: xmlTools.getAttribute(node, 'xml:id'),
                        kind: Kind.rest,
                        measure: measureNum + measureFraction,
                        duration: 1.0 - measureFraction,
                        pitch: 'X',
                        midi: 0,
                        number: currentMeasure.number,
                        staff: currentMeasure.staff ?? 1,
                        voice: currentMeasure?.voice ?? 1,
                    }
                    position = divisions
                    break

                // MARK: Start mSpace
                case 'mSpace':
                    position = maxPosition
                    currentNote = {
                        id: xmlTools.getAttribute(node, 'xml:id'),
                        kind: Kind.rest,
                        measure: measureNum,
                        duration: position / divisions,
                        pitch: 'S',
                        midi: 0,
                        number: currentMeasure.number,
                        staff: currentMeasure.staff ?? 1,
                        voice: currentMeasure.voice ?? 1,
                    }
                    break

                // MARK: Start multi rest
                case 'multiRest':
                    {
                        const num = xmlTools.getAttributeValue(node, 'num', 1.0)
                        position = num * divisions
                    }
                    break

                // MARK: Start note
                case 'note':
                    {
                        const attrs = xmlTools.getAllAttributes(node)
                        measureFraction = getMeasureFraction(attrs)
                        let duration = getDuration(attrs)
                        if (currentChord) {
                            duration = currentChord.value ?? 0.0
                            currentChord.refs = currentChord.refs ?? []
                            currentChord.refs.push(attrs['xml:id'])
                        }
                        pitch = getPitch(attrs)
                        const staff = xmlTools.getAttributeValue(
                            node,
                            'staff',
                            currentMeasure.staff ?? 1,
                        )
                        currentNote = {
                            id: attrs['xml:id'],
                            kind: Kind.note,
                            measure: measureNum + measureFraction,
                            duration: duration / divisions,
                            midi: pitchToMidi(pitch),
                            pitch: pitchToNotation(pitch),
                            number: currentMeasure.number,
                            staff: staff,
                            voice: currentMeasure.voice ?? 1,
                        }
                        if (currentChord == null) {
                            position += duration
                        }
                        const ref = attrs['xml:id']
                        if (ref != null) {
                            noteRefs[ref] = notes.length
                        }
                        const grace = attrs['grace'] ?? currentChord?.attrs['grace']
                        if (grace != null) {
                            const notation = { params: {} }
                            notation.params['grace'] = grace
                            if (grace == 'acc') {
                                number += 1
                                if (beam == true) {
                                    currentNote.measure += number * 1e-6
                                }
                                const durAttr =
                                    xmlTools.getAttribute(node, 'dur') ??
                                    currentChord?.attrs['dur'] ??
                                    '1'
                                const dur = parseInt(durAttr)
                                const divs = getDivisions(dur)
                                const duration = beam
                                    ? time2duration(shortNoteLength)
                                    : divs / divisions
                                notation.params['steal'] = beam ? 'prev' : 'next'
                                notation.params['duration'] = String(duration)
                                const chord = currentChord
                                if (chord != null) {
                                    notation.params['chord'] = chord.ref
                                }
                            } else if (grace == 'unacc') {
                                const duration = time2duration(shortAppoggiaturaLength)
                                notation.params['grace'] = grace
                                notation.params['duration'] = String(duration)
                            }
                            currentNote.notations = currentNote.notations ?? []
                            currentNote.notations.push(notation)
                        } else {
                            number = 0
                        }
                        const visible = attrs['visible']
                        if (visible == 'false') {
                            const notation = addNotation(attrs, ['visible'])
                            currentNote.notations = currentNote.notations ?? []
                            currentNote.notations.push(notation)
                        }
                    }
                    break

                case 'ornam':
                    break

                // MARK: Start person name
                case 'persName':
                    role = xmlTools.getAttribute(node, 'role')
                    break

                // MARK: Start pagebreak
                case 'pb':
                    pagebreak = true
                    break

                // MARK: Start rest
                case 'rest':
                    {
                        const attrs = xmlTools.getAllAttributes(node)
                        measureFraction = getMeasureFraction(attrs)
                        const duration = getDuration(attrs)
                        currentNote = {
                            id: xmlTools.getAttribute(node, 'xml:id'),
                            kind: Kind.rest,
                            measure: measureNum + measureFraction,
                            duration: duration / divisions,
                            pitch: 'X',
                            midi: 0,
                            number: currentMeasure.number,
                            staff: currentMeasure.staff ?? 1,
                            voice: currentMeasure.voice ?? 1,
                        }
                        position += duration
                        const ref = attrs['xml:id']
                        if (ref) {
                            noteRefs[ref] = notes.length
                        }
                    }
                    break

                // MARK: Start score definition
                case 'scoreDef':
                    {
                        const ppq = xmlTools.getAttributeValue(node, 'ppq')
                        if (ppq != null) {
                            quarterDivs = ppq
                        }
                        const midiBpm = xmlTools.getAttributeValue(node, 'midi.bpm')
                        if (midiBpm != null) {
                            tempi.push({
                                measure: measureNum,
                                tempo: Math.round(midiBpm),
                            })
                            currentTempo = tempi.at(-1)
                        }
                    }
                    break

                // MARK: Start section
                case 'section':
                    currentSection = {
                        label: xmlTools.getAttribute(node, 'xml:id'),
                        start: true,
                    }
                    break

                // MARK: Start space
                case 'space':
                    {
                        measureFraction = getMeasureFraction(xmlTools.getAllAttributes(node))
                        const attrs = xmlTools.getAllAttributes(node)
                        const duration = getDuration(attrs)
                        currentNote = {
                            id: xmlTools.getAttribute(node, 'xml:id'),
                            kind: Kind.rest,
                            measure: measureNum + measureFraction,
                            duration: duration / divisions,
                            pitch: 'S',
                            midi: 0,
                            number: currentMeasure.number,
                            staff: currentMeasure.staff ?? 1,
                            voice: currentMeasure.voice ?? 1,
                        }
                        position += duration
                        const ref = attrs['xml:id']
                        if (ref) {
                            noteRefs[ref] = notes.count
                        }
                    }
                    break

                // MARK: Start staff
                case 'staff':
                    currentMeasure.staff = xmlTools.getAttributeValue(node, 'n', 1)
                    position = 0.0
                    break

                // MARK: Start staff definition
                case 'staffDef':
                    {
                        const ppq = xmlTools.getAttributeValue(node, 'ppq')
                        if (ppq != null) {
                            quarterDivs = ppq
                        }
                    }
                    currentStaff = xmlTools.getAttributeValue(node, 'n', 1)
                    meta.numStaffs = Math.max(meta.numStaffs, currentStaff)
                    break

                // MARK: Start staff group
                case 'staffGrp':
                    break

                // MARK: Start syllable
                case 'syl':
                    sylAttrs = xmlTools.getAllAttributes(node)
                    break

                // MARK: Start tempo
                case 'tempo':
                    {
                        const midiBpm = xmlTools.getAttributeValue(node, 'midi.bpm', defaultTempo)
                        if (midiBpm != null) {
                            let measure = measureNum
                            const tstamp = xmlTools.getAttributeValue(node, 'tstamp')
                            if (tstamp != null) {
                                measure = tstampToMeasure(tstamp)
                                if (tstamp > 1.0) {
                                    const intermediateMeasure = Object.assign({}, currentMeasure)
                                    intermediateMeasure.id = xmlTools.getAttribute(node, 'xml:id')
                                    intermediateMeasure.measure = measure
                                    intermediateMeasure.duration = 0
                                    intermediateMeasure.midi = Math.round(midiBpm)
                                    notes.push(intermediateMeasure)
                                }
                            }
                            currentTempo = {
                                measure: measure,
                                tempo: Math.round(midiBpm),
                            }
                            tempi.push(currentTempo)
                        }
                    }
                    break

                // MARK: Start tie
                case 'tie':
                    {
                        const startid = xmlTools.getAttribute(node, 'startid')
                        const endid = xmlTools.getAttribute(node, 'endid')
                        if (startid != null && endid != null) {
                            ties.push({
                                startid: startid.code(),
                                endid: endid.code(),
                            })
                        }
                    }
                    break

                // MARK: Start trill ornament
                case 'trill':
                    addOrnament(node.nodeName, xmlTools.getAllAttributes(node))
                    break

                // MARK: Start a tuplet
                case 'tuplet':
                    {
                        const attrs = xmlTools.getAllAttributes(node)
                        makeTuplet(attrs)
                    }
                    break

                // MARK: Start a turn ornament
                case 'turn':
                    addOrnament(node.nodeName, xmlTools.getAllAttributes(node))
                    break

                // MARK: Start a verse
                case 'verse':
                    verse = verse || { text: '' }
                    verse.n = xmlTools.getAttributeValue(node, 'n', 0)
                    break

                default:
                    break
            }
        }

        // Function called when an element ends.
        function endElement(node) {
            // console.log('endElement', node.nodeName)

            switch (node.nodeName) {
                // MARK: End beam
                case 'beam':
                    beam = false
                    break

                // MARK: End bowed tremolo
                case 'bTrem':
                    expandBowedTremoloNotes()
                    tremolo = null
                    break

                // MARK: End chord
                case 'chord':
                    if (currentChord) {
                        const chord = currentChord
                        position += chord.value ?? 0.0
                        // Add articulations to chord notes
                        const artic = chord.attrs['artic']
                        if (artic) {
                            const notation = { params: {} }
                            notation.params['artic'] = artic
                            for (const ref in chord.refs) {
                                const index = noteRefs[ref]
                                if (index != null) {
                                    if (index < notes.length) {
                                        notes[index].notations.push(notation)
                                    }
                                }
                            }
                        }
                        chords.push(chord)
                        currentChord = null
                    }
                    break

                // MARK: End composer
                case 'composer':
                    meta.composer = xmlTools.getTextContent(node)
                    break

                // MARK: End directive
                case 'dir':
                    if (node.textContent.length) {
                        directive.params['text'] = node.textContent
                    }
                    if (verses.length) {
                        if (hasNotation(directive, 'type', 'segno')) {
                            directive.params['n'] = String(verses.count)
                        }
                    }
                    currentMeasure.notations = currentMeasure.notations ?? []
                    currentMeasure.notations.push(directive)
                    break

                // MARK: End ending
                case 'ending':
                    {
                        notes[lastMeasureIndex].notations = notes[lastMeasureIndex].notations ?? []
                        const notation = { params: {} }
                        if (!meta.expansions.length) {
                            notation.params['endending'] = '0'
                            notes[lastMeasureIndex].notations.push(notation)
                        } else {
                            notation.params['endsect'] = ''
                            notes[lastMeasureIndex].notations.push(notation)
                        }
                    }
                    break

                // MARK: End tremolo
                case 'fTrem':
                    expandFingeredTremoloNotes()
                    tremolo = null
                    break

                // MARK: End key signature
                case 'keySig':
                    break

                // MARK: End layer
                case 'layer':
                    maxPosition = Math.max(position, maxPosition)
                    break

                // MARK: End measure
                case 'measure':
                    {
                        const measureFraction = getMeasureFraction()
                        measureNum += Math.ceil(measureFraction) // For overly long measures!
                        position = maxPosition
                        currentMeasure.duration = position / divisions
                        lastMeasureIndex = notes.length
                        notes.push(currentMeasure)
                        chords = []
                    }
                    break

                // MARK: End rest
                case 'mRest':
                    measureFraction = 1.0
                    notes.push(currentNote)
                    break

                // MARK: End space
                case 'mSpace':
                    measureFraction = 1.0
                    notes.push(currentNote)
                    break

                // MARK: End multi rest
                case 'multiRest':
                    break

                // MARK: End note
                case 'note':
                    if (!tremolo) {
                        notes.push(currentNote)
                    } else {
                        tremolo.notes = tremolo.notes ?? []
                        tremolo.notes.push(currentNote)
                    }
                    break

                // MARK: End person name
                case 'persName':
                    if (role == 'composer') {
                        meta.composer = xmlTools.getTextContent(node)
                    }
                    break

                // MARK: Start rehearsal
                case 'reh':
                    {
                        const notation = { params: {} }
                        notation.params[name] = node.textContent
                        currentMeasure.notations = currentMeasure.notations ?? []
                        currentMeasure.notations.push(notation)
                    }
                    break

                // MARK: End rest
                case 'rest':
                    notes.push(currentNote)
                    break

                // MARK: End score definition
                case 'scoreDef':
                    divisions = getDivisionsPerMeasure()
                    break

                // MARK: End section
                case 'section':
                    {
                        if (lastMeasureIndex < notes.length) {
                            const notation = { params: {} }
                            if (currentSection) {
                                notation.params['endsect'] = currentSection.label
                            }
                            notes[lastMeasureIndex].notations =
                                notes[lastMeasureIndex].notations ?? []
                            notes[lastMeasureIndex].notations.push(notation)
                        }
                        currentSection = null
                    }
                    break

                // MARK: End space
                case 'space':
                    notes.push(currentNote)
                    break

                // MARK: End staff
                case 'staff':
                    break

                // MARK: End staff definition
                case 'staffDef':
                    break

                // MARK: End staff group
                case 'staffGrp':
                    break

                // MARK: End syllable
                case 'syl':
                    if (node.textContent.length > 0) {
                        addSyllable(node.textContent)
                    }
                    break

                // MARK: End title
                case 'title':
                    {
                        const title = xmlTools.getTextContent(node)
                        if (title) {
                            meta.titles.push(title)
                        }
                    }
                    break

                // MARK: End tuplet
                case 'tuplet':
                    tuplet = null
                    break

                // MARK: End verse
                case 'verse':
                    verses[verse.n] = verses[verse.n] ?? ''
                    verses[verse.n] += verse.text
                    verse.text = ''
                    break

                default:
                    break
            }
        }

        // Gets notation by key.
        function getNotationByParam(note, key) {
            return note.notations?.find((e) => {
                return e.params[key]
            })
        }

        /// Are the measures the same?
        /// - Parameters:
        ///   - measure1: The first measure
        ///   - measure2: The second measure to compare with
        /// - Returns: true if the notes are believed to be the same
        function isSameMeasure(measure1, measure2) {
            return Math.abs(measure1 - measure2) < sameMeasure
        }

        /// Checks if 2 notes overlap.
        /// - Parameters:
        ///   - note1: The first note
        ///   - note2: The second note
        /// - Returns: true if the notes overlap, false otherwise
        function doNotesOverlap(note1, note2) {
            return (
                Math.min(getMeasureEnd(note1), getMeasureEnd(note2)) -
                    Math.max(note1.measure, note2.measure) >
                0.0
            )
        }

        /// Gets the measure at the note's end
        /// - Parameter note: The note to use
        /// - Returns: The measure at the end
        function getMeasureEnd(note) {
            return note.measure + note.duration
        }

        function moveItemTo(sourceIndex, destIndex, elements) {
            if (sourceIndex != -1 && destIndex != -1) {
                const element = elements.splice(sourceIndex, 1)[0]
                elements.splice(destIndex, 0, element)
            }
            return elements
        }

        /// Checks the first measure.

        /// If the notes do not start with a measure
        /// there is probably an ornamental note such as
        /// an arpeggio or an unaccented grace note.
        /// We therfore move the first measure to the beginning,
        /// adjusting the measure and duration value.
        function checkFirstMeasure() {
            if (notes[0].kind != Kind.measure) {
                const measure = notes[0].measure
                if (measure != null) {
                    if (measure < 0.0) {
                        const firstMeasureIndex = notes.findIndex((e) => {
                            return e.kind == Kind.measure
                        })
                        if (firstMeasureIndex != -1) {
                            notes[firstMeasureIndex].measure = measure
                            notes[firstMeasureIndex].duration -= measure
                            moveItemTo(firstMeasureIndex, 0, notes)
                        }
                    }
                }
            }
        }

        /// Attaches pitch modifiers
        ///
        /// Attaches a pitch modifier for articulation and ornaments
        function attachPitchModifiers() {
            for (const [index, note] of notes.entries()) {
                if (note.notations?.length) {
                    const modifiers = []
                    for (const notation of note.notations) {
                        for (const key in notation.params) {
                            const value = notation.params[key]
                            let modifier = ''
                            switch (key) {
                                case 'artic':
                                    switch (value) {
                                        case 'marc':
                                            modifier = '-'
                                            break
                                        case 'stacc':
                                            modifier = '.'
                                            break
                                        case 'stacciss':
                                            modifier = ':'
                                            break
                                    }
                                    break

                                case 'ornament':
                                    switch (value) {
                                        case 'mordent':
                                            modifier = 'n'
                                            if (notation.params['long'] == 'true') {
                                                modifier = 'm'
                                            }
                                            if (notation.params['form'] == 'upper') {
                                                modifier = modifier.toUpperCase()
                                            }
                                            break
                                        case 'trill':
                                            modifier = 't'
                                            break
                                        case 'turn':
                                            modifier = 's'
                                            if (notation.params['form'] == 'upper') {
                                                modifier = modifier.toUpperCase()
                                            }
                                            break
                                    }
                                    break
                            }
                            if (modifier.length) {
                                modifiers.push(modifier)
                            }
                        }
                    }
                    if (modifiers.length) {
                        notes[index].pitch += ';' + modifiers.join('')
                    }
                }
            }
        }

        // Appends final measure.
        function appendFinalMeasure() {
            const measure = {
                id: 'xxx',
                kind: Kind.measure,
                measure: measureNum,
                duration: 0.0,
                pitch: 'M',
                midi: 0,
                staff: 1,
                number: '✻',
            }
            notes.push(measure)
        }

        // Concatenates tied notes..
        function tieNotes() {
            for (const tie of ties) {
                const startIndex = noteRefs[tie.startid]
                const endIndex = noteRefs[tie.endid]
                if (startIndex != null && endIndex != null) {
                    // Don't join note with ornaments
                    if (getNotationByParam(notes[endIndex], 'ornament') == null) {
                        // Add the notes' duration
                        notes[startIndex].duration += notes[endIndex].duration
                        // Invalidate the end note
                        notes[endIndex].kind = Kind.invalid
                        // Swap the notes
                        const note = notes[startIndex]
                        notes[startIndex] = notes[endIndex]
                        notes[endIndex] = note
                    }
                }
            }
        }

        // Removes previously invalidated notes.
        function removeInvalidNotes() {
            notes = notes.filter((e) => e.kind != Kind.invalid)
        }

        /// Repositions note and adjusts for incomplete measures.
        /// - Parameters:
        ///   - index: The index of the note
        ///   - duration: The duration of the note
        function repositionNote(index, duration) {
            notes[index].measure -= duration
            const measure = findMeasure(Math.floor(notes[index].measure))
            if (measure != null) {
                if (
                    measure.duration < 1.0 &&
                    notes[index].measure > measure.measure + measure.duration
                ) {
                    notes[index].measure -= 1.0 - measure.duration
                }
            }
        }

        /// Places grace notes.
        function placeGraceNotes() {
            let steal = 0.0
            let lastChordId = ''
            const graceIndices = []
            for (const [index, note] of notes.entries()) {
                if (note.kind == Kind.note) {
                    const notation = getNotationByParam(note, 'grace')
                    if (notation != null) {
                        const grace = notation.params['grace']
                        let duration = parseFloat(notation.params['duration'] ?? '0.0') ?? 0.0
                        const chordId = notation.params['chord']
                        if (grace == 'acc') {
                            const stealFrom = notation.params['steal']
                            if (stealFrom == 'next') {
                                notes[index].measure += steal
                                const nextDuration = notes[index + 1].duration
                                duration = Math.min(duration, 0.5 * nextDuration)
                                notes[index].duration = duration
                                steal += duration
                            } else if (stealFrom == 'prev') {
                                graceIndices.push(index)
                                notes[index].duration = duration
                                if (chordId == null) {
                                    for (const graceIndex of graceIndices) {
                                        repositionNote(graceIndex, duration)
                                    }
                                } else {
                                    if (lastChordId != chordId) {
                                        for (const graceIndex of graceIndices) {
                                            repositionNote(graceIndex, duration)
                                        }
                                        lastChordId = chordId
                                    } else {
                                        repositionNote(graceIndices.slice(-1), duration)
                                    }
                                }
                            }
                        } else if (grace == 'unacc') {
                            notes[index].measure -= duration
                            notes[index].duration = duration
                        }
                    } else if (steal > 0.0) {
                        notes[index].measure += steal
                        notes[index].duration -= steal
                        steal = 0.0
                    } else {
                        graceIndices.splice(-1)
                    }
                }
            }
        }

        /// Repositions notes.
        ///
        /// Currently just applied to arpeggio notes.
        function repositionNotes() {
            let shortMeasure
            for (const [index, note] of notes.entries()) {
                // Save short measure
                if (note.kind == Kind.measure && note.duration < 1.0) {
                    shortMeasure = note
                }
                const notation = getNotationByParam(notes[index], 'reposition')
                if (notation != null) {
                    if (notation.params['reposition'] == 'arpeg') {
                        let delay = parseFloat(notation.params['delay'])
                        delay = isNaN(delay) ? 0.0 : delay
                        const indexString = notation.params['index']
                        if (indexString != null) {
                            const part = indexString.split('/').map((index) => {
                                const value = parseFloat(index)
                                return isNaN(value) ? 1.0 : value
                            })
                            const num = part[0] // - part[1] + 1
                            notes[index].measure += num * delay
                            notes[index].duration -= num * delay
                            // Move note into the measure range
                            if (shortMeasure != null) {
                                if (
                                    parseInt(notes[index].measure) == parseInt(shortMeasure.measure)
                                ) {
                                    notes[index].measure -= 1.0 - shortMeasure.duration
                                }
                            }
                        }
                    }
                }
            }
        }

        /// Sorts notes by MIDI pitch value.
        function sortNotesByMidiPitch() {
            notes.sort((a, b) => {
                if (a.midi == b.midi) {
                    if (a.measure == b.measure) {
                        return b.duration - a.duration // longer notes come first
                    }
                    return a.measure - b.measure // order by increasing measure
                }
                return b.midi - a.midi // order by decreasing midi value
            })
        }

        /// Shortens repeated notes.
        ///
        /// A note is shortened if it is repeated.
        /// - The maximum shortening is currently set to a value 0.25
        function shortenRepeatedNotes() {
            const reductionLimit = 0.25
            let previousMeasure = Number.MAX_VALUE
            const percentage = (100 - repeatedNotesPercentage) * 0.01
            for (const [index, note] of notes.entries()) {
                if (note.kind == Kind.note && note.duration > 0) {
                    if (getNotationByParam(note, 'artic') == null) {
                        if (isSameMeasure(previousMeasure, note.measure)) {
                            if (note.midi == notes[index - 1].midi) {
                                const duration = notes[index - 1].duration
                                if (duration > 0) {
                                    let reduction = Math.min(reductionLimit, duration * percentage)
                                    notes[index - 1].duration -= reduction
                                }
                            }
                        }
                        previousMeasure = note.measure + note.duration
                    }
                }
            }
        }

        /// Sorts notes by voice numbers.
        function sortNotesByVoice() {
            notes.sort((a, b) => {
                const vc0 = a.staff * 4 + a.voice
                const vc1 = b.staff * 4 + b.voice
                if (vc0 == vc1) {
                    if (a.kind == Kind.measure) {
                        return -1
                    }

                    if (a.measure == b.measure) {
                        return a.duration - b.duration
                    }

                    return a.measure - b.measure
                }
                return vc0 - vc1
            })
        }

        /// Sorts notes by measure.
        ///
        /// Sorting criteria:
        /// - Notes of measure kind are always put first
        /// - Longer notes range before shorter notes
        function sortNotesByMeasure() {
            notes.sort((a, b) => {
                if (a.measure == b.measure) {
                    // Measure types come first
                    if (a.kind == Kind.measure) {
                        return -1
                    }
                    if (b.kind == Kind.measure) {
                        return 1
                    }
                    // Lower midi numbers come first
                    if (a.midi != b.midi) {
                        return a.midi - b.midi
                    }
                    // Longer notes come first.
                    if (a.duration != b.duration) {
                        return b.duration - a.duration
                    }
                }
                return a.measure - b.measure
            })
        }

        /// Removes duplicates.
        ///
        /// The shorter notes are removed since sortNotesByMeasure()
        /// already considered the note length.
        function removeDuplicates() {
            // Make sure the notes are already sorted.
            const prevNotes = [] // keep the notes to test in an array
            notes = notes.filter((note) => {
                const currNote = note
                if (currNote.kind == Kind.note) {
                    // look for notes with identical midi values
                    if (
                        prevNotes.find((note) => {
                            return currNote.midi == note.midi && currNote.measure == note.measure
                        }) != null
                    ) {
                        return false
                    }
                    // remove notes with lower measures
                    const prevNote = prevNotes.slice(-1)
                    if (prevNote != null) {
                        if (currNote.measure > prevNote.measure) {
                            prevNotes.splice(0)
                        }
                    }
                    prevNotes.push(currNote) // add current note to next tests
                }
                return true
            })
        }

        /// Holds a note turned off by an other note with the same pitch.
        function doHoldSameNotes() {
            let lastIndex = -1
            for (const [index, note] of notes.entries()) {
                if (note.kind == Kind.note) {
                    if (lastIndex != -1 && note.midi == notes[lastIndex].midi) {
                        if (doNotesOverlap(notes[lastIndex], note)) {
                            const noteEndMeasure = getMeasureEnd(note)
                            const lastNoteEndMeasure = getMeasureEnd(notes[lastIndex])
                            const commonEndMeasure = Math.max(noteEndMeasure, lastNoteEndMeasure)
                            notes[index].duration = commonEndMeasure - note.measure
                            notes[lastIndex].duration = commonEndMeasure - notes[lastIndex].measure
                        }
                    }
                    lastIndex = index
                }
            }
        }

        /// Adds the index.
        ///
        /// The index reflects the temporal order.
        function addIndex() {
            for (const [index, _] of notes.entries()) {
                notes[index].index = index + 1
            }
        }

        /// Adds tempi to the note data.
        ///
        /// Note that we use the midi field of the measure to store tempo changes.
        function addTempi() {
            let currentTempo = 0
            for (const [index, _] of notes.entries()) {
                if (notes[index].kind == Kind.measure) {
                    const tempo = tempi.find((e) => {
                        return e.measure == notes[index].measure
                    })
                    if (tempo != null) {
                        if (tempo.tempo != currentTempo) {
                            currentTempo = tempo.tempo
                            notes[index].midi = currentTempo
                        }
                    }
                }
            }
        }

        /// Adds meters to the note data.
        ///
        /// Note that we use the pitch field of the measure to store meter values.
        function addMeters() {
            for (const [index, _] of notes.entries()) {
                if (notes[index].kind == Kind.measure) {
                    const meter = meters.find((e) => {
                        return e.measure == notes[index].measure
                    })
                    if (meter != null) {
                        notes[index].pitch = `M;${meter.count}/${meter.unit}`
                    }
                }
            }
        }

        /// Adds keys to the note data.
        ///
        /// Note that we use the voice field of the measure to store key numbers.
        function addKeys() {
            let currentKey = 0
            for (const [index, _] of notes.entries()) {
                if (notes[index].kind == Kind.measure) {
                    const key = keys.find((e) => {
                        return e.measure == notes[index].measure
                    })
                    if (key != null) {
                        currentKey = fifthValue(key.fifths)
                    }
                    notes[index].voice = currentKey
                }
            }
        }

        /// Adds instructions.
        ///
        /// Note that we use the number field of the measure to store instructions.
        function addInstructions() {
            for (const [index, note] of notes.entries()) {
                const instructions = []
                if (note.kind == Kind.measure) {
                    if (note.notations != null) {
                        for (const notation of note.notations) {
                            for (const param in notation.params) {
                                switch (param.key) {
                                    case 'left':
                                        if (param.value == 'rptstart') {
                                            instructions.push('|:')
                                        }
                                        break
                                    case 'right':
                                        if (param.value == 'rptend') {
                                            instructions.push(':|')
                                        } else if (param.value == 'dbl') {
                                            instructions.push('||')
                                        } else if (param.value == 'end') {
                                            instructions.push('.|')
                                        }
                                        break
                                    case 'startending':
                                        instructions.push('[' + param.value)
                                        break
                                    case 'endending':
                                        instructions.push('0]')
                                        break
                                    case 'type':
                                        if (param.value == 'dacapo') {
                                            instructions.push('>*')
                                        } else if (param.value == 'dalsegno') {
                                            instructions.push('>?')
                                        } else if (param.value == 'tocoda') {
                                            instructions.push('>§')
                                        } else if (param.value == 'coda') {
                                            instructions.push('[§')
                                        } else if (param.value == 'segno') {
                                            instructions.push('[?')
                                        } else if (param.value == 'fine') {
                                            instructions.push('[.')
                                        }
                                        break
                                    default:
                                    // console.log('Unhandled instruction:', param)
                                }
                            }
                        }
                    }
                    if (instructions.length) {
                        notes[index].number += ';' + instructions.join()
                    }
                }
            }
        }

        /// Cleans and adds verses, if any.
        function checkVerses() {
            if (verses.length) {
                meta.verses = verses
                    .filter(String)
                    .sort((a, b) => {
                        return a.key < b.key
                    })
                    .map((verse) => {
                        return verse.trim()
                    })
            }
        }

        // Processes the parsed notes.
        function processNotes() {
            console.log('Processing score data started at', new Date().toLocaleTimeString())

            // Make sure there is at least one tempo, one meter and one key.
            if (!tempi.length) {
                tempi.push({
                    measure: 0.0,
                    tempo: 120,
                    toString: function () {
                        return `${this.measure}\t${this.tempo})`
                    },
                })
            }
            if (!meters.length) {
                meters.push({
                    measure: 0.0,
                    staff: 1,
                    count: 4,
                    unit: 4,
                    toString: function () {
                        return `${this.measure}\t${this.staff}\t${this.count}/${this.unit})`
                    },
                })
            }
            if (!keys.length) {
                keys.push({
                    measure: 0.0,
                    staff: 1,
                    fifths: '0',
                    toString: function () {
                        return `${this.measure}\t${this.staff}\t${Fifths.name(this.fifths)})`
                    },
                })
            }
            appendFinalMeasure()
            tieNotes()
            removeInvalidNotes()
            repositionNotes()
            sortNotesByMidiPitch()
            shortenRepeatedNotes()
            if (holdSameNotes == true) {
                doHoldSameNotes()
            }
            sortNotesByVoice()
            placeGraceNotes()
            // shortenJumps()
            sortNotesByMeasure()
            if (removeIdenticalNotes == true) {
                removeDuplicates()
            }
            checkFirstMeasure()

            attachPitchModifiers()
            addIndex()

            addTempi()
            addMeters()
            addKeys()
            addInstructions()
            checkVerses()
            // printNotes()
            // printNotations()
            // printVerses()

            noteData = { notes, tempi, meters, keys, meta }
        }

        return noteData
    }
}
