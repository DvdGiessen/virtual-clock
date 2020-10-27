(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.virtualClock = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _slicedToArray = function () {
        function sliceIterator(arr, i) {
            var _arr = [];
            var _n = true;
            var _d = false;
            var _e = undefined;

            try {
                for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                    _arr.push(_s.value);

                    if (i && _arr.length === i) break;
                }
            } catch (err) {
                _d = true;
                _e = err;
            } finally {
                try {
                    if (!_n && _i["return"]) _i["return"]();
                } finally {
                    if (_d) throw _e;
                }
            }

            return _arr;
        }

        return function (arr, i) {
            if (Array.isArray(arr)) {
                return arr;
            } else if (Symbol.iterator in Object(arr)) {
                return sliceIterator(arr, i);
            } else {
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
            }
        };
    }();

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    var VirtualClock = function () {

        /**
         * Constructs a stopped clock with default settings.
         */
        function VirtualClock() {
            _classCallCheck(this, VirtualClock);

            // Determine method for retrieving now
            this._now = typeof performance !== 'undefined' && /*global performance */performance.now || typeof process !== 'undefined' && /*global process */process.hrtime && function () {
                var now = process.hrtime();return now[0] * 1e3 + now[1] / 1e6;
            } || Date.now || function () {
                return new Date().getTime();
            };

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

            // Make private properties non-enumerable
            for (var prop in this) {
                if (prop.startsWith('_')) {
                    Object.defineProperty(this, prop, { enumerable: false });
                }
            }
        }

        // Methods
        /**
         * Starts running the clock. Does nothing when clock was already running.
         */


        _createClass(VirtualClock, [{
            key: 'start',
            value: function start() {
                // Start running the time if we werent running
                if (!this._running) {
                    this._previousNow = this._now();
                    this._running = true;
                    this._recalculateTimeListeners();

                    // Trigger event listeners
                    this.trigger('start');
                }

                // Trigger setrunning listeners
                this.trigger('setrunning');

                // Method chaining
                return this;
            }
        }, {
            key: 'stop',
            value: function stop() {
                // Stops running the time if we were running
                if (this._running) {
                    this._previousTime = this.time;
                    this._running = false;
                    this._recalculateTimeListeners();

                    // Trigger event listeners
                    this.trigger('stop');
                }

                // Trigger setrunning listeners
                this.trigger('setrunning');

                // Method chaining
                return this;
            }
        }, {
            key: 'on',
            value: function on(event, callback) {
                // Add the listener
                var listeners = this._eventListeners.get(event);
                if (listeners) {
                    listeners.push(callback);
                } else {
                    this._eventListeners.set(event, [callback]);
                }

                // Method chaining
                return this;
            }
        }, {
            key: 'off',
            value: function off(event, callback) {
                // Find the listener
                var listeners = this._eventListeners.get(event);
                if (listeners) {
                    var i = listeners.indexOf(callback);
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
        }, {
            key: 'trigger',
            value: function trigger(event) {
                var _this = this;

                for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                }

                var listeners = this._eventListeners.get(event);
                if (listeners) {
                    listeners.slice(0).forEach(function (listener) {
                        listener.apply(_this, args);
                    });
                }

                // Method chaining
                return this;
            }
        }, {
            key: '_recalculateTimeListeners',
            value: function _recalculateTimeListeners() {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = this._timeListeners.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var listener = _step.value;

                        this._recalculateTimeListener(listener);
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
        }, {
            key: '_recalculateTimeListener',
            value: function _recalculateTimeListener(listener) {
                var _this2 = this;

                // Check if the listener is still registered
                var listenerData = this._timeListeners.get(listener);
                if (listenerData) {
                    (function () {
                        var _listener = _slicedToArray(listener, 2),
                            time = _listener[0],
                            callback = _listener[1];

                        var _listenerData = _slicedToArray(listenerData, 3),
                            timeoutId = _listenerData[0],
                            lastCalled = _listenerData[1],
                            once = _listenerData[2];

                        // Clear any open timeouts
                        clearTimeout(timeoutId);

                        // Only add timeouts if we're running and the time is reachable
                        if (_this2._running && _this2._rate != 0 && time >= _this2._minimum && time <= _this2._maximum) {
                            // Get current time
                            var currentTime = _this2.time;

                            // Did we already run at this time?
                            if (currentTime === lastCalled) {
                                // Is is possible to wait?
                                if (_this2._loop || currentTime !== _this2._minimum && currentTime !== _this2._maximum) {
                                    // Wait until the time has changed enough to prevent racing and then retry
                                    _this2._timeListeners.set(listener, [setTimeout(function () {
                                        _this2._recalculateTimeListener(listener);
                                    }, 1), lastCalled, once]);
                                }
                            } else {
                                // Clock time until the listener should be triggered
                                var until = void 0;

                                // Initial calculation depends on which way time is moving
                                if (_this2._rate > 0) {
                                    until = time - currentTime;
                                } else {
                                    until = currentTime - time;
                                }

                                // If the time is going to be reached
                                if (until >= 0 || _this2._loop && _this2._minimum > -Infinity && _this2._maximum < Infinity) {
                                    // Add time when looping
                                    if (until < 0) {
                                        until += _this2._maximum - _this2._minimum;
                                    }

                                    // Factor in the rate
                                    until *= 1 / Math.abs(_this2._rate);

                                    // Ceil the value, otherwise setTimeout may floor it and run before it is supposed to
                                    until = Math.ceil(until);

                                    // Set timeout
                                    _this2._timeListeners.set(listener, [setTimeout(function () {
                                        // Safety checkif listener is still registered
                                        var listenerData = _this2._timeListeners.get(listener);
                                        if (listenerData) {
                                            var _listenerData2 = _slicedToArray(listenerData, 3),
                                                _once = _listenerData2[2];

                                            // Save time of call
                                            _this2._timeListeners.set(listener, [0, _this2.time, _once]);

                                            // Call the callback
                                            callback.call(_this2);

                                            // Should we self-destruct
                                            if (_once) {
                                                _this2._timeListeners.delete(listener);
                                            } else {
                                                // Recalculate the time listener
                                                _this2._recalculateTimeListener(listener);
                                            }
                                        }
                                    }, until), NaN, once]);
                                }
                            }
                        }
                    })();
                }
            }
        }, {
            key: 'onceAt',
            value: function onceAt(time, callback) {
                var listener = [time, callback];
                this._timeListeners.set(listener, [0, NaN, true]);
                this._recalculateTimeListener(listener);

                // Method chaining
                return this;
            }
        }, {
            key: 'alwaysAt',
            value: function alwaysAt(time, callback) {
                var listener = [time, callback];
                this._timeListeners.set(listener, [0, NaN, false]);
                this._recalculateTimeListener(listener);

                // Method chaining
                return this;
            }
        }, {
            key: 'removeAt',
            value: function removeAt(time, callback) {
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    // Loop over all listeners
                    for (var _iterator2 = this._timeListeners.keys()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var listener = _step2.value;

                        var _listener2 = _slicedToArray(listener, 2),
                            listenerTime = _listener2[0],
                            listenerCallback = _listener2[1];

                        // If the listener matches, delete it
                        if (listenerTime === time && listenerCallback === callback) {
                            this._timeListeners.delete(listener);
                        }
                    }

                    // Method chaining
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                return this;
            }
        }, {
            key: 'time',
            get: function get() {
                var currentTime = this._previousTime;

                // If running, the time is has changed since the previous time so we recalculate it
                if (this._running) {
                    // Calculate current time based on passed time
                    currentTime += this._rate * (this._now() - this._previousNow);
                }

                // Can we loop (loop enabled + a non-zero non-finite maximum)
                if (this._loop && this._minimum > -Infinity && this._maximum < Infinity) {
                    // Is the time below the minimum (meaning we are looping backwards)
                    if (currentTime < this._minimum) {
                        // Append until we're between bounds again
                        do {
                            currentTime += this._maximum - this._minimum;
                        } while (currentTime < this._minimum);
                    } else {
                        // Performance: If the minimum is zero, just calculate our current position in the loop by modulo
                        if (this._minimum == 0) {
                            currentTime %= this._maximum;
                        } else {
                            // Substract until we're between bounds again
                            while (currentTime >= this._maximum) {
                                currentTime -= this._maximum - this._minimum;
                            }
                        }
                    }
                } else {
                    // No looping means we just limit our output between minimum and maximum
                    currentTime = Math.min(Math.max(this._minimum, currentTime), this._maximum);
                }

                return currentTime;
            },
            set: function set(time) {
                // Recalibrate by setting both correct time and now
                this._previousTime = Math.min(Math.max(this._minimum, time), this._maximum);
                this._previousNow = this._now();

                // Recalculate time listeners
                this._recalculateTimeListeners();

                // Trigger event listeners
                this.trigger('settime');
            }
        }, {
            key: 'running',
            get: function get() {
                return this._running;
            },
            set: function set(running) {
                // Changing running state just calls start() or stop()
                running ? this.start() : this.stop();
            }
        }, {
            key: 'rate',
            get: function get() {
                return this._rate;
            },
            set: function set(rate) {
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
        }, {
            key: 'minimum',
            get: function get() {
                return this._minimum;
            },
            set: function set(minimum) {
                // First get the calculated time, calculated using the old minimum
                var previousTime = this.time;

                // Do not allow setting a minimum above the maximum
                if (minimum > this._maximum || minimum == Infinity) {
                    throw new Error('Cannot set minimum above maximum');
                }

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
        }, {
            key: 'maximum',
            get: function get() {
                return this._maximum;
            },
            set: function set(maximum) {
                // First get the calculated time, calculated using the old maximum
                var previousTime = this.time;

                // Do not allow setting a maximum below the minimum
                if (maximum < this._minimum || maximum == -Infinity) {
                    throw new Error('Cannot set maximum below minimum');
                }

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
        }, {
            key: 'loop',
            get: function get() {
                return this._loop;
            },
            set: function set(loop) {
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
        }]);

        return VirtualClock;
    }();

    exports.default = VirtualClock;
});
//# sourceMappingURL=virtual-clock.js.map