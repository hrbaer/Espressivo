/*
 *  D I S P A T C H E R
 *
 *  Receives, processes and redirects gamepad events.
 *
 *  2026-03-21
 *
 */

import SplineInterpolator from './cubic-spline-interpolate.js'

const tempoKeyPointsX = [-1.0, -0.5, 0.0, 0.5, 1.0]
const tempoKeyPointsY = [-95.0, -20.0, 0.0, 20.0, 95.0]

const velocityKeyPointsX = [-1.0, -0.5, 0.0, 0.5, 1.0]
const velocityKeyPointsY = [0.0, 18.0, 42.0, 78.0, 127.0]

const velocityNKeyPointsX = [-1.0, -0.5, 0.0, 0.5, 1.0]
const velocityNKeyPointsY = [-40.0, -20.0, 0.0, 20.0, 40.0]

const articulationKeyPointsX = [0.0, 0.25, 0.5, 0.75, 1.0]
const articulationKeyPointsY = [0.0, 12.5, 25.0, 37.5, 50.0]

const articulationNKeyPointsX = [0.0, 0.25, 0.5, 0.75, 1.0]
const articulationNKeyPointsY = [0.0, 12.5, 25.0, 37.5, 50.0]

const modwheelKeyPointsX = [-1.0, -0.5, 0.0, 0.5, 1.0]
const modwheelKeyPointsY = [0.0, 31.0, 63.0, 95.0, 127.0]

// Common button event redirection.
const ButtonDispatcher = {
    x: 'previousTitle',
    a: 'startStop',
    b: 'nextTitle',
    y: 'rewindTitle',
    dpup: 'navigateUp',
    dpdown: 'navigateDown',
    dpleft: 'navigateLeft',
    dpright: 'navigateRight',
    leftshoulder: 'reserved',
    rightshoulder: 'controlSustainPedal',
    leftstick: 'reloadScore',
    rightstick: 'controlStyle',
}

// Grand staff event redirection.
const grandStaffDispatcher = {
    lefttrigger: 'controlArticulationLowerStaff',
    righttrigger: 'controlArticulationUpperStaff',
    leftx: 'controlVelocityStaffs12Voice2',
    lefty: 'controlVelocityStaffs12Voice1',
    rightx: 'controlVelocity',
    righty: 'controlTempoInverse',
}

// Grand staff event redirection including sensor events.
const grandStaffSensorDispatcher = {
    lefttrigger: 'controlArticulationLowerStaff',
    righttrigger: 'controlArticulationUpperStaff',
    leftx: 'controlVelocityLowerStaffVoices24',
    lefty: 'controlVelocityLowerStaffVoices13',
    rightx: 'controlVelocityUpperStaffVoices24',
    righty: 'controlVelocityUpperStaffVoices13',
    accelx: 'controlVelocity',
    accely: 'controlTempo',
}

// Four staff event redirection.
const fourStaffSensorDispatcher = {
    lefttrigger: 'controlArticulationStaffs34',
    righttrigger: 'controlArticulationStaffs12',
    leftx: 'controlVelocityStaff4',
    lefty: 'controlVelocityStaff3',
    rightx: 'controlVelocityStaff2',
    righty: 'controlVelocityStaff1',
    accelx: 'controlVelocity',
    accely: 'controlTempo',
}

var dispatcher = ButtonDispatcher

// Creates the dispatcher object.
function createDispatcher(name) {
    switch (name) {
        case 'grandStaffDispatcher':
            dispatcher = Object.assign({}, ButtonDispatcher, grandStaffDispatcher)
            break
        case 'grandStaffSensorDispatcher':
            dispatcher = Object.assign({}, ButtonDispatcher, grandStaffSensorDispatcher)
            break
        case 'fourStaffSensorDispatcher':
            dispatcher = Object.assign({}, ButtonDispatcher, fourStaffSensorDispatcher)
            break
    }
}

export default class Dispatcher {
    constructor(controller, player) {
        this.controller = controller
        this.player = player
        this.initializeInterpolators()
    }

    // Initializes interpolators for continuous values.
    initializeInterpolators() {
        this.tempoInterpolator = SplineInterpolator(tempoKeyPointsX, tempoKeyPointsY)
        this.velocityInterpolator = SplineInterpolator(velocityKeyPointsX, velocityKeyPointsY)
        this.velocityNInterpolator = SplineInterpolator(velocityNKeyPointsX, velocityNKeyPointsY)
        this.articulationInterpolator = SplineInterpolator(
            articulationKeyPointsX,
            articulationKeyPointsY,
        )
        this.articulationNInterpolator = SplineInterpolator(
            articulationNKeyPointsX,
            articulationNKeyPointsY,
        )
        this.modwheelInterpolator = SplineInterpolator(modwheelKeyPointsX, modwheelKeyPointsY)
    }

    // Dispatches incoming events.
    dispatch(index, label, value) {
        const name = dispatcher[label]
        if (name == null) {
            return
        }
        switch (label) {
            case 'x':
            case 'a':
            case 'b':
            case 'y':
                {
                    this[name](index, value)
                }
                break
            case 'lefttrigger':
            case 'righttrigger':
                {
                    this[name](index, value)
                }
                break
            case 'rightshoulder':
            case 'leftstick':
            case 'rightstick':
                {
                    this[name](index, value)
                }
                break
            case 'leftx':
            case 'lefty':
            case 'rightx':
            case 'righty':
                this[name](index, value)
                break
            case 'accelx':
            case 'accely':
                {
                    this[name](index, value)
                }
                break
            case 'dpup':
            case 'dpdown':
            case 'dpleft':
            case 'dpright':
                this[name](index, value)
                break
        }
    }

    // Gets the sensors from a gamepad.
    getSensors(gamepads) {
        return gamepads.filter((gamepad) => {
            return gamepad.sensors != null
        })
    }

    // Configures the dispatcher.
    configure(gamepads, meta) {
        const numGamepads = gamepads.length
        const numStaffs = meta.numStaffs
        const numSensors = this.getSensors(gamepads)?.length ?? 0

        this.clearGamepad()

        if (numSensors == 0) {
            if (numGamepads == 1) {
                if (numStaffs <= 2) {
                    createDispatcher('grandStaffDispatcher')
                }
            }
        } else if (numSensors == 1) {
            if (numGamepads == 1 || numGamepads == 2) {
                if (numStaffs <= 2) {
                    createDispatcher('grandStaffSensorDispatcher')
                } else if (numStaffs <= 4) {
                    createDispatcher('fourStaffSensorDispatcher')
                }
            }
        }
    }

    // Passes the 'previous title' event.
    previousTitle() {
        this.controller.previousTitle()
    }

    // Passes the 'start/stop' event.
    startStop() {
        this.controller.startStop()
    }

    // Passes the 'next title' event.
    nextTitle() {
        this.controller.nextTitle()
    }

    // Passes the 'rewind' event.
    rewindTitle() {
        this.controller.rewindTitle()
    }

    // Passes the 'navigate up' event.
    navigateUp() {
        this.controller.navigateUp()
    }

    // Passes the 'navigate down' event.
    navigateDown() {
        this.controller.navigateDown()
    }

    // Passes the 'navigate left' event.
    navigateLeft() {
        this.controller.navigateLeft()
    }

    // Passes the 'navigate right' event.
    navigateRight() {
        this.controller.navigateRight()
    }

    // Reserved for later event.
    reserved() {
        console.navigateUp('reserved')
    }

    // Controls the velocity.
    controlVelocity(index, value) {
        const velocity = this.velocityInterpolator(value)
        this.player.controlVelocity(velocity)
    }

    // Controls the tempo in inverse order.
    controlTempoInverse(index, value) {
        this.controlTempo(index, -value)
    }

    // Controls the tempo.
    controlTempo(_index, value) {
        const tempo = this.tempoInterpolator(value)
        this.player.controlTempo(tempo)
    }

    // Controls the velocity for a given staff.
    controlVelocityStaff(staff, value) {
        const velocity = this.velocityNInterpolator(value)
        this.player.controlVelocityStaff(velocity, staff)
    }

    // Controls the velocity for a given staff and voice.
    controlVelocityStaffVoice(staff, voice, velocity) {
        this.player.controlVelocityStaffVoice(velocity, staff, voice)
    }

    // Controls the velocity of voices 2 and 4 for the lovwer staff.
    controlVelocityLowerStaffVoices24(index, value) {
        const staff = 2 * index + 2
        const velocity = this.velocityNInterpolator(value)
        this.controlVelocityStaffVoice(staff, 2, Math.max(0, velocity))
        this.controlVelocityStaffVoice(staff, 4, Math.max(0, -velocity))
    }

    // Controls the velocity of voices 1 and 3 for the lower staff.
    controlVelocityLowerStaffVoices13(index, value) {
        const staff = 2 * index + 2
        const velocity = this.velocityNInterpolator(value)
        this.controlVelocityStaffVoice(staff, 3, Math.max(0, velocity))
        this.controlVelocityStaffVoice(staff, 1, Math.max(0, -velocity))
    }

    // Controls the velocity of voices 2 and 4 for the upper staff.
    controlVelocityUpperStaffVoices24(index, value) {
        const staff = 2 * index + 1
        const velocity = this.velocityNInterpolator(value)
        this.controlVelocityStaffVoice(staff, 2, Math.max(0, velocity))
        this.controlVelocityStaffVoice(staff, 4, Math.max(0, -velocity))
    }

    // Controls the velocity of voices 1 and 3 for the upper staff.
    controlVelocityUpperStaffVoices13(index, value) {
        const staff = 2 * index + 1
        const velocity = this.velocityNInterpolator(value)
        this.controlVelocityStaffVoice(staff, 3, Math.max(0, velocity))
        this.controlVelocityStaffVoice(staff, 1, Math.max(0, -velocity))
    }

    // Controls the velocity of voice 1 of staff 1 and 2.
    controlVelocityStaffs12Voice1(_index, value) {
        const velocity = this.velocityNInterpolator(value)
        if (value > 0) {
            this.controlVelocityStaffVoice(2, 1, velocity)
            this.controlVelocityStaffVoice(1, 1, 0)
        } else {
            this.controlVelocityStaffVoice(1, 1, -velocity)
            this.controlVelocityStaffVoice(2, 1, 0)
        }
    }

    // Controls the velocity of voice 2 of staff 1 and 2.
    controlVelocityStaffs12Voice2(_index, value) {
        const velocity = this.velocityNInterpolator(value)
        if (value > 0) {
            this.controlVelocityStaffVoice(1, 2, velocity)
            this.controlVelocityStaffVoice(2, 2, 0)
        } else {
            this.controlVelocityStaffVoice(2, 2, -velocity)
            this.controlVelocityStaffVoice(1, 2, 0)
        }
    }

    // Controls the velocity of staff 1.
    controlVelocityStaff1(_index, value) {
        this.controlVelocityStaff(1, -value)
    }

    // Controls the velocity of staff 2.
    controlVelocityStaff2(_index, value) {
        this.controlVelocityStaff(2, value)
    }

    // Controls the velocity of staff 3.
    controlVelocityStaff3(_index, value) {
        this.controlVelocityStaff(3, -value)
    }

    // Controls the velocity of staff 4.
    controlVelocityStaff4(_index, value) {
        this.controlVelocityStaff(4, value)
    }

    // Controls the articulation of a given staff.
    controlArticulationStaff(staff, value) {
        const articulation = this.articulationNInterpolator(value)
        this.player.controlArticulationStaff(articulation, staff)
    }

    // Controls the articulation of a staff 1 and 2.
    controlArticulationStaffs12(staffs, value) {
        this.controlArticulationStaff(1, value)
        this.controlArticulationStaff(2, value)
    }

    // Controls the articulation of a staff 3 and 4.
    controlArticulationStaffs34(staffs, value) {
        this.controlArticulationStaff(3, value)
        this.controlArticulationStaff(4, value)
    }

    // Controls the articulation of the lower staff.
    controlArticulationLowerStaff(index, value) {
        this.controlArticulationStaff(2 * index + 2, value)
    }

    // Controls the articulation of the upper staff.
    controlArticulationUpperStaff(index, value) {
        this.controlArticulationStaff(2 * index + 1, value)
    }

    // Controls the pedal.
    controlPedal(index, value) {
        this.player.controlPedal(index, value)
    }

    // Controls the sustain pedal.
    controlSustainPedal(_index, value) {
        this.player.controlPedal(0, value)
    }

    // Sets the musical style.
    controlStyle(_index, value) {
        if (value == 1) {
            this.sendClick('switchstyle')
        }
    }

    // Reloads the score.
    reloadScore(_index, value) {
        if (value == 1) {
            this.sendClick('reloadscore')
        }
    }

    // Sends a click event.
    sendClick(detail) {
        window.dispatchEvent(
            new CustomEvent('clickhandler', {
                detail: detail,
            }),
        )
    }

    // Handle gamepad button events.
    buttonPressed(index, label, pressed, value) {
        switch (label) {
            case 'x':
            case 'a':
            case 'b':
            case 'y':
                if (pressed) {
                    this.dispatch(index, label, value)
                }
                break
            case 'lefttrigger':
            case 'righttrigger':
                this.dispatch(index, label, value)
                break
            case 'rightshoulder':
            case 'leftstick':
            case 'rightstick':
                this.dispatch(index, label, value)
                break
            case 'dpup':
            case 'dpdown':
            case 'dpleft':
            case 'dpright':
                if (pressed) {
                    this.dispatch(index, label, value)
                }
                break
        }
    }

    // Handle gamepad analog stick events.
    axisChanged(index, label, value) {
        // console.log(`Axis ${index} changed to ${value}`)
        switch (label) {
            case 'leftx':
            case 'lefty':
            case 'rightx':
            case 'righty':
                this.dispatch(index, label, value)
                break
        }
    }

    // Handle acceleration events
    sensorChanged(index, value, label) {
        // console.log(`Sensor ${index} value is ${value}`)
        switch (label) {
            case 'accelx':
            case 'accely':
                this.dispatch(index, label, value)
                break
        }
    }

    // Clears the gamepad
    clearGamepad(_index) {
        this.player.clearControllers()
    }
}
