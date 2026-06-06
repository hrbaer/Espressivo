//
//  Turn.swift
//  Espressivo
//
//  Created by Hansruedi Bär on 17.09.23.
//
import Ornament from './Ornament.js'

/// Creates turn notes on the fly.
export default class Turn extends Ornament {
    /// Initializes a  trill.
    /// - Parameters:
    ///   - note: The Note object
    ///   - numBeats: The number of beats
    ///   - beatTime: The beat time
    ///   - lowerMidi: The MIDI value of the lower note
    ///   - upperMidi: The  MIDI value of the lower note
    ///   - delay: The delay between the ornamental notes
    constructor(note, numBeats, beatTime, upperMidi, lowerMidi, delay) {
        super(note, numBeats, beatTime, delay)
        this.upperMidi = upperMidi
        this.lowerMidi = lowerMidi
        this.addOrnamentalNotes()
    }

    /// Adds the ornamental notes.
    addOrnamentalNotes() {
        let numNotes = 5
        let optimalDuration = Math.min(this.getIdealDuration(), this.note.duration / numNotes)
        let firstDuration = this.note.duration - (numNotes - 1) * optimalDuration
        for (let i = 0; i < numNotes; i++) {
            const note = this.copyNote(this.note)
            note.id = ''
            if (i == 0) {
                note.duration = firstDuration
            } else {
                note.measure += firstDuration + (i - 1) * optimalDuration
                note.duration = optimalDuration
            }
            if (i == 1) {
                note.midi = this.upperMidi ?? note.midi
            } else if (i == 3) {
                note.midi = this.lowerMidi ?? note.midi
            }
            this.notes.push(note)
        }
    }
}
