# virtual-clock
*A high-resolution, virtual clock with timer support*

[![Travis CI](https://travis-ci.org/DvdGiessen/virtual-clock.svg?branch=master)](https://travis-ci.org/DvdGiessen/virtual-clock)
[![Codecov](https://codecov.io/gh/DvdGiessen/virtual-clock/branch/master/graph/badge.svg)](https://codecov.io/gh/DvdGiessen/virtual-clock)
[![Codacy](https://api.codacy.com/project/badge/Grade/bae573f4dab14b01af199ad21c810318)](https://www.codacy.com/app/github_94/virtual-clock)
[![dependencies](https://david-dm.org/DvdGiessen/virtual-clock/status.svg)](https://david-dm.org/DvdGiessen/virtual-clock)
[![devDependencies](https://david-dm.org/DvdGiessen/virtual-clock/dev-status.svg)](https://david-dm.org/DvdGiessen/virtual-clock?type=dev)

## Overview
This project provides a small library for working with virtual clocks which can
be used for tracking the passage of virtualized time. Clocks can be started and
stopped, the rate at which time flows can be altered and even be made negative,
causing time to flow backwards. Time can be limited by a minimum and maximum 
value, and when both a minimum and maximum are defined time may be set to loop
around. Time listeners may be attached which will fire when a given (absolute)
time on the clock is passed.

## Usage example
```js
import VirtualClock from 'virtual-clock';

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

```