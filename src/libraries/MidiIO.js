/*
 * M I D I I O
 *
 * Handles MIDI input and output.
 *
 */

import notify from './notify.js'

export default class MidiIO {
    // Passes a reference to the MIDI connections.
    constructor(midiInput, midiOutput) {
        this.midiInput = midiInput
        this.midiOutput = midiOutput
    }

    // Checks if MIDI is available.
    get hasMidi() {
        return window.navigator.requestMIDIAccess != null
    }

    // Initializes MIDI input and output.
    async initialize() {
        await this.queryPermission()
        window.navigator
            .requestMIDIAccess({ software: true })
            .then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this))
    }

    // Handles MIDI connection changes.
    onMIDISuccess(midiAccess) {
        midiAccess.onstatechange = function (e) {
            let options = { body: `${e.port.name}: (${e.port.connection}, ${e.port.state})` }
            notify('MIDI connection changed', options)
            this.updateMidiOutput()
            this.updateMidiInput()
        }.bind(this)
        this.midiAccess = midiAccess
        this.updateMidiOutput()
        this.updateMidiInput()
    }

    // Inform when an error occurred.
    onMIDIFailure(msg) {
        console.error('Failed to get MIDI access:', msg)
    }

    // Updates the MIDI output reference.
    updateMidiOutput() {
        this.midiOutput.splice(0)
        this.midiAccess.outputs.forEach((e) => {
            this.midiOutput.push(e)
        })
    }

    // Updates the MIDI input reference
    updateMidiInput() {
        this.midiInput.splice(0)
        this.midiAccess.inputs.forEach((e) => {
            this.midiInput.push(e)
            if (e.connection == 'open') {
                e.onmidimessage = this.midiInputHandler
            }
        })
    }

    // Handles MIDI input events.
    midiInputHandler(message) {
        const midiEvent = {
            channel: message.data.at(0),
            controller: message.data.at(1),
            value: message.data.at(2),
        }
        window.dispatchEvent(
            new CustomEvent('midiinput', {
                detail: midiEvent,
            }),
        )
    }

    // Adds a MIDI input handler.
    addMidiInputHandler(midiInput) {
        midiInput.addEventHandler('midimessage', this.midiInputHandler.bind(this))
    }

    // Gets permission to use MIDI
    async queryPermission() {
        try {
            return await window.navigator.permissions
                .query({ name: 'midi', sysex: true })
                .then((result) => {
                    if (result.state === 'granted') {
                        console.log('MIDI access granted')
                    } else if (result.state === 'prompt') {
                        return confirm('Do you allow MIDI connections?')
                    }
                    return true
                })
        } catch (error) {
            console.error(error)
        }
    }

    // Sends a MIDI message.
    sendMessage(msg) {
        for (const midiOut of this.midiOutput) {
            if (midiOut.connection == 'open') {
                const output = this.midiAccess.outputs.get(midiOut.id)
                output.send(msg)
            }
        }
    }

    // Sends a MIDI note-on event.
    noteOn(key, channel, velocity) {
        this.sendMessage([0x90 + channel, key, velocity])
    }

    // Sends a MIDI note-off event.
    noteOff(key, channel) {
        this.sendMessage([0x80 + channel, key, 0])
    }

    /// Sets the pedal.
    /// - Parameter pressed: true if pressed, false otherwise
    setPedal(pressed) {
        this.changeControl(0x40, pressed == true ? 127 : 0)
    }

    /// Sets the soft pedal.
    /// - Parameter pressed: true if pressed, false otherwise
    setSoftPedal(pressed) {
        this.changeControl(0x43, pressed == true ? 127 : 0)
    }

    /// Sets the sostenuto pedal.
    /// - Parameter pressed: true if pressed, false otherwise
    setSostenutoPedal(pressed) {
        this.changeControl(0x42, pressed == true ? 127 : 0)
    }

    /// Sets the sustain pedal.
    /// - Parameter pressed: true if pressed, false otherwise
    setSustainPedal(pressed) {
        this.changeControl(0x40, pressed == true ? 127 : 0)
    }

    /// Sets the soft half-pedal.
    /// - Parameter value: The amount of the pressed pedal
    setSoftHalfPedal(value) {
        this.changeControl(0x43, value)
    }

    /// Sets the sostenuto half-pedal.
    /// - Parameter value: The amount of the pressed pedal
    setSostenutoHalfPedal(value) {
        this.changeControl(0x42, value)
    }

    /// Sets the sustain half-pedal.
    /// - Parameter value: The amount of the pressed pedal
    setSustainHalfPedal(value) {
        this.changeControl(0x40, value)
    }

    // Sends a MIDI control change event.
    changeControl(controller, value) {
        this.sendMessage([0xb0, controller, value])
    }
}
