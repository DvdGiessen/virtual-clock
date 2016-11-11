import VirtualClock from '../src/virtual-clock';

const assert = require('chai').assert;
const lolex = require('lolex');
const sinon = require('sinon');

suite('VirtualClock', function() {
    let fakeTime;
    suiteSetup(function() {
        fakeTime = lolex.install();
    });
    
    let clock;
    setup(function() {
        clock = new VirtualClock();
    });

    suite('.time', function() {
        test('At instanciation time is 0', function() {
            assert.equal(clock.time, 0);
        });
        test('Setting time changes time', function() {
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
    });

    suite('.running', function() {
        test('At instancation clock is not running', function() {
            assert.equal(clock.running, false);
        });
        test('When not running time should not change', function() {
            assert.equal(clock.running, false);
            let firstTime = clock.time;
            fakeTime.tick(100);
            let secondTime = clock.time;
            assert.equal(firstTime, secondTime);
            fakeTime.tick(150);
            let thirdTime = clock.time;
            assert.equal(secondTime, thirdTime);
        });
        test('When running time increases', function() {
            assert.equal(clock.running, false);
            let firstTime = clock.time;
            clock.running = true;
            assert.equal(clock.running, true);
            fakeTime.tick(100);
            let secondTime = clock.time;
            assert(secondTime > firstTime);
            fakeTime.tick(150);
            let thirdTime = clock.time;
            assert(thirdTime > secondTime);
        });
        test('After stopping to run time no longer changes', function() {
            assert.equal(clock.running, false);
            let firstTime = clock.time;
            clock.running = true;
            assert.equal(clock.running, true);
            fakeTime.tick(100);
            let secondTime = clock.time;
            assert(secondTime > firstTime);
            clock.running = false;
            assert.equal(clock.running, false);
            let thirdTime = clock.time;
            fakeTime.tick(150);
            let fourthTime = clock.time;
            assert.equal(thirdTime, fourthTime);
        });
    });

    suite('.start()', function() {
        test('Calling causes non-running clock to start running', function() {
            assert.equal(clock.running, false);
            let firstTime = clock.time;
            clock.start();
            assert.equal(clock.running, true);
            fakeTime.tick(100);
            let secondTime = clock.time;
            assert(secondTime > firstTime);
        });
        test('Calling does not affect running clock', function() {
            assert.equal(clock.running, false);
            let firstTime = clock.time;
            clock.start();
            assert.equal(clock.running, true);
            fakeTime.tick(100);
            let secondTime = clock.time;
            assert(secondTime > firstTime);
            clock.start();
            assert.equal(clock.running, true);
            fakeTime.tick(150);
            let thirdTime = clock.time;
            assert(thirdTime > secondTime);
        });
    });

    suite('.stop()', function() {
        test('Calling causes running clock to stop running', function() {
            clock.running = true;
            assert.equal(clock.running, true);
            let firstTime = clock.time;
            fakeTime.tick(100);
            let secondTime = clock.time;
            assert(secondTime > firstTime);
            clock.stop();
            assert.equal(clock.running, false);
            let thirdTime = clock.time;
            fakeTime.tick(150);
            let fourthTime = clock.time;
            assert.equal(thirdTime, fourthTime);
        });
        test('Calling does not affect non-running clock', function() {
            clock.running = true;
            assert.equal(clock.running, true);
            let firstTime = clock.time;
            fakeTime.tick(100);
            let secondTime = clock.time;
            assert(secondTime > firstTime);
            clock.stop();
            assert.equal(clock.running, false);
            let thirdTime = clock.time;
            fakeTime.tick(150);
            let fourthTime = clock.time;
            assert.equal(thirdTime, fourthTime);
            let fifthTime = clock.time;
            fakeTime.tick(200);
            let sixthTime = clock.time;
            assert.equal(fifthTime, sixthTime);
        });
    });

    suite('.rate', function() {
        test('At instancation rate is 1.0', function() {
            assert.equal(clock.rate, 1.0);
        });
        test('Time flows normally at 1.0 rate', function() {
            assert.equal(clock.rate, 1.0);
            assert.equal(clock.time, 0);
            clock.start();
            fakeTime.tick(100);
            assert.equal(clock.time, 100);
            fakeTime.tick(150);
            assert.equal(clock.time, 250);
        });
        test('Positive rate correctly corresponds to time flow', function() {
            clock.start();
            for(let rate of [0.1, 0.2, 0.5, 0.9, 1.0, 1.1, 1.5, 2.0, 5.0]) {
                clock.rate = rate;
                assert.equal(clock.rate, rate);
                let firstTime = clock.time;
                fakeTime.tick(100);
                let secondTime = clock.time;
                assert.closeTo(secondTime - firstTime, 100 * rate, 0.0000001);
                fakeTime.tick(150);
                let thirdTime = clock.time;
                assert.closeTo(thirdTime - secondTime, 150 * rate, 0.0000001);
            }
        });
        test('Time does not change at rate 0.0', function() {
            clock.start();
            clock.rate = 0.0;
            assert.equal(clock.rate, 0.0);
            let firstTime = clock.time;
            fakeTime.tick(100);
            let secondTime = clock.time;
            assert.equal(firstTime, secondTime);
            fakeTime.tick(100);
            let thirdTime = clock.time;
            assert.equal(secondTime, thirdTime);
        });
        test('Negative rate correctly corresponds to time flow', function() {
            clock.time = 5000;
            clock.start();
            for(let rate of [-0.1, -0.2, -0.5, -0.9, -1.0, -1.1, -1.5, -2.0, -5.0]) {
                clock.rate = rate;
                assert.equal(clock.rate, rate);
                let firstTime = clock.time;
                fakeTime.tick(100);
                let secondTime = clock.time;
                assert.closeTo(secondTime - firstTime, 100 * rate, 0.0000001);
                fakeTime.tick(150);
                let thirdTime = clock.time;
                assert.closeTo(thirdTime - secondTime, 150 * rate, 0.0000001);
            }
        });
    });

    suite('.minimum', function() {
        test('At instanciation minimum is -Infinity', function() {
            assert.equal(clock.minimum, -Infinity);
        });
        test('Setting minimum sets it', function() {
            clock.minimum = 10;
            assert.equal(clock.minimum, 10);
            clock.minimum = 500;
            assert.equal(clock.minimum, 500);
            clock.minimum = -250;
            assert.equal(clock.minimum, -250);
            clock.minimum = -Infinity;
            assert.equal(clock.minimum, -Infinity);
        });
        test('Setting time is limited by minimum', function() {
            clock.minimum = -100;
            clock.time = -200;
            assert.equal(clock.time, -100);
        });
        test('Setting minimum when time is before minimum resets time to minimum', function() {
            clock.time = 100;
            clock.minimum = 200;
            assert.equal(clock.time, 200);
        });
        test('Clock does not run past minimum', function() {
            clock.minimum = -100;
            clock.rate = -1.0;
            clock.start();
            fakeTime.tick(50);
            assert.equal(clock.time, -50);
            fakeTime.tick(150);
            assert.equal(clock.time, -100);
        });
    });

    suite('.maximum', function() {
        test('At instanciation maximum is Infinity', function() {
            assert.equal(clock.maximum, Infinity);
        });
        test('Setting maximum sets it', function() {
            clock.maximum = 10;
            assert.equal(clock.maximum, 10);
            clock.maximum = 500;
            assert.equal(clock.maximum, 500);
            clock.maximum = -250;
            assert.equal(clock.maximum, -250);
            clock.maximum = Infinity;
            assert.equal(clock.maximum, Infinity);
        });
        test('Setting time is limited by maximum', function() {
            clock.maximum = 100;
            clock.time = 200;
            assert.equal(clock.time, 100);
        });
        test('Setting maximum when time is past maximum resets time to maximum', function() {
            clock.time = 200;
            clock.maximum = 100;
            assert.equal(clock.time, 100);
        });
        test('Clock does not run past maximum', function() {
            clock.maximum = 200;
            clock.start();
            fakeTime.tick(100);
            assert.equal(clock.time, 100);
            fakeTime.tick(150);
            assert.equal(clock.time, 200);
        });
    });
    
    suite('.loop', function() {
        test('At instanciation looping is disabled', function() {
            assert.equal(clock.loop, false);
        });
        test('Passing maximum makes clock loop and start from minimum', function() {
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
        });
        test('When looping, the maximum is never returned but the minimum is returned instead', function() {
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
        test('Looping continues from minimum when clock is at maximum when looping is enabled', function() {
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
        test('Looping continues from minimum when clock was over maximum when maximum is set', function() {
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
        test('Looping continues from maximum when clock was below minimum when minimum is set', function() {
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
        test('Backwards running clock jumps from minimum to maximum', function() {
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
        });
        test('Clock does not loop without a minimum', function() {
            clock.maximum = 300;
            clock.time = 200;
            clock.loop = true;
            clock.start();
            fakeTime.tick(400);
            assert.equal(clock.time, 300);
        });
        test('Backwards running clock does not loop without a maximum', function() {
            clock.minimum = -100;
            clock.time = 200;
            clock.rate = -1.0;
            clock.loop = true;
            clock.start();
            fakeTime.tick(400);
            assert.equal(clock.time, -100);
        });
        test('Looping continues from maximum when backward running clock is at minimum when looping is enabled', function() {
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
        test('Looping continues from maximum when backward running clock is at minimum when maximum is set', function() {
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
    
    suite('.on()', function() {
        test('Event listener for "start" fires when clock is started via .start()', function() {
            let callback = sinon.spy();
            clock.on('start', callback);
            assert(!callback.called);
            clock.start();
            assert(callback.calledOnce);
        });
        test('Event listener for "start" fires when setting running to true', function() {
            let callback = sinon.spy();
            clock.on('start', callback);
            assert(!callback.called);
            clock.running = true;
            assert(callback.calledOnce);
        });
        test('Event listener for "start" does not fire when clock is already running', function() {
            let callback = sinon.spy();
            clock.on('start', callback);
            clock.start();
            clock.start();
            clock.running = true;
            assert(callback.calledOnce);
        });
        test('Event listener for "stop" fires when clock is stopped via .stop()', function() {
            clock.start();
            let callback = sinon.spy();
            clock.on('stop', callback);
            assert(!callback.called);
            clock.stop();
            assert(callback.calledOnce);
        });
        test('Event listener for "stop" fires when setting running to false', function() {
            clock.start();
            let callback = sinon.spy();
            clock.on('stop', callback);
            assert(!callback.called);
            clock.running = false;
            assert(callback.calledOnce);
        });
        test('Event listener for "stop" does not fire when clock is not running', function() {
            clock.start();
            let callback = sinon.spy();
            clock.on('stop', callback);
            clock.stop();
            clock.stop();
            clock.running = false;
            assert(callback.calledOnce);
        });
        test('Event listener for "settime" fires when time is set', function() {
            let callback = sinon.spy();
            clock.on('settime', callback);
            assert(!callback.called);
            clock.time = 500;
            assert(callback.calledOnce);
            clock.time = 500;
            assert(callback.calledTwice);
            clock.time = -500;
            assert(callback.calledThrice);
        });
        test('Event listener for "setrunning" fires when running is set', function() {
            let callback = sinon.spy();
            clock.on('setrunning', callback);
            assert(!callback.called);
            clock.running = true;
            assert(callback.calledOnce);
            clock.running = false;
            assert(callback.calledTwice);
            clock.running = false;
            assert(callback.calledThrice);
        });
        test('Event listener for "setrunning" fires when .start() is called (regardless of running state)', function() {
            let callback = sinon.spy();
            clock.on('setrunning', callback);
            assert(!callback.called);
            clock.start();
            assert(callback.calledOnce);
            clock.start();
            assert(callback.calledTwice);
        });
        test('Event listener for "setrunning" fires when .stop() is called (regardless of running state)', function() {
            let callback = sinon.spy();
            clock.on('setrunning', callback);
            assert(!callback.called);
            clock.stop();
            assert(callback.calledOnce);
            clock.start();
            assert(callback.calledTwice);
            clock.stop();
            assert(callback.calledThrice);
        });
        test('Event listener for "setrate" fires when rate is set', function() {
            let callback = sinon.spy();
            clock.on('setrate', callback);
            assert(!callback.called);
            clock.rate = 5.0;
            assert(callback.calledOnce);
            clock.rate = 0.0;
            assert(callback.calledTwice);
            clock.rate = -1.0;
            assert(callback.calledThrice);
        });
        test('Event listener for "setmaximum" fires when maximum is set', function() {
            let callback = sinon.spy();
            clock.on('setmaximum', callback);
            assert(!callback.called);
            clock.maximum = 500;
            assert(callback.calledOnce);
            clock.time = 800;
            clock.maximum = 500;
            assert(callback.calledTwice);
            clock.maximum = -50;
            assert(callback.calledThrice);
        });
        test('Event listener for "setloop" fires when loop is set', function() {
            let callback = sinon.spy();
            clock.on('setloop', callback);
            assert(!callback.called);
            clock.loop = true;
            assert(callback.calledOnce);
            clock.loop = false;
            assert(callback.calledTwice);
        });
    });
    
    suite('.off()', function() {
        test('Detaching event listener causes it to no longer fire', function() {
            let callback = sinon.spy();
            clock.on('settime', callback);
            assert(!callback.called);
            clock.time = 500;
            assert(callback.calledOnce);
            clock.off('settime', callback);
            clock.time = 800;
            assert(callback.calledOnce);
        });
    });
    
    suite('.onceAt()', function() {
        test('Attaching single-fire time listener causes it to fire after the specified time', function() {
            let callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.start();
            fakeTime.tick(499);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Single-fire time listener correctly interacts with setting time', function() {
            let callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.start();
            fakeTime.tick(200);
            clock.time = 400;
            fakeTime.tick(99);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Setting time to time of single-fire time listener causes it to fire if the clock is running', function() {
            let callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.start();
            assert(!callback.called);
            clock.time = 500;
            fakeTime.tick(0); // Required to make lolex fire timeouts
            assert(callback.calledOnce);
        });
        test('Setting time to time of single-fire time listener for a non-running clock fires it at clock start', function() {
            let callback = sinon.spy();
            clock.onceAt(500, callback);
            assert(!callback.called);
            clock.time = 500;
            fakeTime.tick(0);
            assert(!callback.called);
            clock.start();
            fakeTime.tick(0); // Required to make lolex fire timeouts
            assert(callback.calledOnce);
        });
        test('Single-fire time listener correctly interacts with rate changes', function() {
            let callback = sinon.spy();
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
        test('Single-fire time listener correctly interacts with negative rate', function() {
            let callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.time = 700;
            clock.rate = -1.0;
            clock.start();
            fakeTime.tick(199);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Single-fire time listener correctly interacts with minimum', function() {
            let callback = sinon.spy();
            clock.onceAt(-100, callback);
            clock.minimum = -50;
            clock.rate = -1.0;
            clock.time = 100;
            clock.start();
            fakeTime.tick(300);
            assert(!callback.called);
        });
        test('Single-fire time listener correctly interacts with maximum', function() {
            let callback = sinon.spy();
            clock.onceAt(700, callback);
            clock.maximum = 500;
            clock.start();
            fakeTime.tick(900);
            assert(!callback.called);
        });
        test('Single-fire time listener correctly interacts with forward looping', function() {
            let callback = sinon.spy();
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
        test('Single-fire time listener correctly interacts with backward looping', function() {
            let callback = sinon.spy();
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
        test('Single-fire time listener only fires once', function() {
            let callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            assert(callback.calledOnce);
            clock.time = 400;
            fakeTime.tick(200);
            assert(callback.calledOnce);
        });
        test('Multiple single-fire time listeners fire in the order they were added', function() {
            let callbackOne = sinon.spy();
            let callbackTwo = sinon.spy();
            clock.onceAt(500, callbackOne);
            clock.onceAt(500, callbackTwo);
            clock.start();
            fakeTime.tick(600);
            assert(callbackOne.calledBefore(callbackTwo));
            assert(callbackTwo.calledAfter(callbackOne));
        });
        test('Adding the same single-fire listener callback multiple times does not overwrite it', function() {
            let callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.onceAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            assert(callback.calledTwice);
        });
        test('Adding the multiple types of the same single-fire listener callback does not overwrite it', function() {
            let callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            clock.time = 400;
            fakeTime.tick(200);
            assert(callback.calledThrice);
        });
    });
    
    suite('.alwaysAt()', function() {
        test('Attaching always-fire time listener causes it to fire after the specified time', function() {
            let callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(499);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Always-fire time listener correctly interacts with setting time', function() {
            let callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(200);
            clock.time = 400;
            fakeTime.tick(99);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Setting time to time of always-fire time listener causes it to fire if the clock is running', function() {
            let callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.start();
            assert(!callback.called);
            clock.time = 500;
            fakeTime.tick(0); // Required to make lolex fire timeouts
            assert(callback.calledOnce);
        });
        test('Setting time to time of always-fire time listener for a non-running clock fires it at clock start', function() {
            let callback = sinon.spy();
            clock.alwaysAt(500, callback);
            assert(!callback.called);
            clock.time = 500;
            fakeTime.tick(0);
            assert(!callback.called);
            clock.start();
            fakeTime.tick(0); // Required to make lolex fire timeouts
            assert(callback.calledOnce);
        });
        test('Always-fire time listener correctly interacts with rate changes', function() {
            let callback = sinon.spy();
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
        test('Always-fire time listener correctly interacts with negative rate', function() {
            let callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.time = 700;
            clock.rate = -1.0;
            clock.start();
            fakeTime.tick(199);
            assert(!callback.called);
            fakeTime.tick(1);
            assert(callback.calledOnce);
        });
        test('Always-fire time listener correctly interacts with minimum', function() {
            let callback = sinon.spy();
            clock.alwaysAt(-100, callback);
            clock.minimum = -50;
            clock.rate = -1.0;
            clock.time = 100;
            clock.start();
            fakeTime.tick(300);
            assert(!callback.called);
        });
        test('Always-fire time listener correctly interacts with maximum', function() {
            let callback = sinon.spy();
            clock.alwaysAt(700, callback);
            clock.maximum = 500;
            clock.start();
            fakeTime.tick(900);
            assert(!callback.called);
        });
        test('Always-fire time listener correctly interacts with forward looping', function() {
            let callback = sinon.spy();
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
        test('Always-fire time listener correctly interacts with backward looping', function() {
            let callback = sinon.spy();
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
        test('Always-fire time listener fires every time', function() {
            let callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            assert(callback.calledOnce);
            clock.time = 400;
            fakeTime.tick(200);
            assert(callback.calledTwice);
        });
        test('Multiple always-fire time listeners fire in the order they were added', function() {
            let callbackOne = sinon.spy();
            let callbackTwo = sinon.spy();
            clock.alwaysAt(500, callbackOne);
            clock.alwaysAt(500, callbackTwo);
            clock.start();
            fakeTime.tick(600);
            assert(callbackOne.calledBefore(callbackTwo));
            assert(callbackTwo.calledAfter(callbackOne));
        });
        test('Adding the same always-fire listener callback multiple times does not overwrite it', function() {
            let callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            assert(callback.calledTwice);
        });
        test('Adding the multiple types of the same always-fire listener callback does not overwrite it', function() {
            let callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.onceAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            clock.time = 400;
            fakeTime.tick(200);
            assert(callback.calledThrice);
        });
    });
    
    suite('.removeAt()', function() {
        test('Detaching time listeners before time is reached causes them to never fire', function() {
            let callback = sinon.spy();
            clock.onceAt(500, callback);
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(400);
            clock.removeAt(500, callback);
            fakeTime.tick(200);
            assert(!callback.called);
        });
        test('Detaching always-fire time listener causes it to never fire again', function() {
            let callback = sinon.spy();
            clock.alwaysAt(500, callback);
            clock.start();
            fakeTime.tick(600);
            clock.removeAt(500, callback);
            clock.time = 400;
            fakeTime.tick(200);
            assert(callback.calledOnce);
        });
        test('Detaching time listeners before starting the clock causes them to never fire', function() {
            let callback = sinon.spy();
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
    });
    
    suiteTeardown(function() {
        fakeTime.uninstall();
    });
});
