// @flow

/**
 * A configurable virtual clock for tracking time.
 *
 * @author Daniël van de Giessen
 * @see https://virtual-clock.js.org/
 */
export default class VirtualClock {
    declare _now: () => number;
    declare _previousTime: number;
    declare _previousNow: number;
    declare _rate: number;
    declare _running: boolean;
    declare _minimum: number;
    declare _maximum: number;
    declare _loop: boolean;
    declare _eventListeners: Map<string, (() => mixed)[]>;
    declare _timeListeners: Map<[number, () => mixed], [TimeoutID, number, boolean]>;
    declare _nullTimeoutID: TimeoutID;

    /**
     * Constructs a stopped clock with default settings.
     */
    constructor(): void {
        // Determine method for retrieving now
        this._now =
            (typeof performance !== 'undefined' && /*global performance */ performance.now.bind(performance)) ||
            (typeof process !== 'undefined' && /*global process */ process.hrtime && ((): number => {
                const now: [number, number] = process.hrtime();
                return now[0] * 1e3 + now[1] / 1e6;
            })) ||
            Date.now;

        // Current state
        this._previousTime = 0;
        this._previousNow = this._now();

        // Flow of time configuration
        this._rate = 1.0;
        this._running = false;

        // Minimum / maximum / looping configuration
        this._minimum = -Infinity;
        this._maximum = Infinity;
        this._loop = false;

        // Event and time listeners
        this._eventListeners = new Map();
        this._timeListeners = new Map();

        // Create unique TimeoutID to track non-scheduled timers
        this._nullTimeoutID = setTimeout(() => {}, 0);

        // Make private properties non-enumerable
        for (const prop in this) {
            if (prop.startsWith('_')) {
                Object.defineProperty(this, prop, { enumerable: false });
            }
        }

        // Bind methods to this object
        for (const prop of Object.getOwnPropertyNames(VirtualClock.prototype)) {
            const descriptor = Object.getOwnPropertyDescriptor(VirtualClock.prototype, prop);
            if (descriptor && 'value' in descriptor && typeof descriptor.value === 'function') {
                Object.defineProperty(this, prop, { value: descriptor.value.bind(this) });
            }
        }
    }

    // Methods
    /**
     * Starts running the clock. Does nothing when clock was already running.
     */
    start(): VirtualClock {
        // Start running the time if we werent running
        if (!this._running) {
            this._previousNow = this._now();
            this._running = true;
            this._recalculateTimeListeners();

            // Trigger event listeners
            this.trigger('start');
            this.trigger('setrunning');
        }

        // Method chaining
        return this;
    }

    /**
     * Stops running the clock. Does nothing when clock was not running.
     */
    stop(): VirtualClock {
        // Stops running the time if we were running
        if (this._running) {
            this._previousTime = this.time;
            this._running = false;
            this._recalculateTimeListeners();

            // Trigger event listeners
            this.trigger('stop');
            this.trigger('setrunning');
        }

        // Method chaining
        return this;
    }

    /**
     * Attaches an event listener.
     *
     * Supported events: start, stop, settime, setrunning, setrate, setminimum, setmaximum, setloop
     */
    on(event: string, callback: () => mixed): VirtualClock {
        // Add the listener
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            listeners.push(callback);
        } else {
            this._eventListeners.set(event, [callback]);
        }

        // Method chaining
        return this;
    }

    /**
     * Detaches a previously attached event listener.
     */
    off(event: string, callback: () => mixed): VirtualClock {
        // Find the listener
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            const i = listeners.indexOf(callback);
            if (i >= 0) {
                // Remove the listener
                listeners.splice(i, 1);

                // Method chaining
                return this;
            }
        }

        // When not found, throw an error
        throw new Error('Event listener not found');
    }

    /**
     * Triggers an attached event listener.
     */
    trigger(event: string, ...args: mixed[]): VirtualClock {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            listeners.slice(0).forEach(listener => {
                listener.apply(this, args);
            });
        }

        // Method chaining
        return this;
    }

    /**
     * Private method for recalculating all registered time listeners.
     */
    _recalculateTimeListeners(): void {
        for (const listener of this._timeListeners.keys()) {
            this._recalculateTimeListener(listener);
        }
    }

    /**
     * Private method for recalculating a specific registered time listener.
     */
    _recalculateTimeListener(listener: [number, () => mixed]): void {
        // Check if the listener is still registered
        const listenerData = this._timeListeners.get(listener);
        if (listenerData) {
            const [time, callback] = listener;
            const [timeoutID, lastCalled, once] = listenerData;

            // Clear any open timeouts
            clearTimeout(timeoutID);

            // Only add timeouts if we're running and the time is reachable
            if (this._running && this._rate !== 0 && time >= this._minimum && time <= this._maximum) {
                // Get current time
                const currentTime = this.time;

                // Did we already run at this time?
                if (currentTime === lastCalled) {
                    // Is is possible to wait?
                    if (this._loop || (currentTime !== this._minimum && currentTime !== this._maximum)) {
                        // Wait until the time has changed enough to prevent racing and then retry
                        this._timeListeners.set(listener, [setTimeout(() => {
                            this._recalculateTimeListener(listener);
                        }, 1), lastCalled, once]);
                    }
                } else {
                    // Clock time until the listener should be triggered
                    let until;

                    // Initial calculation depends on which way time is moving
                    if (this._rate > 0) {
                        until = time - currentTime;
                    } else {
                        until = currentTime - time;
                    }

                    // If the time is going to be reached
                    if (until >= 0 || (this._loop && this._minimum > -Infinity && this._maximum < Infinity)) {
                        // Add time when looping
                        if (until < 0) {
                            until += this._maximum - this._minimum;
                        }

                        // Factor in the rate
                        until *= 1 / Math.abs(this._rate);

                        // Ceil the value, otherwise setTimeout may floor it and run before it is supposed to
                        until = Math.ceil(until);

                        // Workaround: many common JavaScript engines internally use a 32-bit signed integer
                        // to save the `delay` parameter of `setTimeout`. Integer overflows may cause the
                        // callback to be executed prematurely, thus we work around this by instead scheduling
                        // a recalculation before this overflow value is reached.
                        let newTimeoutID;
                        if (until > 0x7fffffff) {
                            const untilRecalculate = Math.min(Math.ceil(until / 2), 0x7fffffff);
                            newTimeoutID = setTimeout(
                                () => this._recalculateTimeListener(listener),
                                untilRecalculate
                            );
                        } else {
                            newTimeoutID = setTimeout(() => {
                                // Should we self-destruct
                                if (once) {
                                    this._timeListeners.delete(listener);
                                } else {
                                    // Save time of call
                                    this._timeListeners.set(listener, [this._nullTimeoutID, this.time, once]);
                                }

                                // Call the callback
                                callback.call(this);

                                // Recalculate the time listener
                                if (!once) {
                                    this._recalculateTimeListener(listener);
                                }
                            }, until);
                        }

                        // Save recalculated time listener details
                        this._timeListeners.set(listener, [newTimeoutID, NaN, once]);
                    }
                }
            }
        }
    }

    /**
     * Attaches a time listener which fires once after the specified clock time has passed.
     */
    onceAt(time: number, callback: () => mixed): VirtualClock {
        // Do not allow setting an invalid value
        if (isNaN(time) || time === -Infinity || time === Infinity) {
            throw new Error('Can only set time to a finite number');
        }

        const listener = [time, callback];
        this._timeListeners.set(listener, [this._nullTimeoutID, NaN, true]);
        this._recalculateTimeListener(listener);

        // Method chaining
        return this;
    }

    /**
     * Attaches a time listener which fires every time the specified clock time has passed.
     */
    alwaysAt(time: number, callback: () => mixed): VirtualClock {
        // Do not allow setting an invalid value
        if (isNaN(time) || time === -Infinity || time === Infinity) {
            throw new Error('Can only set time to a finite number');
        }

        const listener = [time, callback];
        this._timeListeners.set(listener, [this._nullTimeoutID, NaN, false]);
        this._recalculateTimeListener(listener);

        // Method chaining
        return this;
    }

    /**
     * Detaches a previously attached time listener. If multiple listeners match, all are removed.
     */
    removeAt(time: number, callback: () => mixed): VirtualClock {
        // Track whether we removed anything
        let hasRemoved = false;

        // Loop over all listeners
        for (const listener of this._timeListeners.keys()) {
            const [listenerTime, listenerCallback] = listener;
            if (listenerTime === time && listenerCallback === callback) {
                // Cancel the timeout
                const listenerData = this._timeListeners.get(listener);
                if (listenerData) {
                    clearTimeout(listenerData[0]);
                }

                // Remove the listener
                this._timeListeners.delete(listener);

                // We have removed at least one listener
                hasRemoved = true;
            }
        }

        if (!hasRemoved) {
            // When not found, throw an error
            throw new Error('Time listener not found');
        }

        // Method chaining
        return this;
    }

    // Getters
    /**
     * The current clock time.
     */
    get time(): number {
        let currentTime = this._previousTime;

        // If running, the time is has changed since the previous time so we recalculate it
        if (this._running) {
            // Calculate current time based on passed time
            currentTime += this._rate * (this._now() - this._previousNow);
        }

        // Can we loop (loop enabled + a non-zero non-finite maximum)
        if (this._loop && (this._minimum > -Infinity && this._maximum < Infinity)) {
            // Calculate using modulo, adjusting for the minimum
            currentTime = ((currentTime - this._minimum) % (this._maximum - this._minimum) + (this._maximum - this._minimum)) % (this._maximum - this._minimum) + this._minimum;
        } else {
            // No looping means we just limit our output between minimum and maximum
            currentTime = Math.min(Math.max(this._minimum, currentTime), this._maximum);
        }

        return currentTime;
    }

    /**
     * Whether the clock is currently running.
     */
    get running(): boolean {
        return this._running;
    }

    /**
     * The current rate (relative to real time) the clock runs at.
     */
    get rate(): number {
        return this._rate;
    }

    /**
     * The minimum limit for time on the clock.
     */
    get minimum(): number {
        return this._minimum;
    }

    /**
     * The maximum limit for time on the clock.
     */
    get maximum(): number {
        return this._maximum;
    }

    /**
     * Whether the clock will loop around after reaching the maximum.
     */
    get loop(): boolean {
        return this._loop;
    }

    // Setters
    /**
     * Sets the current clock time.
     */
    set time(time: number): void {
        // Do not allow setting an invalid value
        if (isNaN(time) || time === -Infinity || time === Infinity) {
            throw new Error('Can only set time to a finite number');
        }

        // Only act if the time is different
        // Note: If time is changing, it is always assumed to be different
        const currentTime = this.time;
        if (
            !(
                !this._running ||
                this._rate === 0.0 ||
                !this._loop && (
                    this._rate < 0 && currentTime === this._minimum ||
                    this._rate > 0 && currentTime === this._maximum
                )
            ) || time !== currentTime
        ) {
            // Recalibrate by setting both correct time and now
            this._previousTime = Math.min(Math.max(this._minimum, time), this._maximum);
            this._previousNow = this._now();

            // Recalculate time listeners
            this._recalculateTimeListeners();

            // Trigger event listeners
            this.trigger('settime');
        }
    }

    /**
     * Starts or stops running the clock.
     */
    set running(running: boolean): void {
        // Changing running state just calls start() or stop()
        if (running) {
            this.start();
        } else {
            this.stop();
        }
    }

    /**
     * Sets the rate (relative to real time) at which the clock runs.
     */
    set rate(rate: number): void {
        // Do not allow setting an invalid value
        if (isNaN(rate) || rate === -Infinity || rate === Infinity) {
            throw new Error('Can only set rate to a finite number');
        }

        // Only act if the rate is different
        if (rate !== this._rate) {
            // Recalibration is only needed when we're running
            if (this._running) {
                this._previousTime = this.time;
                this._previousNow = this._now();
            }

            // Set rate
            this._rate = rate;

            // Recalculate time listeners
            this._recalculateTimeListeners();

            // Trigger event listeners
            this.trigger('setrate');
        }
    }

    /**
     * Sets minimum limit for time on the clock.
     */
    set minimum(minimum: number): void {
        // Do not allow setting an invalid value
        if (minimum > this._maximum || isNaN(minimum) || minimum === Infinity) {
            throw new Error('Cannot set minimum above maximum');
        }

        // Only act if the minimum is different
        if (minimum !== this._minimum) {
            // First get the calculated time, calculated using the old minimum
            const previousTime = this.time;

            // Change the minimum
            this._minimum = minimum;

            // Recalibrate the time using the previous value and the new minimum
            this._previousTime = Math.min(Math.max(this._minimum, previousTime), this._maximum);
            this._previousNow = this._now();

            // Recalculate time listeners
            this._recalculateTimeListeners();

            // Trigger event listeners
            this.trigger('setminimum');
        }
    }

    /**
     * Sets maximum limit for time on the clock.
     */
    set maximum(maximum: number): void {
        // Do not allow setting an invalid value
        if (maximum < this._minimum || isNaN(maximum) || maximum === -Infinity) {
            throw new Error('Cannot set maximum below minimum');
        }

        // Only act if the maximum is different
        if (maximum !== this._maximum) {
            // First get the calculated time, calculated using the old maximum
            const previousTime = this.time;

            // Change the maximum
            this._maximum = maximum;

            // Recalibrate the time using the previous value and the new maximum
            this._previousTime = Math.min(Math.max(this._minimum, previousTime), this._maximum);
            this._previousNow = this._now();

            // Recalculate time listeners
            this._recalculateTimeListeners();

            // Trigger event listeners
            this.trigger('setmaximum');
        }
    }

    /**
     * Sets whether the clock loops around after reaching the maximum.
     */
    set loop(loop: boolean): void {
        // Only act if looping is different
        if (loop !== this._loop) {
            // Recalibrate
            this._previousTime = this.time;
            this._previousNow = this._now();

            // Set looping
            this._loop = loop;

            // Recalculate time listeners
            this._recalculateTimeListeners();

            // Trigger event listeners
            this.trigger('setloop');
        }
    }
}
