//
//  LongMordent.js
//  Adapted code from the Xcode project.
//

import Ornament from './Ornament.js'

// Creates long mordent notes on the fly.
export default class LongMordent extends Ornament {
    // Initializes a long mordent.
    // - Parameters:
    //   - note: The Note object
    //   - numBeats: The number of beats
    //   - beatTime: The beat time
    //   - midi: The MIDI pitch value
    //   - delay: The delay between the ornamental notes
    constructor(note, numBeats, beatTime, midi, delay) {
        super(note, numBeats, beatTime, delay)
        this.midi = midi
        this.addOrnamentalNotes()
    }

    // Adds the ornamental notes.
    addOrnamentalNotes() {
        let n = this.estimateNumOrnamentalNotes()
        const duration = this.note.duration / n
        n = 2 * (n / 2) - 1 // make n uneven
        n = n > 5 ? n - 2 : n
        if (n > 0) {
            for (let i = 0; i < n; i++) {
                const note = this.copyNote(this.note)
                note.id = ''
                note.measure += i * duration
                note.duration = duration
                if (i % 2 == 1) {
                    note.midi = this.midi ?? note.midi
                }
                if (i == n - 1) {
                    note.duration = this.note.duration - (n - 1) * duration
                }
                this.notes.push(note)
            }
        }
    }
}
