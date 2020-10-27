export default VirtualClock;

/**
 * A configurable virtual clock for tracking time.
 *
 * @author Daniël van de Giessen
 * @see https://dvdgiessen.github.io/virtual-clock/
 */
export declare class VirtualClock {
    /**
     * Starts running the clock. Does nothing when clock was already running.
     */
    start(): VirtualClock;

    /**
     * Stops running the clock. Does nothing when clock was not running.
     */
    stop(): VirtualClock;

    /**
     * Attaches an event listener.
     *
     * Supported events: start, stop, settime, setrunning, setrate, setminimum, setmaximum, setloop
     */
    on(event: string, callback: () => void): VirtualClock;

    /**
     * Detaches a previously attached event listener.
     */
    off(event: string, callback: () => void): VirtualClock;

    /**
     * Triggers an attached event listener.
     */
    trigger(event: string, ...args: any[]): VirtualClock;

    /**
     * Attaches a time listener which fires once after the specified clock time has passed.
     */
    onceAt(time: number, callback: () => void): VirtualClock;

    /**
     * Attaches a time listener which fires every time the specified clock time has passed.
     */
    alwaysAt(time: number, callback: () => void): VirtualClock;

    /**
     * Detaches a previously attached time listener. If multiple listeners match, all are removed.
     */
    removeAt(time: number, callback: () => void): VirtualClock;

    /**
     * The current clock time.
     */
    time: number;

    /**
     * Whether the clock is currently running.
     */
    running: boolean;

    /**
     * The current rate (relative to real time) the clock runs at.
     */
    rate: number;

    /**
     * The minimum limit for time on the clock.
     */
    minimum: number;

    /**
     * The maximum limit for time on the clock.
     */
    maximum: number;

    /**
     * Whether the clock will loop around after reaching the maximum.
     */
    loop: boolean;
}
