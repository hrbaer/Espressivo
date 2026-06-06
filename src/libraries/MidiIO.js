import notify from './notify.js'

export default class MidiIO {
    midiAccess

    constructor(midiInput, midiOutput) {
        this.midiInput = midiInput
        this.midiOutput = midiOutput
    }

    get hasMidi() {
        return window.navigator.requestMIDIAccess != null
    }

    async initialize() {
        await this.queryPermission()
        window.navigator
            .requestMIDIAccess({ sysex: false })
            .then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this))
    }

    onMIDISuccess(midiAccess) {
        midiAccess.onstatechange = function (e) {
            let options = { body: `${e.port.name}: ${e.port.connection}, ${e.port.state}` }
            notify('MIDI connection changed', options)
            console.log('MIDI connection changed', options)
            this.updateMidiOutput()
            this.updateMidiInput()
        }.bind(this)
        this.midiAccess = midiAccess
        this.updateMidiOutput()
        this.updateMidiInput()
    }

    onMIDIFailure(msg) {
        console.error('Failed to get MIDI access:', msg)
    }

    updateMidiOutput() {
        this.midiOutput.splice(0)
        this.midiAccess.outputs.forEach((e) => {
            this.midiOutput.push(e)
            /*
            e.onstatechange = function (event) {
                const port = event.port
                console.log(
                    'MIDIOutputPort onstatechange name:' +
                        port.name +
                        ' connection:' +
                        port.connection +
                        ' state:' +
                        port.state,
                )
            }
            */
        })
    }

    updateMidiInput() {
        this.midiInput.splice(0)
        this.midiAccess.inputs.forEach((e) => {
            // const inp = { id: e.id, name: e.name, active: false }
            this.midiInput.push(e)
            if (e.connection == 'open') {
                e.onmidimessage = this.midiInputHandler
            }
        })
    }

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

    addMidiInputHandler(midiInput) {
        midiInput.addEventHandler('midimessage', this.midiInputHandler.bind(this))
    }

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

    sendMessage(msg) {
        for (const midiOut of this.midiOutput) {
            if (midiOut.connection == 'open') {
                const output = this.midiAccess.outputs.get(midiOut.id)
                output.send(msg)
            }
        }
    }

    noteOn(key, channel, velocity) {
        this.sendMessage([0x90 + channel, key, velocity])
    }

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

    changeControl(controller, value) {
        this.sendMessage([0xb0, controller, value])
    }
}
