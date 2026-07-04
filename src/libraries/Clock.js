/*
 *  C L O C K
 *
 *  The clock used to drive the gamepad-driven MIDI player.
 *
 */

export default class Clock {
    // Passes the callback function.
    constructor(clock) {
        this.clock = clock
        this.running = false
    }

    // Internally runs the clock.
    run() {
        const now = performance.now()
        const deltaTime = now - this.startTime
        this.startTime = now
        this.clock(deltaTime)
        if (this.running) {
            setTimeout(this.run.bind(this), 5)
        }
    }

    // Starts the clock.
    start() {
        this.running = true
        this.counter = 0
        this.startTime = performance.now()
        this.run()
    }

    // Stops the clock.
    stop() {
        this.running = false
    }
}
