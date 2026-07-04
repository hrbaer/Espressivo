/*
 * Motion Sensor Class
 */

const ACCCONST = 1.0 / 9.8

Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max)
}

function scaleAcc(value) {
    return ACCCONST * value
}

function toArcUnit(value) {
    return ((4 * Math.asin(value.clamp(-1, 1))) / Math.PI).clamp(-1, 1)
}

function transformAccelerationLandscapePrimary(acceleration) {
    return { x: -scaleAcc(acceleration.y), y: scaleAcc(acceleration.x) }
}

function transformAccelerationLandscapeSecondary(acceleration) {
    return { x: scaleAcc(acceleration.y), y: -scaleAcc(acceleration.x) }
}

function transformAccelerationPortraitPrimary(acceleration) {
    return { x: scaleAcc(acceleration.x), y: scaleAcc(acceleration.y) }
}

function transformAccelerationPortraitSecondary(acceleration) {
    return { x: -scaleAcc(acceleration.x), y: -scaleAcc(acceleration.y) }
}

export default class MotionSensor {
    constructor(dispatcher, gamepadManager) {
        this.dispatcher = dispatcher
        this.gamepadManager = gamepadManager
        this.deviceIndex = 0
        this.index = 200
        this.transformAcceleration = transformAccelerationLandscapePrimary
    }

    addMotionEventListener() {
        window.addEventListener('devicemotion', this.motionEventListener.bind(this))
        screen.orientation.addEventListener('change', this.orientationEventListener.bind(this))
    }

    removeMotionEventListener() {
        window.removeEventListener('devicemotion', this.motionEventListener)
        screen.orientation.removeEventListener('change', this.motionEventListener)
    }

    motionEventListener(event) {
        this.trackMotion(event.accelerationIncludingGravity)
    }

    orientationEventListener(event) {
        this.setTransformer(event.target)
    }

    setTransformer(orientation) {
        console.log('orientation', orientation)
        switch (orientation.type) {
            case 'landscape-primary':
                this.transformAcceleration = transformAccelerationLandscapePrimary
                break
            case 'landscape-secondary':
                this.transformAcceleration = transformAccelerationLandscapeSecondary
                break
            case 'portrait-primary':
                this.transformAcceleration = transformAccelerationPortraitPrimary
                break
            case 'portrait-secondary':
                this.transformAcceleration = transformAccelerationPortraitSecondary
                break
        }
        this.resetMotion()
    }

    start() {
        this.sensor = {
            id: 'Internal Motion Sensor',
            device: {},
            index: 100,
            buttons: [],
            axes: [],
            sensors: [],
            deviceAccessor: {
                sensorAccessors: [],
            },
        }
        this.setTransformer(screen.orientation)
        // Start getting input events.
        this.addMotionEventListener()
        this.resetMotion()
        this.gamepadManager.addGamepad(this.sensor)
    }

    disconnect() {
        const sensorIndex = this.gamepadManager.findGamepadIndex(this.sensor)

        this.removeMotionEventListener()
        this.resetMotion()

        this.gamepadManager.updateGamepad(this.sensor)
        this.gamepadManager.removeGamepad(this.sensor)

        this.dispatcher.clearGamepad(sensorIndex)

        this.sensor = null
    }

    connect() {
        if (
            typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function'
        ) {
            DeviceMotionEvent.requestPermission()
                .then((response) => {
                    if (response === 'granted') {
                        // Permission granted
                        this.start()
                    } else {
                        // Permission denied
                    }
                })
                .catch(console.error)
        } else {
            // other devices
            this.start()
        }
    }

    toggleMotionSensor() {
        if (this.sensor == null) {
            this.connect()
        } else {
            this.disconnect()
        }
    }

    get isConnected() {
        return this.sensor != null
    }

    resetMotion() {
        this.trackMotion({ x: 0, y: 0 })
    }

    trackMotion(acceleration) {
        if (this.sensor == null) {
            return
        }
        console.log('track acceleration:', acceleration)
        this.sensor.sensors.splice(0)

        const transformedAcceleration = this.transformAcceleration(acceleration)

        this.sensor.sensors.push({ value: transformedAcceleration.x, label: 'accelx' })
        this.sensor.sensors.push({ value: transformedAcceleration.y, label: 'accely' })

        this.dispatcher.sensorChanged(
            this.sensor.index,
            toArcUnit(transformedAcceleration.x),
            'accelx',
        )
        this.dispatcher.sensorChanged(
            this.sensor.index,
            toArcUnit(transformedAcceleration.y),
            'accely',
        )

        this.gamepadManager.updateGamepad(this.sensor)
    }
}
