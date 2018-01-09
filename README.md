# virtual-clock
*A small, high-resolution, high-performance virtual clock library.*

[![npm](https://img.shields.io/npm/v/virtual-clock.svg)](https://www.npmjs.com/package/virtual-clock)
[![license](https://img.shields.io/npm/l/virtual-clock.svg)](https://github.com/DvdGiessen/virtual-clock/blob/master/LICENSE)
[![dependencies](https://img.shields.io/david/DvdGiessen/virtual-clock.svg)](https://david-dm.org/DvdGiessen/virtual-clock)
[![coverage](https://img.shields.io/codecov/c/github/DvdGiessen/virtual-clock/master.svg)](https://codecov.io/gh/DvdGiessen/virtual-clock)
[![code quality](https://img.shields.io/codacy/grade/bae573f4dab14b01af199ad21c810318/master.svg)](https://www.codacy.com/app/github_94/virtual-clock)
[![build status](https://img.shields.io/travis/DvdGiessen/virtual-clock/master.svg)](https://travis-ci.org/DvdGiessen/virtual-clock)

## Overview
This small library provides virtual clocks which can be used for tracking the
passage of time. It was designed with simulations, games and media applications
in mind, but might prove useful for many other purposes as well.

Virtual clocks can be started and stopped, the rate at which time flows can be
altered and even be made negative, causing time to flow backwards. Time can be
limited by a minimum and maximum value, and when both a minimum and maximum are
defined time may be set to loop around. Time listeners may be attached which
will fire when a given (absolute) time on the clock is passed, without having
to worry about adjusting timeouts for pauses, rate changes or other conditions.

`virtual-clock` uses high resolution time data for its virtualized clocks,
independent of system clock drift (for example when being skewed by software
like NTP). No timers are used for calculating the virtual clock time, instead
some clever math is used to calculate time whenever it is requested.

The library has extensive test coverage for all functionality and edge cases,
provides type annotations for both TypeScript and Flow users, and is fully
compatible with both browser and Node.js environments.


## Usage example
```js
import VirtualClock from 'virtual-clock';
// or
const VirtualClock = require('virtual-clock').default;

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
    console.log('The clocks have started!');
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

## License
`virtual-clock` is freely distributable under the terms of the
[MIT license](https://github.com/DvdGiessen/virtual-clock/blob/master/LICENSE).
