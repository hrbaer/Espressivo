/*
 * C L O C K
 */

export default class Clock {
    constructor(clock) {
        this.clock = clock
        this.running = false
    }

    run() {
        const now = performance.now()
        const deltaTime = now - this.startTime
        this.startTime = now
        this.clock(deltaTime)
        if (this.running) {
            setTimeout(this.run.bind(this), 5)
        }
    }

    start() {
        this.running = true
        this.counter = 0
        this.startTime = performance.now()
        this.run()
    }

    stop() {
        this.running = false
    }
}
