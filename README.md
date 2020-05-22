# virtual-clock

*A tiny library for configurable virtual clocks*

[![npm](https://badgen.net/npm/v/virtual-clock)](https://www.npmjs.com/package/virtual-clock)
[![license](https://badgen.net/github/license/dvdgiessen/virtual-clock)](https://github.com/DvdGiessen/virtual-clock/blob/master/LICENSE)
[![dependencies](https://badgen.net/david/dep/dvdgiessen/virtual-clock)](https://david-dm.org/DvdGiessen/virtual-clock)
[![coverage](https://badgen.net/codecov/c/github/dvdgiessen/virtual-clock)](https://codecov.io/gh/DvdGiessen/virtual-clock)
[![code quality](https://badgen.net/codacy/grade/bae573f4dab14b01af199ad21c810318)](https://www.codacy.com/app/github_94/virtual-clock)
[![build status](https://travis-ci.org/DvdGiessen/virtual-clock.svg?branch=master)](https://travis-ci.org/DvdGiessen/virtual-clock)

## Overview

`virtual-clock` is a tiny library for tracking time, for example in games,
simulations, visualizations, media applications, or even just a stopwatch app.

Virtual clocks can be paused and resumed, be sped up, down, or even made to go
backwards, can be limited to not go beyond a certain minimum or maximum value,
or to loop around whenever the set minimum or maximum value is reached.

Clocks can register callbacks which should fire at specific clock times, either
once or every time the clock reaches the specified time. Event listeners can
also be attached for specific changes in state, for example to be notified when
the clock is started or stopped.

A VirtualClock's time is calculated using high resolution time data, meaning
clock time is not affected by imprecision in JavaScript's timers, system clock
drift or skewing by software like NTP. This makes it ideal for use in for
example graphics render loops where the timing should not be bound to the speed
at which the software runs.

The library has extensive test coverage for all functionality and edge cases,
provides type annotations for both TypeScript and Flow users, and is fully
compatible with both browser and Node.js environments.

## Usage example

Try it live: https://virtual-clock.js.org/

```js
import VirtualClock from 'virtual-clock';
// or
const VirtualClock = require('virtual-clock');

// Create a new clock
let clock = new VirtualClock;

// At instanciation, the clock is stopped at time 0.
console.log('Initial clock time: ' + clock.time);

// The `time` property may be queried at any time, for example in a render loop
let outputElement = document.getElementById('output');
(function loop() {
    outputElement.textContent = (clock.time / 1000).toFixed(5);
    window.requestAnimationFrame(loop);
})();

// Start the clock by calling .start()
clock.start();

// Or toggling the `running` property
clock.running = true;

// Speed up the the flow of time
clock.rate = 2.0;

// Or wind back the clock
clock.rate = -1.0;

// By default, time is limited between -Infinity and Infinity
console.log('Default bounds: ' + clock.minimum + ' - ' + clock.maximum);

// But for various cases it might be useful to set a finite bound
clock.minimum = 0;
clock.maximum = 10 * 1000;

// When both minimum and maximum are set to non-infinites, we may loop time
clock.loop = true;

// Event listeners may be attached to notice changes
clock.on('start', () => {
    console.log('The clock has been started!');
});
clock.on('setrate', () => {
    console.log('The flow rate of time was set!');
});

// Time listeners can be attached to specific clock times
clock.onceAt(9 * 1000, () => {
    console.log('I\'ll fire once at 9, and then never again!');
});
clock.alwaysAt(5 * 1000, () => {
    console.log('I\'ll fire every time the clock is at 5!');
});

// We can keep adjusting properties; time listeners will fire as expected
clock.minimum += 1000;
clock.rate *= 2;
```

## API

```js
class VirtualClock {
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
     * Supported events:
     * start, stop, settime, setrunning, setrate, setminimum, setmaximum, setloop
     */
    on(event: string, callback: () => mixed): VirtualClock;

    /**
     * Detaches a previously attached event listener.
     */
    off(event: string, callback: () => mixed): VirtualClock;

    /**
     * Triggers an attached event listener.
     */
    trigger(event: string, ...args: mixed[]): VirtualClock;

    /**
     * Attaches a time listener which fires once after the specified clock time has passed.
     */
    onceAt(time: number, callback: () => mixed): VirtualClock;

    /**
     * Attaches a time listener which fires every time the specified clock time has passed.
     */
    alwaysAt(time: number, callback: () => mixed): VirtualClock;

    /**
     * Detaches a previously attached time listener.
     * If multiple listeners match, all are removed.
     */
    removeAt(time: number, callback: () => mixed): VirtualClock;

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
```

Note that all methods return the called object to allow for method chaining.

## Issues and contributing

If you have any issues with `virtual-clock`, first check the [issue tracker](
https://github.com/DvdGiessen/virtual-clock/issues) to see whether it was
already reported by someone else. If not, go ahead and [create a new issue](
https://github.com/DvdGiessen/virtual-clock/issues/new). Try to include as much
information (version of the library, example code to reproduce) as possible.

If you want to contribute, feel free to open a pull request on [GitHub](
https://github.com/DvdGiessen/virtual-clock)!

## License

`virtual-clock` is freely distributable under the terms of the
[MIT license](https://github.com/DvdGiessen/virtual-clock/blob/master/LICENSE).
