/*
 * D I S P A T C H E R
 *
 * 2026-03-21
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

const grandStaffDispatcher = {
    lefttrigger: 'controlArticulationLowerStaff',
    righttrigger: 'controlArticulationUpperStaff',
    leftx: 'controlVelocityStaffs12Voice2',
    lefty: 'controlVelocityStaffs12Voice1',
    rightx: 'controlVelocity',
    righty: 'controlTempoInverse',
}

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

    getSensors(gamepads) {
        return gamepads.filter((gamepad) => {
            return gamepad.sensors != null
        })
    }

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

    previousTitle() {
        this.controller.previousTitle()
    }

    startStop() {
        this.controller.startStop()
    }

    nextTitle() {
        this.controller.nextTitle()
    }

    rewindTitle() {
        this.controller.rewindTitle()
    }

    navigateUp() {
        this.controller.navigateUp()
    }

    navigateDown() {
        this.controller.navigateDown()
    }

    navigateLeft() {
        this.controller.navigateLeft()
    }

    navigateRight() {
        this.controller.navigateRight()
    }

    reserved() {
        console.navigateUp('reserved')
    }

    controlVelocity(index, value) {
        const velocity = this.velocityInterpolator(value)
        this.player.controlVelocity(velocity)
    }

    controlTempoInverse(index, value) {
        this.controlTempo(index, -value)
    }

    controlTempo(_index, value) {
        const tempo = this.tempoInterpolator(value)
        this.player.controlTempo(tempo)
    }

    controlVelocityStaff(staff, value) {
        const velocity = this.velocityNInterpolator(value)
        this.player.controlVelocityStaff(velocity, staff)
    }

    controlVelocityStaffVoice(staff, voice, velocity) {
        this.player.controlVelocityStaffVoice(velocity, staff, voice)
    }

    controlVelocityLowerStaffVoices24(index, value) {
        const staff = 2 * index + 2
        const velocity = this.velocityNInterpolator(value)
        this.controlVelocityStaffVoice(staff, 2, Math.max(0, velocity))
        this.controlVelocityStaffVoice(staff, 4, Math.max(0, -velocity))
    }

    controlVelocityLowerStaffVoices13(index, value) {
        const staff = 2 * index + 2
        const velocity = this.velocityNInterpolator(value)
        this.controlVelocityStaffVoice(staff, 3, Math.max(0, velocity))
        this.controlVelocityStaffVoice(staff, 1, Math.max(0, -velocity))
    }

    controlVelocityUpperStaffVoices24(index, value) {
        const staff = 2 * index + 1
        const velocity = this.velocityNInterpolator(value)
        this.controlVelocityStaffVoice(staff, 2, Math.max(0, velocity))
        this.controlVelocityStaffVoice(staff, 4, Math.max(0, -velocity))
    }

    controlVelocityUpperStaffVoices13(index, value) {
        const staff = 2 * index + 1
        const velocity = this.velocityNInterpolator(value)
        this.controlVelocityStaffVoice(staff, 3, Math.max(0, velocity))
        this.controlVelocityStaffVoice(staff, 1, Math.max(0, -velocity))
    }

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

    controlVelocityStaff1(_index, value) {
        this.controlVelocityStaff(1, -value)
    }

    controlVelocityStaff2(_index, value) {
        this.controlVelocityStaff(2, value)
    }

    controlVelocityStaff3(_index, value) {
        this.controlVelocityStaff(3, -value)
    }

    controlVelocityStaff4(_index, value) {
        this.controlVelocityStaff(4, value)
    }

    controlArticulationStaff(staff, value) {
        const articulation = this.articulationNInterpolator(value)
        this.player.controlArticulationStaff(articulation, staff)
    }

    controlArticulationStaffs12(staffs, value) {
        this.controlArticulationStaff(1, value)
        this.controlArticulationStaff(2, value)
    }

    controlArticulationStaffs34(staffs, value) {
        this.controlArticulationStaff(3, value)
        this.controlArticulationStaff(4, value)
    }

    controlArticulationLowerStaff(index, value) {
        this.controlArticulationStaff(2 * index + 2, value)
    }

    controlArticulationUpperStaff(index, value) {
        this.controlArticulationStaff(2 * index + 1, value)
    }

    controlPedal(index, value) {
        this.player.controlPedal(index, value)
    }

    controlSustainPedal(_index, value) {
        this.player.controlPedal(0, value)
    }

    controlStyle(_index, value) {
        if (value == 1) {
            this.sendClick('switchstyle')
        }
    }

    reloadScore(_index, value) {
        if (value == 1) {
            this.sendClick('reloadscore')
        }
    }

    sendClick(detail) {
        window.dispatchEvent(
            new CustomEvent('clickhandler', {
                detail: detail,
            }),
        )
    }

    // Handle gamepad button events.
    buttonPressed(index, label, pressed, value) {
        // console.log(`Button ${index} ${pressed ? 'pressed' : 'released'} ${label}`)
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

    clearGamepad(index) {
        this.player.clearControllers()
    }
}
