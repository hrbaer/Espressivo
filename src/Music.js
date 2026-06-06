//
//  Music.js
//  Espressivo
//
//  Created by Hansruedi Bär on 22.06.23.
//
//  Calculation of diatones.
//  Used for appropriate performance of ornaments.
//

// Provides methods to calculate diatones.
export default class Music {
    // Used to map half-note steps to tones on the major scale.
    // Note: 15 values are required to be able to shift the scale.
    static diatones = [-1, 0, 0, 2, 2, 4, 4, 5, 7, 7, 9, 9, 11, 11, 12]

    // Calculates upper AND lower diatones using offsets.
    static diatone(midi, fifths, offset = 0) {
        let key = (midi + 144 - fifths * 7) % 12 // Range: 0 … 11, Ionian (major) scale
        return midi + Music.diatones[key + offset] - key
    }

    // Calculates the MIDI pitch offset for an ornament's accidental.
    static accidOffset(accid, fifths) {
        var offset = 0
        switch (accid) {
            case null:
            case undefined:
                break
            case '':
                break
            case 'n':
                offset = -Math.max(Math.min(fifths, 1), -1)
                break
            case 's':
                offset = 1
                break
            case 'f':
                offset = -1
                break
            default:
                console.log(`Ornament's accidental not handled: ${accid})`)
                offset = 0
        }
        return offset
    }

    // Returns the MIDI value of the upper note for a given scale.
    // Example: C major: D -> E (+2)
    static upperDiatone(midi, fifths = 0, accid) {
        return Music.diatone(midi, fifths, 3) + Music.accidOffset(accid, fifths) // Offset for upper diatone
    }

    // Returns the MIDI value of the lower note for a given scale.
    // Example: D major: G -> F# (-1)
    static lowerDiatone(midi, fifths = 0, accid) {
        return Music.diatone(midi, fifths) + Music.accidOffset(accid, fifths)
    }
}
