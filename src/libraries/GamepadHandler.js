/*
 *  G A M E P A D H A N D L E R
 *
 *  Handles gamepad connections and events.
 *
 */

import keyLabels from './keyLabels.js'
import notify from './notify.js'

// Creates a button accessor.
function buttonAccessor() {
    const index = arguments[0]
    const label = arguments[1]
    let last = 0
    return function (buttons) {
        const button = buttons[index]
        if (button == null) {
            return null
        }
        const update = button.value != last
        last = button.value
        return {
            pressed: button.pressed,
            value: button.value,
            update: update,
            label: label,
        }
    }
}

// Creates an axis accessor.
function axisAccessor() {
    const index = arguments[0]
    const label = arguments[1]
    let last = 0
    return function (axes) {
        const axis = axes[index] ?? 0
        const update = axis != last
        last = axis
        return {
            value: axis,
            update: update,
            label: label,
        }
    }
}

export default class Gamepad {
    constructor(dispatcher, gamepadManager) {
        this.dispatcher = dispatcher
        this.gamepadManager = gamepadManager
        this.addEventHandler()
        this.gamepadList = []
        this.hasGamepads = false
    }

    requestAccess() {
        console.log('requestAccess')
        navigator.requestMIDIAccess()
    }

    addEventHandler() {
        window.addEventListener('gamepadconnected', this.connectedListener.bind(this))
        window.addEventListener('gamepaddisconnected', this.disconnectedListener.bind(this))
    }

    removeEventHandler() {
        window.removeEventListener('gamepadconnected', this.connectedListener)
        window.removeEventListener('gamepaddisconnected', this.disconnectedListener)
    }

    connectedListener(e) {
        console.log(
            'Gamepad connected at index %d: %s. %d buttons, %d axes.',
            e.gamepad.index,
            e.gamepad.id,
            e.gamepad.buttons.length,
            e.gamepad.axes.length,
        )

        const options = { body: `${e.gamepad.id}` }
        notify('Gamepad attached', options)

        if (window.navigator.hid == null) {
            this.connectGamepad(e.gamepad)
        }
    }

    connectGamepad(gamepad) {
        const accessors = this.createAccessors(keyLabels)
        this.gamepadList.push({
            index: gamepad.index,
            deviceAccessor: accessors,
        })
        const clone = this.cloneGamepad(gamepad, accessors)
        this.gamepadManager.addGamepad(clone)
    }

    disconnectedListener(e) {
        const gamepad = e.gamepad

        console.log('Gamepad disconnected', gamepad.id)
        const options = { body: `${gamepad.id}` }
        notify('Gamepad detached', options)

        const index = this.gamepadList.findIndex((pad) => {
            return gamepad.index == pad.index
        })
        if (index != -1) {
            const gamepadClone = this.gamepadList.splice(index, 1)[0]
            if (gamepadClone != null) {
                this.gamepadManager.removeGamepad(gamepadClone)
            }
        }

        const gamepadIndex = this.gamepadManager.findGamepadIndex(gamepad)
        this.dispatcher.clearGamepad(gamepadIndex)

        if (window.navigator.hid == null) {
            const options = { body: `${e.gamepad.id}` }
            notify('Gamepad detached', options)
        }
    }

    createAccessors(keyLabels) {
        const deviceAccessor = {
            buttonAccessors: [],
            axisAccessors: [],
        }
        keyLabels.buttons.forEach((label, index) => {
            deviceAccessor.buttonAccessors.push(buttonAccessor(index, label))
        })
        keyLabels.axes.forEach((label, index) => {
            deviceAccessor.axisAccessors.push(axisAccessor(index, label))
        })

        return deviceAccessor
    }

    clock(deltaTime) {
        this.trackGamepads()
    }

    trackGamepads() {
        const gamepads = this.getGamepads()
        gamepads.forEach((gamepad) => {
            const entry = this.gamepadList.find((pad) => {
                return gamepad.index == pad.index
            })
            if (entry != null) {
                const gamepadIndex = this.gamepadManager.findGamepadIndex(gamepad)
                const clone = this.cloneGamepad(gamepad, entry.deviceAccessor, gamepadIndex)
                this.gamepadManager.updateGamepad(clone)
            }
        })
        this.hasGamepads = gamepads.length > 0
    }

    cloneGamepad(gamepad, deviceAccessor, gamepadIndex) {
        const gamepadClone = {
            id: gamepad.id,
            buttons: [],
            axes: [],
            index: gamepad.index,
        }

        if (gamepad != null) {
            deviceAccessor.buttonAccessors.forEach((button) => {
                const buttonClone = button(gamepad.buttons)
                if (buttonClone != null) {
                    if (buttonClone.update) {
                        this.dispatcher.buttonPressed(
                            gamepadIndex,
                            buttonClone.label,
                            buttonClone.pressed,
                            buttonClone.value,
                        )
                    }
                    gamepadClone.buttons.push(buttonClone)
                }
            })
            deviceAccessor.axisAccessors.forEach((axis) => {
                const axisClone = axis(gamepad.axes)
                if (axisClone.update) {
                    this.dispatcher.axisChanged(gamepadIndex, axisClone.label, axisClone.value)
                }
                gamepadClone.axes.push(axisClone)
            })
        }
        return gamepadClone
    }

    get hasGamepad() {
        return navigator.getGamepads != null
    }

    getGamepads() {
        return navigator.getGamepads().filter((e) => {
            return e != null
        })
    }

    findGamepad(info) {
        const gamepads = this.getGamepads()
        if (gamepads.length == 0) {
            return
        }
        if (gamepads.length == 1) {
            return gamepads[0]
        }
        const vendorId = info.vendorId.toString(16)
        const productId = info.vendorId.toString(16)
        return gamepads.find((gamepad) => {
            return gamepad.id.indexOf(vendorId) >= 0 && gamepad.id.indexOf(productId) >= 0
        })
    }
}
