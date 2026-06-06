// HID Handler

import hidconfig from './hidconfig.js'

const VendorId = Object.freeze({
    Sony: 0x054c,
    Nintendo: 0x057e,
    _8BitDo: 0x2dc8,
})

const Usage = Object.freeze({
    GenericDesktopPage: 0x01,
    SportControlsPage: 0x04,
    GameControlPage: 0x05,
})

Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max)
}

function toArcUnit(value) {
    return ((4 * Math.asin(value.clamp(-1, 1))) / Math.PI).clamp(-1, 1)
}

// Normalizes stick axis to the range -1 ... +1.
function normalizeStickAxis(value) {
    return (2 * value) / 0xff - 1.0
}

// Normalizes trigger value 0 ... +1.
function normalizeTrigger(value) {
    return value / 0xff
}

// Normalizes sensor values.
function normalizeSensors(value) {
    return value / 8192
}

// Create a button accessor.
function buttonAccessor() {
    const byte = arguments[0]
    const bit = arguments[1]
    const label = arguments[2]
    let last = false
    return function (report) {
        const pressed = report.getUint8(byte) & (0x01 << bit)
        const update = pressed != last
        last = pressed
        return {
            pressed: pressed ? true : false,
            value: pressed ? 1.0 : 0.0,
            update: update,
            label: label,
        }
    }
}

// Create a value accessor.
function valueAccessor() {
    const byte = arguments[0]
    const label = arguments[1]
    return function (report) {
        const value = report.getUint8(byte) & 0xf
        return {
            pressed: true,
            value: value / 8,
            update: false,
            label: label,
        }
    }
}

// Create a directory pad accessor.
function dpadAccessor() {
    const byte = arguments[0]
    const values = arguments[1]
    const label = arguments[2]
    let last = false
    return function (report) {
        const value = report.getUint8(byte) & 0xf
        const pressed = values.reduce((result, currValue) => {
            return result || value == currValue
        }, false)
        const update = pressed != last
        last = pressed
        return {
            pressed: pressed ? true : false,
            value: pressed ? 1.0 : 0.0,
            update: update,
            label: label,
        }
    }
}

// Create a trigger accessor.
function triggerAccessor() {
    const byte = arguments[0]
    const bit = arguments[1]
    const trigger = arguments[2]
    const label = arguments[3]
    let lastPressed = false
    let lastValue = 0
    return function (report) {
        const pressed = report.getUint8(byte) & (0x01 << bit)
        const value = report.getUint8(trigger)
        const update = pressed != lastPressed || value != lastValue
        lastPressed = pressed
        lastValue = value
        return {
            pressed: pressed ? true : false,
            value: normalizeTrigger(value),
            update: update,
            label: label,
        }
    }
}

// Creates an axis accessor.
function axisAccessor() {
    const byte = arguments[0]
    const label = arguments[1]
    let last = 0
    return function (report) {
        const value = report.getUint8(byte)
        const update = value != last
        last = value
        return {
            value: normalizeStickAxis(value),
            update: update,
            label: label,
        }
    }
}

// Creates a horizontal axis accessor for the Nintendo.
function axisAccessorNinX() {
    const byte = arguments[0]
    const label = arguments[1]
    let last = 0
    return function (report) {
        const byte0 = report.getUint8(byte)
        const byte1 = report.getUint8(byte + 1)
        const horizontal = byte0 | ((byte1 & 0xf) << 8)
        const value = (horizontal / 2000 - 1) * 1.5
        const update = value != last
        last = value
        return {
            value: Math.max(Math.min(value, 1), -1),
            update: update,
            label: label,
        }
    }
}

// Creates a vertical axis accessor for the Nintendo.
function axisAccessorNinY() {
    const byte = arguments[0]
    const label = arguments[1]
    let last = 0
    return function (report) {
        const byte0 = report.getUint8(byte)
        const byte1 = report.getUint8(byte + 1)
        const vertical = (byte0 >> 4) | (byte1 << 4)
        const value = (vertical / 2000 - 1) * 1.5
        const update = value != last
        last = value
        return {
            value: Math.max(Math.min(value, 1), -1),
            update: update,
            label: label,
        }
    }
}

// Creates a sensor accessor.
function sensorAccessor() {
    const byte = arguments[0]
    const bits = arguments[1]
    const endian = arguments[2]
    const label = arguments[3]
    const normalizer = arguments[4] ?? normalizeSensors
    return function (report) {
        return {
            value: bits == 16 ? normalizer(report.getInt16(byte, endian)) : 0,
            label: label,
        }
    }
}

/*
 * HID Handler Class
 */
export default class HidHandler {
    constructor(dispatcher, gamepadManager) {
        this.dispatcher = dispatcher
        this.gamepadManager = gamepadManager
        // Holds the updated input values.
        this.gamepads = []
        this.index = 100
        // Holds device accessors.
        if (this.hasHID) {
            // Listen to connection events.
            this.addEventHandler(navigator.hid, 'connect', this.connectHandler.bind(this))
            // Listen to disconnection events.
            this.addEventHandler(navigator.hid, 'disconnect', this.disconnectHandler.bind(this))
        }
    }

    // Checks if input devices are available.
    get hasHID() {
        return window.navigator.hid != null
    }

    // Adds event handlers.
    addEventHandler(device, type, handler) {
        device.addEventListener(type, handler)
    }

    // Removes event handlers
    removeEventHandler(device, type, handler) {
        device.removeEventListener(type, handler)
    }

    // Handles connections.
    async connectHandler(event) {
        console.log(`HID connected: ${event.device.productName}`)
        // await this.registerDevice(event.device)
    }

    // Handles disconnections.
    disconnectHandler(event) {
        console.log(`HID disconnected: ${event.device.productName}`)
        const gamepad = this.findGamepad(event.device)
        if (gamepad != null) {
            this.unregisterDevice(gamepad)
        }
    }

    // Handles the running device input.
    handleInputReport(report, gamepad) {
        const gamepadIndex = this.gamepadManager.findGamepadIndex(gamepad)
        if (gamepadIndex == -1) {
            return
        }
        gamepad.buttons?.splice(0)
        gamepad.axes?.splice(0)
        gamepad.sensors?.splice(0)

        gamepad.deviceAccessor?.buttonAccessors.forEach((buttonAccessor) => {
            const button = buttonAccessor(report)
            if (button.update) {
                this.dispatcher.buttonPressed(
                    gamepadIndex,
                    button.label,
                    button.pressed,
                    button.value,
                )
            }
            gamepad.buttons.push(button)
        })

        gamepad.deviceAccessor?.axisAccessors.forEach((axisAccessor) => {
            const axis = axisAccessor(report)
            if (axis.update) {
                this.dispatcher.axisChanged(gamepadIndex, axis.label, axis.value)
            }
            gamepad.axes.push(axis)
        })

        gamepad.deviceAccessor?.sensorAccessors.forEach((sensorAccessor, index) => {
            const sensor = sensorAccessor(report)
            this.dispatcher.sensorChanged(index, toArcUnit(sensor.value), sensor.label)
            gamepad.sensors.push(sensor)
        })

        this.gamepadManager.updateGamepad(gamepad)
    }

    createAccessors(gamepad, config) {
        const normalizer = {
            norm1: function (value) {
                return value / 8192
            },
            norm1neg: function (value) {
                return -value / 8192
            },
            norm2: function (value) {
                return 0.000244 * value
            },
            norm2neg: function (value) {
                return 0.000244 * -value
            },
        }
        gamepad.deviceAccessor.buttonAccessors = []
        gamepad.deviceAccessor.axisAccessors = []
        gamepad.deviceAccessor.sensorAccessors = []

        config.keys.forEach((key) => {
            switch (key.name) {
                case 'x':
                case 'a':
                case 'b':
                case 'y':
                case 'leftshoulder':
                case 'rightshoulder':
                case 'back':
                case 'start':
                case 'leftstick':
                case 'rightstick':
                case 'guide':
                    gamepad.deviceAccessor.buttonAccessors.push(
                        buttonAccessor(key.byte, key.bit, key.name),
                    )
                    break
                case 'dpup':
                case 'dpdown':
                case 'dpleft':
                case 'dpright':
                    gamepad.deviceAccessor.buttonAccessors.push(
                        dpadAccessor(key.byte, key.values, key.name),
                    )
                    break
                case 'lefttrigger':
                case 'righttrigger':
                    if (key.trigger != null) {
                        gamepad.deviceAccessor.buttonAccessors.push(
                            triggerAccessor(key.byte, key.bits, key.trigger, key.name),
                        )
                    } else {
                        gamepad.deviceAccessor.buttonAccessors.push(
                            buttonAccessor(key.byte, key.bit, key.name),
                        )
                    }
                    break
                case 'battery':
                    gamepad.deviceAccessor.buttonAccessors.push(valueAccessor(key.byte, key.name))
                    break
                case 'leftx':
                case 'lefty':
                case 'rightx':
                case 'righty':
                    if (key.type == null) {
                        gamepad.deviceAccessor.axisAccessors.push(axisAccessor(key.byte, key.name))
                    } else {
                        if (key.type == 'nin-x') {
                            gamepad.deviceAccessor.axisAccessors.push(
                                axisAccessorNinX(key.byte, key.name),
                            )
                        } else if (key.type == 'nin-y') {
                            gamepad.deviceAccessor.axisAccessors.push(
                                axisAccessorNinY(key.byte, key.name),
                            )
                        }
                    }
                    break
                case 'accelx':
                case 'accely':
                case 'accelz':
                    gamepad.deviceAccessor.sensorAccessors.push(
                        sensorAccessor(
                            key.byte,
                            key.bits,
                            key.big,
                            key.name,
                            normalizer[key.normalize],
                        ),
                    )
                    break
            }
        })
    }

    // Called by the system when an input arrives.
    inputReport(event) {
        const gamepad = this.findGamepad(event.device)
        if (gamepad != null) {
            this.handleInputReport(event.data, gamepad)
        }
    }

    async configureDevice(device) {
        const connectionType = this.getConnectionType(device)
        try {
            switch (device.vendorId) {
                case VendorId.Sony:
                    if (connectionType == 'bluetooth') {
                        await this.readFeatureReport05(device)
                    }
                    break
                case VendorId._8BitDo:
                    {
                        const featureReport = await device.receiveFeatureReport(0x06)
                        console.log('8BitDo feature report:', featureReport)
                    }
                    break
                case VendorId.Nintendo:
                    await this.enableStandardFullMode(device)
                    await this.enableIMUMode(device)
                    break
            }
        } catch (error) {
            console.error(error)
        }
        return connectionType
    }

    async configureGamepad(gamepad) {
        const connection = await this.configureDevice(gamepad.device)

        const config = await hidconfig(gamepad.vendorId, gamepad.productId, connection)
        if (config == null) {
            console.log(`Gamepad "${gamepad.id}" is not supported.`)
            this.sendGamepadEvent('connectgamepad', {
                vendorId: gamepad.vendorId,
                productId: gamepad.productId,
            })
        } else {
            this.createAccessors(gamepad, config)
        }
        return config
    }

    sendGamepadEvent(eventType, detail) {
        window.dispatchEvent(
            new CustomEvent(eventType, {
                detail: detail,
            }),
        )
    }

    /**
     * Enables the "Standard Full Mode" on the Joy-Con device by sending the appropriate subcommand.
     *
     * This mode allows the Joy-Con to report all standard input data, including button presses,
     * analog stick positions, and sensor data. The method constructs the required data packet
     * and sends it to the device using the HID report protocol.
     *
     * @returns {Promise<void>} A promise that resolves once the command has been sent.
     * @throws {Error} If the device communication fails.
     */
    async enableStandardFullMode(device) {
        const outputReportID = 0x01
        const subcommand = [0x03, 0x30]
        const data = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...subcommand]
        await device.sendReport(outputReportID, new Uint8Array(data))
    }

    /**
     * Enables the IMU (Inertial Measurement Unit) mode on the Joy-Con device.
     *
     * Sends a subcommand to the device to activate the IMU, which allows the Joy-Con
     * to start reporting motion sensor data such as accelerometer and gyroscope readings.
     *
     * @returns A promise that resolves when the command has been sent to the device.
     * @throws Will throw an error if sending the report to the device fails.
     */
    async enableIMUMode(device) {
        const outputReportID = 0x01
        const subcommand = [0x40, 0x01]
        const data = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...subcommand]
        await device.sendReport(outputReportID, new Uint8Array(data))
    }

    parseCollections(device) {
        for (const collection of device.collections) {
            // A HID collection includes usage, usage page, reports, and subcollections.
            console.log(`Usage: ${collection.usage}`)
            console.log(`Usage page: ${collection.usagePage}`)

            if (
                collection.usagePage != Usage.GenericDesktopPage ||
                collection.usage != Usage.GameControlPage
            )
                continue

            for (const inputReport of collection.inputReports) {
                console.log(`Input report: ${inputReport.reportId}`)
                console.log(inputReport)
                for (const item of inputReport.items) {
                    console.log(item)
                }
                // Loop through inputReport.items
            }

            for (const outputReport of collection.outputReports) {
                console.log(`Output report: ${outputReport.reportId}`)
                console.log(outputReport)
                for (const item of outputReport.items) {
                    console.log(item)
                }
                // Loop through outputReport.items
            }

            for (const featureReport of collection.featureReports) {
                console.log(`Feature report: ${featureReport.reportId}`)
                console.log(featureReport)
                for (const item of featureReport.items) {
                    console.log(item)
                }
                // Loop through featureReport.items
            }

            // Loop through subcollections with collection.children
        }
    }

    // Finds out about the connection type.
    getConnectionType(device) {
        // this.parseCollections(device)

        // WebHID API doesn't indicate whether we are connected through the controller's
        // USB or Bluetooth interface. The protocol is different depending on the connection
        // type so we will try to detect it based on the collection information.
        let connectionType = 'x'
        for (const c of device.collections) {
            if (c.usagePage != Usage.GenericDesktopPage || c.usage != Usage.GameControlPage)
                continue
            /*
            c.inputReports.forEach((e) => {
                console.log('report', e)
            })
            */
            // Compute the maximum input report byte length and compare against known values.
            let maxInputReportBytes = c.inputReports.reduce((max, report) => {
                return Math.max(
                    max,
                    report.items.reduce((sum, item) => {
                        return sum + item.reportSize * item.reportCount
                    }, 0),
                )
            }, 0)
            if (maxInputReportBytes == 504) connectionType = 'usb'
            else /* if (maxInputReportBytes == 616) */ connectionType = 'bluetooth'
        }
        console.log('Connection type:', connectionType)
        return connectionType
    }

    async readFeatureReport05(device) {
        // By default, bluetooth-connected DualSense only sends input report 0x01 which omits motion and touchpad data.
        // Reading feature report 0x05 causes it to start sending input report 0x31.
        //
        // Note: The Gamepad API will do this for us if it enumerates the gamepad.
        // Other applications like Steam may have also done this already.
        const featureReport = await device.receiveFeatureReport(0x05)
        console.log('Feature report 5:', featureReport)
    }

    findGamepad(device) {
        return this.gamepads.find((gamepad) => {
            return device === gamepad.device
        })
    }

    async registerDevice(device) {
        console.log('device', device)
        // Open device
        if (!device.opened) {
            await device.open()
        }
        const gamepad = {
            id: device.productName,
            vendorId: device.vendorId,
            productId: device.productId,
            device: device,
            index: this.index,
            buttons: [],
            axes: [],
            sensors: [],
            deviceAccessor: {
                buttonAccessors: [],
                axisAccessors: [],
                sensorAccessors: [],
            },
        }
        const config = await this.configureGamepad(gamepad)
        if (config != null) {
            // Start getting input events.
            this.addEventHandler(device, 'inputreport', this.inputReport.bind(this))
            this.gamepads.push(gamepad)
            this.index += 1
            // Wait for a while to get a report
            setTimeout(() => {
                this.gamepadManager.addGamepad(gamepad)
            }, 100)
        }
    }

    unregisterDevice(gamepad) {
        const gamepadIndex = this.gamepadManager.findGamepadIndex(gamepad)

        this.removeEventHandler(gamepad.device, 'inputreport', this.inputReport.bind(this))

        gamepad.buttons?.forEach((button) => {
            this.dispatcher.buttonPressed(gamepadIndex, button.label, false, 0)
        })

        gamepad.axes?.forEach((axis) => {
            this.dispatcher.axisChanged(gamepadIndex, axis.label, 0)
        })

        gamepad.sensors?.forEach((sensor) => {
            this.dispatcher.sensorChanged(gamepadIndex, 0.0, sensor.label)
        })

        gamepad.buttons?.splice(0)
        gamepad.axes?.splice(0)
        gamepad.sensors?.splice(0)

        this.gamepadManager.updateGamepad(gamepad)
        this.gamepadManager.removeGamepad(gamepad)
        this.gamepads.splice(gamepad, 1)

        this.dispatcher.clearGamepad(gamepadIndex)
    }

    // Requests an input device.
    async requestDevice() {
        console.log('requestDevice')
        try {
            const devices = await navigator.hid.requestDevice({
                filters: [
                    {
                        usage: Usage.GameControlPage,
                        usagePage: 1,
                    },
                    {
                        usage: 4,
                        usagePage: 1,
                    },
                    {
                        vendorId: VendorId.Nintendo,
                    },
                    {
                        vendorId: VendorId.Sony,
                    },
                    {
                        vendorId: VendorId._8BitDo,
                    },
                ],
            })
            for (const device of devices) {
                await this.registerDevice(device)
            }
        } catch (error) {
            alert(error)
        }
    }
}
