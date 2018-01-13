import VirtualClock from '../src/virtual-clock';

const assert = require('chai').assert;
const lolex = require('lolex');
const sinon = require('sinon');

suite('VirtualClock', () => {
    let fakeTime;
    suiteSetup(() => {
        fakeTime = lolex.install();
    });

    let clock;
    setup(() => {
        clock = new VirtualClock();
    });

    suite('.time', () => {
        test('At creation time is 0', () => {
            assert.equal(clock.time, 0);
        });
        test('Setting time changes time', () => {
            assert.equal(clock.time, 0);
            clock.time = 100;
            assert.equal(clock.time, 100);
            clock.time = 150;
            assert.equal(clock.time, 150);
            clock.time = 25;
            assert.equal(clock.time, 25);
            clock.time = -25;
            assert.equal(clock.time, -25);
            clock.time = -100;
            assert.equal(clock.time, -100);
        });
        test('Cannot set an invalid time', () => {
            assert.throws(() => { clock.time = NaN; });
            assert.throws(() => { clock.time = -Infinity; });
            assert.throws(() => { clock.time = Infinity; });
        });
    });

    suite('.running', () => {
        test('At creation clock is not running', () => {
            assert.equal(clock.running, false);
        });
        test('When not running time should not change', () => {
            assert.equal(clock.running, false);
            const firstTime = clock.time;
            fakeTime.tick(100);
            const secondTime = clock.time;
            assert.equal(firstTime, secondTime);
            fakeTime.tick(150);
            const thirdTime = clock.time;
            assert.equal(secondTime, thirdTime);
        });
        test('When running time increases', () => {
            assert.equal(clock.running, false);
            const firstTime = clock.time;
            clock.running = true;
            assert.equal(clock.running, true);
            fakeTime.tick(100);
            const secondTime = clock.time;
            assert(secondTime > firstTime);
            fakeTime.tick(150);
            const thirdTime = clock.time;
            assert(thirdTime > secondTime);
        });
        test('After stopping to run time no longer changes', () => {
            assert.equal(clock.running, false);
            const firstTime = clock.time;
            clock.running = true;
            assert.equal(clock.running, true);
            fakeTime.tick(100);
            const secondTime = clock.time;
            assert(secondTime > firstTime);
            clock.running = false;
            assert.equal(clock.running, false);
            const thirdTime = clock.time;
            fakeTime.tick(150);
            const fourthTime = clock.time;
            assert.equal(thirdTime, fourthTime);
        });
    });

    suite('.start()', () => {
        test('Calling causes non-running clock to start running', () => {
            assert.equal(clock.running, false);
            const firstTime = clock.time;
            clock.start();
            assert.equal(clock.running, true);
            fakeTime.tick(100);
            const secondTime = clock.time;
            assert(secondTime > firstTime);
        });
        test('Calling does not affect running clock', () => {
            assert.equal(clock.running, false);
            const firstTime = clock.time;
            clock.start();
            assert.equal(clock.running, true);
            fakeTime.tick(100);
            const secondTime = clock.time;
            assert(secondTime > firstTime);
            clock.start();
            assert.equal(clock.running, true);
            fakeTime.tick(150);
            const thirdTime = clock.time;
            assert(thirdTime > secondTime);
        });
    });

    suite('.stop()', () => {
        test('Calling causes running clock to stop running', () => {
            clock.running = true;
            assert.equal(clock.running, true);
            const firstTime = clock.time;
            fakeTime.tick(100);
            const secondTime = clock.time;
            assert(secondTime > firstTime);
            clock.stop();
            assert.equal(clock.running, false);
            const thirdTime = clock.time;
            fakeTime.tick(150);
            const fourthTime = clock.time;
            assert.equal(thirdTime, fourthTime);
        });
        test('Calling does not affect non-running clock', () => {
            clock.running = true;
            assert.equal(clock.running, true);
            const firstTime = clock.time;
            fakeTime.tick(100);
            const secondTime = clock.time;
            assert(secondTime > firstTime);
            clock.stop();
            assert.equal(clock.running, false);
            const thirdTime = clock.time;
            fakeTime.tick(150);
            const fourthTime = clock.time;
            assert.equal(thirdTime, fourthTime);
            const fifthTime = clock.time;
            fakeTime.tick(200);
            const sixthTime = clock.time;
            assert.equal(fifthTime, sixthTime);
        });
    });

    suite('.rate', () => {
        test('At creation rate is 1.0', () => {
            assert.equal(clock.rate, 1.0);
        });
        test('Time flows normally at 1.0 rate', () => {
            assert.equal(clock.rate, 1.0);
            assert.equal(clock.time, 0);
            clock.start();
            fakeTime.tick(100);
            assert.equal(clock.time, 100);
            fakeTime.tick(150);
            assert.equal(clock.time, 250);
        });
        test('Positive rate correctly corresponds to time flow', () => {
            clock.start();
            for(const rate of [0.1, 0.2, 0.5, 0.9, 1.0, 1.1, 1.5, 2.0, 5.0]) {
                clock.rate = rate;
                assert.equal(clock.rate, rate);
                const firstTime = clock.time;
                fakeTime.tick(100);
                const secondTime = clock.time;
                assert.closeTo(secondTime - firstTime, 100 * rate, 0.0000001);
                fakeTime.tick(150);
                const thirdTime = clock.time;
                assert.closeTo(thirdTime - secondTime, 150 * rate, 0.0000001);
            }
        });
        test('Time does not change at rate 0.0', () => {
            clock.start();
            clock.rate = 0.0;
            assert.equal(clock.rate, 0.0);
            const firstTime = clock.time;
            fakeTime.tick(100);
            const secondTime = clock.time;
            assert.equal(firstTime, secondTime);
            fakeTime.tick(100);
            const thirdTime = clock.time;
            assert.equal(secondTime, thirdTime);
        });
        test('Negative rate correctly corresponds to time flow', () => {
            clock.time = 5000;
            clock.start();
            for(const rate of [-0.1, -0.2, -0.5, -0.9, -1.0, -1.1, -1.5, -2.0, -5.0]) {
                clock.rate = rate;
                assert.equal(clock.rate, rate);
                const firstTime = clock.time;
                fakeTime.tick(100);
                const secondTime = clock.time;
                assert.closeTo(secondTime - firstTime, 100 * rate, 0.0000001);
                fakeTime.tick(150);
                const thirdTime = clock.time;
                assert.closeTo(thirdTime - secondTime, 150 * rate, 0.0000001);
            }
        });
        test('Cannot set an invalid rate', () => {
            assert.throws(() => { clock.rate = NaN; });
            assert.throws(() => { clock.rate = -Infinity; });
            assert.throws(() => { clock.rate = Infinity; });
        });
    });

    suite('.minimum', () => {
        test('At instanciation minimum is -Infinity', () => {
            assert.equal(clock.minimum, -Infinity);
        });
        test('Setting minimum sets it', () => {
            clock.minimum = 10;
            assert.equal(clock.minimum, 10);
            clock.minimum = 500;
            assert.equal(clock.minimum, 500);
            clock.minimum = -250;
            assert.equal(clock.minimum, -250);
            clock.minimum = -Infinity;
            assert.equal(clock.minimum, -Infinity);
        });
        test('Setting time is limited by minimum', () => {
            clock.minimum = -100;
            clock.time = -200;
            assert.equal(clock.time, -100);
            clock.time = -100;
            assert.equal(clock.time, -100);
        });
        test('Setting minimum when time is before minimum resets time to minimum', () => {
            clock.time = 100;
            clock.minimum = 200;
            assert.equal(clock.time, 200);
        });
        test('Clock does not run past minimum', () => {
            clock.minimum = -100;
            clock.rate = -1.0;
            clock.start();
            fakeTime.tick(50);
            assert.equal(clock.time, -50);
            fakeTime.tick(150);
            assert.equal(clock.time, -100);
        });
        test('Cannot set an invalid minimum', () => {
            assert.throws(() => { clock.minimum = NaN; });
            assert.throws(() => { clock.minimum = Infinity; });
            clock.maximum = 100;
            assert.throws(() => { clock.minimum = 200; });
        });
    });

    suite('.maximum', () => {
        test('At instanciation maximum is Infinity', () => {
            assert.equal(clock.maximum, Infinity);
        });
        test('Setting maximum sets it', () => {
            clock.maximum = 10;
            assert.equal(clock.maximum, 10);
            clock.maximum = 500;
            assert.equal(clock.maximum, 500);
            clock.maximum = -250;
            assert.equal(clock.maximum, -250);
            clock.maximum = Infinity;
            assert.equal(clock.maximum, Infinity);
        });
        test('Setting time is limited by maximum', () => {
            clock.maximum = 100;
            clock.time = 200;
            assert.equal(clock.time, 100);
            clock.time = 100;
            assert.equal(clock.time, 100);
        });
        test('Setting maximum when time is past maximum resets time to maximum', () => {
            clock.time = 200;
            clock.maximum = 100;
            assert.equal(clock.time, 100);
        });
        test('Clock does not run past maximum', () => {
            clock.maximum = 200;
            clock.start();
            fakeTime.tick(100);
            assert.equal(clock.time, 100);
            fakeTime.tick(150);
            assert.equal(clock.time, 200);
        });
        test('Cannot set an invalid maximum', () => {
            assert.throws(() => { clock.maximum = NaN; });
            assert.throws(() => { clock.maximum = -Infinity; });
            clock.minimum = -100;
            assert.throws(() => { clock.maximum = -200; });
        });
    });

    suite('.loop', () => {
        test('At instanciation looping is disabled', () => {
            assert.equal(clock.loop, false);
        });
        test('Forwards running clock jumps from maximum to minimum', () => {
            clock.loop = true;
            assert.equal(clock.loop, true);
            clock.minimum = -100;
            clock.maximum = 500;
            assert.equal(clock.time, 0);
            clock.start();
            fakeTime.tick(400);
            assert.equal(clock.time, 400);
            fakeTime.tick(400);
            assert.equal(clock.time, 200);
            fakeTime.tick(350);
            assert.equal(clock.time, -50);
            fakeTime.tick(625);
            assert.equal(clock.time, -25);
        });
        test('When looping, the maximum is never returned but the minimum is returned instead', () => {
            clock.minimum = -100;
            clock.maximum = 500;
            clock.loop = true;
            assert.equal(clock.time, 0);
            clock.start();
            fakeTime.tick(400);
            assert.equal(clock.time, 400);
            fakeTime.tick(100);
            assert.equal(clock.time, -100);
        });
        test('Looping continues from minimum when clock is at maximum when looping is enabled', () => {
            clock.minimum = -100;
            clock.maximum = 500;
            assert.equal(clock.time, 0);
            clock.start();
            fakeTime.tick(400);
            assert.equal(clock.time, 400);
            fakeTime.tick(300);
            assert.equal(clock.time, 500);
            clock.loop = true;
            fakeTime.tick(250);
            assert.equal(clock.time, 150);
        });
        test('Looping continues from minimum when clock was over maximum when maximum is set', () => {
            clock.minimum = -100;
            clock.loop = true;
            assert.equal(clock.time, 0);
            clock.start();
            fakeTime.tick(400);
            assert.equal(clock.time, 400);
            fakeTime.tick(300);
            assert.equal(clock.time, 700);
            clock.maximum = 500;
            assert.equal(clock.time, -100);
            fakeTime.tick(250);
            assert.equal(clock.time, 150);
        });
        test('Looping continues from maximum when clock was below minimum when minimum is set', () => {
            clock.maximum = 500;
            clock.rate = -1.0;
            clock.loop = true;
            assert.equal(clock.time, 0);
            clock.start();
            fakeTime.tick(400);
            assert.equal(clock.time, -400);
            fakeTime.tick(300);
            assert.equal(clock.time, -700);
            clock.minimum = -100;
            assert.equal(clock.time, -100);
            fakeTime.tick(200);
            assert.equal(clock.time, 300);
        });
        test('Backwards running clock jumps from minimum to maximum', () => {
            clock.minimum = -100;
            clock.maximum = 500;
            clock.time = 200;
            clock.rate = -1.0;
            clock.loop = true;
            clock.start();
            fakeTime.tick(300);
            assert.equal(clock.time, -100);
            fakeTime.tick(150);
            assert.equal(clock.time, 350);
            fakeTime.tick(925);
            assert.equal(clock.time, 25);
        });
        test('Clock does not loop without a minimum', () => {
            clock.maximum = 300;
            clock.time = 200;
            clock.loop = true;
            clock.start();
            fakeTime.tick(400);
            assert.equal(clock.time, 300);
        });
        test('Backwards running clock does not loop without a maximum', () => {
            clock.minimum = -100;
            clock.time = 200;
            clock.rate = -1.0;
            clock.loop = true;
            clock.start();
            fakeTime.tick(400);
            assert.equal(clock.time, -100);
        });
        test('Looping continues from maximum when backward running clock is at minimum when looping is enabled', () => {
            clock.time = 200;
            clock.minimum = -100;
            clock.maximum = 500;
            clock.rate = -1.0;
            clock.start();
            fakeTime.tick(400);
            assert.equal(clock.time, -100);
            clock.loop = true;
            fakeTime.tick(50);
            assert.equal(clock.time, 450);
        });
        test('Looping continues from maximum when backward running clock is at minimum when maximum is set', () => {
            clock.time = 200;
            clock.minimum = -100;
            clock.rate = -1.0;
            clock.loop = true;
            clock.start();
            fakeTime.tick(400);
            assert.equal(clock.time, -100);
            clock.maximum = 500;
            fakeTime.tick(50);
            assert.equal(clock.time, 450);
        });
    });

    suite('.on()', () => {
        test('Event listener for "start" fires when clock is started via .start()', () => {
            const callback = sinon.spy();
            clock.on('start', callback);
            assert(!callback.called);
            clock.start();
            assert(callback.calledOnce);
        });
        test('Event listener for "start" fires when setting running to true', () => {
            const callback = sinon.spy();
            clock.on('start', callback);
            assert(!callback.called);
            clock.running = true;
            assert(callback.calledOnce);
        });
        test('Event listener for "start" does not fire when clock is already running', () => {
            const callback = sinon.spy();
            clock.on('start', callback);
            clock.start();
            clock.start();
            clock.running = true;
            assert(callback.calledOnce);
        });
        test('Event listener for "stop" fires when clock is stopped via .stop()', () => {
            clock.start();
            const callback = sinon.spy();
            clock.on('stop', callback);
            assert(!callback.called);
            clock.stop();
            assert(callback.calledOnce);
        });
        test('Event listener for "stop" fires when setting running to false', () => {
            clock.start();
            const callback = sinon.spy();
            clock.on('stop', callback);
            assert(!callback.called);
            clock.running = false;
            assert(callback.calledOnce);
        });
        test('Event listener for "stop" does not fire when clock is not running', () => {
            clock.start();
            const callback = sinon.spy();
            clock.on('stop', callback);
            clock.stop();
            clock.stop();
            clock.running = false;
            assert(callback.calledOnce);
        });
        test('Event listener for "settime" fires when time is set', () => {
            const callback = sinon.spy();
            clock.on('settime', callback);
            assert(!callback.called);
            clock.time = 500;
            assert(callback.calledOnce);
            clock.time = 750;
            assert(callback.calledTwice);
            clock.time = -500;
            assert(callback.calledThrice);
        });
        test('Event listener for multiple events gets fired for all of them', () => {
            const callback = sinon.spy();
            clock.on('start', callback);
            clock.on('settime', callback);
            clock.on('stop', callback);
            assert(!callback.called);
            clock.start();
            assert(callback.calledOnce);
            clock.time = 500;
            assert(callback.calledTwice);
            clock.stop();
            assert(callback.calledThrice);
        });
        test('Multiple event listener for a single event all get fired', () => {
            const callbackOne = sinon.spy();
            const callbackTwo = sinon.spy();
            const callbackThree = sinon.spy();
            clock.on('settime', callbackOne);
            clock.on('settime', callbackTwo);
            clock.on('settime', callbackThree);
            assert(!callbackOne.called);
            assert(!callbackTwo.called);
            assert(!callbackThree.called);
            clock.time = 500;
            assert(callbackOne.calledOnce);
            assert(callbackTwo.calledOnce);
            assert(callbackThree.calledOnce);
        });
        test('Event listener for "setrunning" fires when running is set to different value', () => {
            const callback = sinon.spy();
            clock.on('setrunning', callback);
            assert(!callback.called);
            clock.running = true;
            assert(callback.calledOnce);
            clock.running = false;
            assert(callback.calledTwice);
            clock.running = false;
            assert(callback.calledTwice);
            clock.running = true;
            assert(callback.calledThrice);
            clock.running = true;
            assert(callback.calledThrice);
        });
        test('Event listener for "setrate" fires when rate is set to different value', () => {
            const callback = sinon.spy();
            clock.on('setrate', callback);
            assert(!callback.called);
            clock.rate = 5.0;
            assert(callback.calledOnce);
            clock.rate = 0.0;
            assert(callback.calledTwice);
            clock.rate = 0.0;
            assert(callback.calledTwice);
            clock.rate = -1.0;
            assert(callback.calledThrice);
            clock.rate = -1.0;
            assert(callback.calledThrice);
        });
        test('Event listener for "setmaximum" fires when maximum is set to different value', () => {
            const callback = sinon.spy();
            clock.on('setmaximum', callback);
            assert(!callback.called);
            clock.maximum = 500;
            assert(callback.calledOnce);
            clock.time = 800;
            clock.maximum = 600;
            assert(callback.calledTwice);
            clock.maximum = 600;
            assert(callback.calledTwice);
            clock.maximum = -50;
            assert(callback.calledThrice);
            clock.maximum = -50;
            assert(callback.calledThrice);
        });
        test('Event listener for "setloop" fires when loop is set to different value', () => {
            const callback = sinon.spy();
            clock.on('setloop', callback);
            assert(!callback.called);
            clock.loop = true;
            assert(callback.calledOnce);
            clock.loop = false;
            assert(callback.calledTwice);
            clock.loop = false;
            assert(callback.calledTwice);
            clock.loop = true;
            assert(callback.calledThrice);
            clock.loop = true;
            assert(callback.calledThrice);
        });
    });

    suite('.off()', () => {
        test('Detaching event listener causes it to no longer fire', () => {
            const callback = sinon.spy();
            clock.on('settime', callback);
            assert(!callback.called);
            clock.time = 500;
            assert(callback.calledOnce);
            clock.off('settime', callback);
            clock.time = 800;
            assert(callback.calledOnce);
        });
        test('Detaching non-existing event listener throws an error', () => {
            const callback = sinon.spy();
            assert.throws(() => { clock.off('settime', callback); });
            assert(!callback.called);
        });
    });

    suite('.onceAt()', () => {
        test('Attaching single-fire time listener causes it to fire after the specified time', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.start();
            fakeTime.tick(499);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Single-fire time listener can only be bound to a finite time', () => {
            const callback = sinon.spy();
            assert.throws(() => {
                return clock.onceAt(Infinity, callback);
            });
            assert.throws(() => {
                return clock.onceAt(-Infinity, callback);
            });
        });
        test('Single-fire time listener correctly interacts with setting time', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.start();
            fakeTime.tick(200);
            clock.time = 400;
            fakeTime.tick(99);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Setting time to time of single-fire time listener causes it to fire if the clock is running', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.start();
            assert(!callback.called);
            clock.time = 500;
            fakeTime.tick(0); // Required to make lolex fire timeouts
            assert(callback.calledOnce);
        });
        test('Setting time to time of single-fire time listener for a non-running clock fires it at clock start', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            assert(!callback.called);
            clock.time = 500;
            fakeTime.tick(0);
            assert(!callback.called);
            clock.start();
            fakeTime.tick(0); // Required to make lolex fire timeouts
            assert(callback.calledOnce);
        });
        test('Single-fire time listener correctly interacts with rate changes', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.start();
            fakeTime.tick(200);
            clock.rate = 2.0;
            fakeTime.tick(50);
            clock.rate = -0.5;
            fakeTime.tick(200);
            clock.rate = 0.5;
            fakeTime.tick(599);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Single-fire time listener correctly interacts with negative rate', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.time = 700;
            clock.rate = -1.0;
            clock.start();
            fakeTime.tick(199);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Single-fire time listener correctly interacts with minimum', () => {
            const callback = sinon.spy();
            clock.onceAt(-100, callback);
            clock.minimum = -50;
            clock.rate = -1.0;
            clock.time = 100;
            clock.start();
            fakeTime.tick(300);
            assert(!callback.called);
        });
        test('Single-fire time listener correctly interacts with maximum', () => {
            const callback = sinon.spy();
            clock.onceAt(700, callback);
            clock.maximum = 500;
            clock.start();
            fakeTime.tick(900);
            assert(!callback.called);
        });
        test('Single-fire time listener correctly interacts with forward looping', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.minimum = -100;
            clock.maximum = 1000;
            clock.loop = true;
            clock.start();
            fakeTime.tick(200);
            clock.time = 900;
            fakeTime.tick(699);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Single-fire time listener correctly interacts with backward looping', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.rate = -1.0;
            clock.minimum = -100;
            clock.maximum = 900;
            clock.loop = true;
            clock.start();
            fakeTime.tick(200);
            clock.time = 300;
            fakeTime.tick(799);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Single-fire time listener only fires once', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            assert(callback.calledOnce);
            clock.time = 400;
            fakeTime.tick(200);
            assert(callback.calledOnce);
        });
        test('Single-fire time listener only fires once when the clock is modified in the callback', () => {
            const callback = sinon.spy(() => {
                clock.time = 400;
            });
            clock.onceAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            assert(callback.calledOnce);
            fakeTime.tick(200);
            assert(callback.calledOnce);
        });
        test('Multiple single-fire time listeners fire in the order they were added', () => {
            const callbackOne = sinon.spy();
            const callbackTwo = sinon.spy();
            clock.onceAt(500, callbackOne);
            clock.onceAt(500, callbackTwo);
            clock.start();
            fakeTime.tick(600);
            assert(callbackOne.calledBefore(callbackTwo));
            assert(callbackTwo.calledAfter(callbackOne));
        });
        test('Adding the same single-fire listener callback multiple times does not overwrite it', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.onceAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            assert(callback.calledTwice);
        });
        test('Adding the multiple types of the same single-fire listener callback does not overwrite it', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            clock.time = 400;
            fakeTime.tick(200);
            assert(callback.calledThrice);
        });
    });

    suite('.alwaysAt()', () => {
        test('Attaching always-fire time listener causes it to fire after the specified time', () => {
            const callbackOne = sinon.spy();
            clock.alwaysAt(500, callbackOne);
            clock.start();
            fakeTime.tick(499);
            assert(!callbackOne.called);
            fakeTime.tick(1);
            assert(callbackOne.calledOnce);

            const callbackTwo = sinon.spy();
            clock.alwaysAt(700, callbackTwo);
            clock.start();
            fakeTime.tick(199);
            assert(!callbackTwo.called);
            fakeTime.tick(1);
            assert(callbackTwo.calledOnce);
        });
        test('Always-fire time listener can only be bound to a finite time', () => {
            const callback = sinon.spy();
            assert.throws(() => {
                return clock.alwaysAt(Infinity, callback);
            });
            assert.throws(() => {
                return clock.alwaysAt(-Infinity, callback);
            });
        });
        test('Always-fire time listener correctly interacts with setting time', () => {
            const callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(200);
            clock.time = 400;
            fakeTime.tick(99);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Setting time to time of always-fire time listener causes it to fire if the clock is running', () => {
            const callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.start();
            assert(!callback.called);
            clock.time = 500;
            fakeTime.tick(0); // Required to make lolex fire timeouts
            assert(callback.calledOnce);
        });
        test('Setting time to time of always-fire time listener for a non-running clock fires it at clock start', () => {
            const callback = sinon.spy();
            clock.alwaysAt(500, callback);
            assert(!callback.called);
            clock.time = 500;
            fakeTime.tick(0);
            assert(!callback.called);
            clock.start();
            fakeTime.tick(0); // Required to make lolex fire timeouts
            assert(callback.calledOnce);
        });
        test('Always-fire time listener correctly interacts with rate changes', () => {
            const callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(200);
            clock.rate = 2.0;
            fakeTime.tick(50);
            clock.rate = -0.5;
            fakeTime.tick(200);
            clock.rate = 0.5;
            fakeTime.tick(599);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Always-fire time listener correctly interacts with negative rate', () => {
            const callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.time = 700;
            clock.rate = -1.0;
            clock.start();
            fakeTime.tick(199);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Always-fire time listener correctly interacts with minimum', () => {
            const callback = sinon.spy();
            clock.alwaysAt(-100, callback);
            clock.minimum = -50;
            clock.rate = -1.0;
            clock.time = 100;
            clock.start();
            fakeTime.tick(300);
            assert(!callback.called);
        });
        test('Always-fire time listener correctly interacts with maximum', () => {
            const callback = sinon.spy();
            clock.alwaysAt(700, callback);
            clock.maximum = 500;
            clock.start();
            fakeTime.tick(900);
            assert(!callback.called);
        });
        test('Always-fire time listener correctly interacts with forward looping', () => {
            const callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.minimum = -100;
            clock.maximum = 900;
            clock.loop = true;
            clock.start();
            fakeTime.tick(200);
            clock.time = 800;
            fakeTime.tick(699);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Always-fire time listener correctly interacts with backward looping', () => {
            const callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.rate = -1.0;
            clock.minimum = -100;
            clock.maximum = 900;
            clock.loop = true;
            clock.start();
            fakeTime.tick(200);
            clock.time = 300;
            fakeTime.tick(799);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Always-fire time listener fires every time', () => {
            const callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            assert(callback.calledOnce);
            clock.time = 400;
            fakeTime.tick(200);
            assert(callback.calledTwice);
        });
        test('Always-fire time listener fires correctly when the clock is modified in the callback', () => {
            const callback = sinon.spy(() => {
                clock.time = 400;
            });
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(550);
            assert(callback.calledOnce);
            fakeTime.tick(100);
            assert(callback.calledTwice);
        });
        test('Multiple always-fire time listeners fire in the order they were added', () => {
            const callbackOne = sinon.spy();
            const callbackTwo = sinon.spy();
            clock.alwaysAt(500, callbackOne);
            clock.alwaysAt(500, callbackTwo);
            clock.start();
            fakeTime.tick(600);
            assert(callbackOne.calledBefore(callbackTwo));
            assert(callbackTwo.calledAfter(callbackOne));
        });
        test('Adding the same always-fire listener callback multiple times does not overwrite it', () => {
            const callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            assert(callback.calledTwice);
        });
        test('Adding the multiple types of the same always-fire listener callback does not overwrite it', () => {
            const callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.onceAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            clock.time = 400;
            fakeTime.tick(200);
            assert(callback.calledThrice);
        });
    });

    suite('.removeAt()', () => {
        test('Detaching time listeners before time is reached causes them to never fire', () => {
            const callback = sinon.spy();
            clock.start();
            clock.onceAt(500, callback);
            fakeTime.tick(400);
            clock.removeAt(500, callback);
            fakeTime.tick(200);
            assert(!callback.called);
            clock.time = 0;
            clock.alwaysAt(500, callback);
            fakeTime.tick(400);
            clock.removeAt(500, callback);
            fakeTime.tick(200);
            assert(!callback.called);
        });
        test('Detaching always-fire time listener causes it to never fire again', () => {
            const callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            clock.removeAt(500, callback);
            clock.time = 400;
            fakeTime.tick(200);
            assert(callback.calledOnce);
        });
        test('Detaching time listeners before starting the clock causes them to never fire', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.time = 500;
            clock.removeAt(500, callback);
            clock.start();
            fakeTime.tick(100);
            clock.time = 400;
            fakeTime.tick(200);
            assert(!callback.called);
            clock.time = 0;
            clock.alwaysAt(500, callback);
            clock.time = 500;
            clock.removeAt(500, callback);
            clock.start();
            fakeTime.tick(100);
            clock.time = 400;
            fakeTime.tick(200);
            assert(!callback.called);
        });
        test('Detaching time listeners removes all matching time listeners in a single call', () => {
            const callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.alwaysAt(500, callback);
            clock.time = 500;
            clock.removeAt(500, callback);
            clock.start();
            fakeTime.tick(100);
            clock.time = 400;
            fakeTime.tick(200);
            assert(!callback.called);
        });
        test('Detaching non-existing time listener throws an error', () => {
            const callback = sinon.spy();
            assert.throws(() => { clock.removeAt(500, callback); });
            assert(!callback.called);
        });
    });

    suiteTeardown(() => {
        fakeTime.uninstall();
    });
});
