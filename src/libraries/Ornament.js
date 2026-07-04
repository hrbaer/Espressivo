//
//  Ornament.js
//  Adapted code from the Xcode project.
//

/// Creates ornamental notes on the fly.
///
/// Acts as a base class for all ornaments.
export default class Ornament {
    /// Initializes an ornament.
    /// - Parameters:
    ///   - note: The Note object
    ///   - numBeats: The number of beats
    ///   - beatTime: The beat time
    ///   - delay: The delay between the ornamental notes
    constructor(note, numBeats, beatTime, delay) {
        this.note = this.copyNote(note)
        this.numBeats = numBeats
        this.beatTime = beatTime
        this.delay = delay
        this.notes = []
    }

    copyNote(note) {
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

    /// Adds the ornamental notes.
    addOrnamentalNotes() {
        let note = this.note
        this.notes.push(note)
    }

    /// Retrieves the next note.
    /// - Parameter measure: The measure of the next note
    /// - Returns: The next Note object
    getNextNote(measure) {
        let note
        if (this.notes.length) {
            if (measure >= this.notes[0].measure) {
                note = this.notes.shift()
            }
        }
        return note
    }

    /// Estimates the appropriate number of ornamental notes.
    /// - Returns: The estimated number of ornamental notes
    estimateNumOrnamentalNotes() {
        let numNotes = this.note.duration / this.delay
        return Math.floor(numNotes)
    }

    /// Gets the ideal duration of an ornamental note.
    /// - Returns: The ideal duration of the note
    getIdealDuration() {
        return this.delay
    }

    /// Checks if all notes are retrieved.
    /// - Returns: true if ornament is exhausted, false othewise
    isExhausted() {
        return this.notes.length == 0
    }
}
