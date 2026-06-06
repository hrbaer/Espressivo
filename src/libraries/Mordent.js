//
//  Mordent.swift
//  Espressivo
//
//  Created by Hansruedi Bär on 17.09.23.
//

import Ornament from './Ornament.js'

/// Creates mordent notes on the fly.
export default class Mordent extends Ornament {
    /// Initializes a  mordent.
    /// - Parameters:
    ///   - note: The Note object
    ///   - numBeats: The number of beats
    ///   - beatTime: The beat time
    ///   - midi: The MIDI pitch value
    ///   - delay: The delay between the ornamental notes
    constructor(note, numBeats, beatTime, midi, delay) {
        super(note, numBeats, beatTime, delay)
        this.midi = midi
        this.addOrnamentalNotes()
    }

    /// Adds the ornamental notes.
    addOrnamentalNotes() {
        let duration = this.getIdealDuration()
        let n = 3
        for (let i = 0; i < n; i++) {
            const note = this.copyNote(this.note)
            note.id = ''
            note.measure += i * duration
            note.duration = duration
            if (i % 2 == 1) {
                note.midi = this.midi
            }
            if (i == n - 1) {
                note.duration = this.note.duration - (n - 1) * duration
            }
            this.notes.push(note)
        }
    }
}
