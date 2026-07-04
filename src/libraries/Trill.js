//
//  Trill.js
//  Adapted code from the Xcode project.
//

import Ornament from './Ornament.js'

/// Creates trill notes on the fly.
export default class Trill extends Ornament {
    /// Initializes a  trill.
    /// - Parameters:
    ///   - note: The Note object
    ///   - numBeats: The number of beats
    ///   - beatTime: The beat time
    ///   - midi: The MIDI pitch value
    ///   - delay: The delay between the ornamental notes
    constructor(note, numBeats, beatTime, midi, delay, ornamentType) {
        super(note, numBeats, beatTime, delay)
        this.midi = midi
        this.ornamentType = ornamentType
        this.addOrnamentalNotes()
    }

    /// Adds the ornamental notes.
    addOrnamentalNotes() {
        let n = this.estimateNumOrnamentalNotes()
        let ornamentType = this.ornamentType
        let remainder = ornamentType == 'barock' ? 0 : 1
        if ((remainder + n) % 2 == 1) {
            // make even for barock, uneven otherwise
            n -= 1
            if (n < 2) {
                n += 2
            }
        }
        let duration = this.note.duration / n
        for (let i = 0; i < n; i++) {
            const note = this.copyNote(this.note)
            note.id = ''
            note.measure += i * duration
            note.duration = duration
            if (i % 2 == remainder) {
                note.midi = this.midi ?? note.midi
            }
            this.notes.push(note)
        }
    }
}
