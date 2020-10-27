(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = factory(module.exports);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    global.virtualClock = global.VirtualClock = factory({});
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports["default"] = void 0;

  function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

  function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

  function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

  function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

  function _createForOfIteratorHelper(o) { if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (o = _unsupportedIterableToArray(o))) { var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var it, normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

  function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(n); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

  function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

  /**
   * A configurable virtual clock for tracking time.
   *
   * @author Daniël van de Giessen
   * @see https://dvdgiessen.github.io/virtual-clock/
   */
  var VirtualClock = /*#__PURE__*/function () {
    /**
     * Constructs a stopped clock with default settings.
     */
    function VirtualClock() {
      _classCallCheck(this, VirtualClock);

      // Determine method for retrieving now
      this._now = typeof performance !== 'undefined' &&
      /*global performance */
      performance.now.bind(performance) || typeof process !== 'undefined' &&
      /*global process */
      process.hrtime && function () {
        var now = process.hrtime();
        return now[0] * 1e3 + now[1] / 1e6;
      } || Date.now; // Current state


      this._previousTime = 0;
      this._previousNow = this._now(); // Flow of time configuration

      this._rate = 1.0;
      this._running = false; // Minimum / maximum / looping configuration

      this._minimum = -Infinity;
      this._maximum = Infinity;
      this._loop = false; // Event and time listeners

      this._eventListeners = new Map();
      this._timeListeners = new Map(); // Create unique TimeoutID to track non-scheduled timers

      this._nullTimeoutID = setTimeout(function () {}, 0); // Make private properties non-enumerable

      for (var prop in this) {
        if (prop.startsWith('_')) {
          Object.defineProperty(this, prop, {
            enumerable: false
          });
        }
      } // Bind methods to this object


      var _iterator = _createForOfIteratorHelper(Object.getOwnPropertyNames(VirtualClock.prototype)),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _prop = _step.value;
          var descriptor = Object.getOwnPropertyDescriptor(VirtualClock.prototype, _prop);

          if (descriptor && 'value' in descriptor && typeof descriptor.value === 'function') {
            Object.defineProperty(this, _prop, {
              value: descriptor.value.bind(this)
            });
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    } // Methods

    /**
     * Starts running the clock. Does nothing when clock was already running.
     */


    _createClass(VirtualClock, [{
      key: "start",
      value: function start() {
        // Start running the time if we werent running
        if (!this._running) {
          this._previousNow = this._now();
          this._running = true;

          this._recalculateTimeListeners(); // Trigger event listeners


          this.trigger('start');
          this.trigger('setrunning');
        } // Method chaining


        return this;
      }
      /**
       * Stops running the clock. Does nothing when clock was not running.
       */

    }, {
      key: "stop",
      value: function stop() {
        // Stops running the time if we were running
        if (this._running) {
          this._previousTime = this.time;
          this._running = false;

          this._recalculateTimeListeners(); // Trigger event listeners


          this.trigger('stop');
          this.trigger('setrunning');
        } // Method chaining


        return this;
      }
      /**
       * Attaches an event listener.
       *
       * Supported events: start, stop, settime, setrunning, setrate, setminimum, setmaximum, setloop
       */

    }, {
      key: "on",
      value: function on(event, callback) {
        // Add the listener
        var listeners = this._eventListeners.get(event);

        if (listeners) {
          listeners.push(callback);
        } else {
          this._eventListeners.set(event, [callback]);
        } // Method chaining


        return this;
      }
      /**
       * Detaches a previously attached event listener.
       */

    }, {
      key: "off",
      value: function off(event, callback) {
        // Find the listener
        var listeners = this._eventListeners.get(event);

        if (listeners) {
          var i = listeners.indexOf(callback);

          if (i >= 0) {
            // Remove the listener
            listeners.splice(i, 1); // Method chaining

            return this;
          }
        } // When not found, throw an error


        throw new Error('Event listener not found');
      }
      /**
       * Triggers an attached event listener.
       */

    }, {
      key: "trigger",
      value: function trigger(event) {
        var _this = this;

        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        var listeners = this._eventListeners.get(event);

        if (listeners) {
          listeners.slice(0).forEach(function (listener) {
            listener.apply(_this, args);
          });
        } // Method chaining


        return this;
      }
      /**
       * Private method for recalculating all registered time listeners.
       */

    }, {
      key: "_recalculateTimeListeners",
      value: function _recalculateTimeListeners() {
        var _iterator2 = _createForOfIteratorHelper(this._timeListeners.keys()),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var listener = _step2.value;

            this._recalculateTimeListener(listener);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
      /**
       * Private method for recalculating a specific registered time listener.
       */

    }, {
      key: "_recalculateTimeListener",
      value: function _recalculateTimeListener(listener) {
        var _this2 = this;

        // Check if the listener is still registered
        var listenerData = this._timeListeners.get(listener);

        if (listenerData) {
          var _listener = _slicedToArray(listener, 2),
              time = _listener[0],
              callback = _listener[1];

          var _listenerData = _slicedToArray(listenerData, 3),
              timeoutID = _listenerData[0],
              lastCalled = _listenerData[1],
              once = _listenerData[2]; // Clear any open timeouts


          clearTimeout(timeoutID); // Only add timeouts if we're running and the time is reachable

          if (this._running && this._rate !== 0 && time >= this._minimum && time <= this._maximum) {
            // Get current time
            var currentTime = this.time; // Did we already run at this time?

            if (currentTime === lastCalled) {
              // Is is possible to wait?
              if (this._loop || currentTime !== this._minimum && currentTime !== this._maximum) {
                // Wait until the time has changed enough to prevent racing and then retry
                this._timeListeners.set(listener, [setTimeout(function () {
                  _this2._recalculateTimeListener(listener);
                }, 1), lastCalled, once]);
              }
            } else {
              // Clock time until the listener should be triggered
              var until; // Initial calculation depends on which way time is moving

              if (this._rate > 0) {
                until = time - currentTime;
              } else {
                until = currentTime - time;
              } // If the time is going to be reached


              if (until >= 0 || this._loop && this._minimum > -Infinity && this._maximum < Infinity) {
                // Add time when looping
                if (until < 0) {
                  until += this._maximum - this._minimum;
                } // Factor in the rate


                until *= 1 / Math.abs(this._rate); // Ceil the value, otherwise setTimeout may floor it and run before it is supposed to

                until = Math.ceil(until); // Set timeout

                this._timeListeners.set(listener, [setTimeout(function () {
                  // Should we self-destruct
                  if (once) {
                    _this2._timeListeners["delete"](listener);
                  } else {
                    // Save time of call
                    _this2._timeListeners.set(listener, [_this2._nullTimeoutID, _this2.time, once]);
                  } // Call the callback


                  callback.call(_this2); // Recalculate the time listener

                  if (!once) {
                    _this2._recalculateTimeListener(listener);
                  }
                }, until), NaN, once]);
              }
            }
          }
        }
      }
      /**
       * Attaches a time listener which fires once after the specified clock time has passed.
       */

    }, {
      key: "onceAt",
      value: function onceAt(time, callback) {
        // Do not allow setting an invalid value
        if (isNaN(time) || time === -Infinity || time === Infinity) {
          throw new Error('Can only set time to a finite number');
        }

        var listener = [time, callback];

        this._timeListeners.set(listener, [this._nullTimeoutID, NaN, true]);

        this._recalculateTimeListener(listener); // Method chaining


        return this;
      }
      /**
       * Attaches a time listener which fires every time the specified clock time has passed.
       */

    }, {
      key: "alwaysAt",
      value: function alwaysAt(time, callback) {
        // Do not allow setting an invalid value
        if (isNaN(time) || time === -Infinity || time === Infinity) {
          throw new Error('Can only set time to a finite number');
        }

        var listener = [time, callback];

        this._timeListeners.set(listener, [this._nullTimeoutID, NaN, false]);

        this._recalculateTimeListener(listener); // Method chaining


        return this;
      }
      /**
       * Detaches a previously attached time listener. If multiple listeners match, all are removed.
       */

    }, {
      key: "removeAt",
      value: function removeAt(time, callback) {
        // Track whether we removed anything
        var hasRemoved = false; // Loop over all listeners

        var _iterator3 = _createForOfIteratorHelper(this._timeListeners.keys()),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var listener = _step3.value;

            var _listener2 = _slicedToArray(listener, 2),
                listenerTime = _listener2[0],
                listenerCallback = _listener2[1];

            if (listenerTime === time && listenerCallback === callback) {
              // Cancel the timeout
              var listenerData = this._timeListeners.get(listener);

              if (listenerData) {
                clearTimeout(listenerData[0]);
              } // Remove the listener


              this._timeListeners["delete"](listener); // We have removed at least one listener


              hasRemoved = true;
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }

        if (!hasRemoved) {
          // When not found, throw an error
          throw new Error('Time listener not found');
        } // Method chaining


        return this;
      } // Getters

      /**
       * The current clock time.
       */

    }, {
      key: "time",
      get: function get() {
        var currentTime = this._previousTime; // If running, the time is has changed since the previous time so we recalculate it

        if (this._running) {
          // Calculate current time based on passed time
          currentTime += this._rate * (this._now() - this._previousNow);
        } // Can we loop (loop enabled + a non-zero non-finite maximum)


        if (this._loop && this._minimum > -Infinity && this._maximum < Infinity) {
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
      ,
      // Setters

      /**
       * Sets the current clock time.
       */
      set: function set(time) {
        // Do not allow setting an invalid value
        if (isNaN(time) || time === -Infinity || time === Infinity) {
          throw new Error('Can only set time to a finite number');
        } // Only act if the time is different
        // Note: If time is changing, it is always assumed to be different


        var currentTime = this.time;

        if (!(!this._running || this._rate === 0.0 || !this._loop && (this._rate < 0 && currentTime === this._minimum || this._rate > 0 && currentTime === this._maximum)) || time !== currentTime) {
          // Recalibrate by setting both correct time and now
          this._previousTime = Math.min(Math.max(this._minimum, time), this._maximum);
          this._previousNow = this._now(); // Recalculate time listeners

          this._recalculateTimeListeners(); // Trigger event listeners


          this.trigger('settime');
        }
      }
      /**
       * Starts or stops running the clock.
       */

    }, {
      key: "running",
      get: function get() {
        return this._running;
      }
      /**
       * The current rate (relative to real time) the clock runs at.
       */
      ,
      set: function set(running) {
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

    }, {
      key: "rate",
      get: function get() {
        return this._rate;
      }
      /**
       * The minimum limit for time on the clock.
       */
      ,
      set: function set(rate) {
        // Do not allow setting an invalid value
        if (isNaN(rate) || rate === -Infinity || rate === Infinity) {
          throw new Error('Can only set rate to a finite number');
        } // Only act if the rate is different


        if (rate !== this._rate) {
          // Recalibration is only needed when we're running
          if (this._running) {
            this._previousTime = this.time;
            this._previousNow = this._now();
          } // Set rate


          this._rate = rate; // Recalculate time listeners

          this._recalculateTimeListeners(); // Trigger event listeners


          this.trigger('setrate');
        }
      }
      /**
       * Sets minimum limit for time on the clock.
       */

    }, {
      key: "minimum",
      get: function get() {
        return this._minimum;
      }
      /**
       * The maximum limit for time on the clock.
       */
      ,
      set: function set(minimum) {
        // Do not allow setting an invalid value
        if (minimum > this._maximum || isNaN(minimum) || minimum === Infinity) {
          throw new Error('Cannot set minimum above maximum');
        } // Only act if the minimum is different


        if (minimum !== this._minimum) {
          // First get the calculated time, calculated using the old minimum
          var previousTime = this.time; // Change the minimum

          this._minimum = minimum; // Recalibrate the time using the previous value and the new minimum

          this._previousTime = Math.min(Math.max(this._minimum, previousTime), this._maximum);
          this._previousNow = this._now(); // Recalculate time listeners

          this._recalculateTimeListeners(); // Trigger event listeners


          this.trigger('setminimum');
        }
      }
      /**
       * Sets maximum limit for time on the clock.
       */

    }, {
      key: "maximum",
      get: function get() {
        return this._maximum;
      }
      /**
       * Whether the clock will loop around after reaching the maximum.
       */
      ,
      set: function set(maximum) {
        // Do not allow setting an invalid value
        if (maximum < this._minimum || isNaN(maximum) || maximum === -Infinity) {
          throw new Error('Cannot set maximum below minimum');
        } // Only act if the maximum is different


        if (maximum !== this._maximum) {
          // First get the calculated time, calculated using the old maximum
          var previousTime = this.time; // Change the maximum

          this._maximum = maximum; // Recalibrate the time using the previous value and the new maximum

          this._previousTime = Math.min(Math.max(this._minimum, previousTime), this._maximum);
          this._previousNow = this._now(); // Recalculate time listeners

          this._recalculateTimeListeners(); // Trigger event listeners


          this.trigger('setmaximum');
        }
      }
      /**
       * Sets whether the clock loops around after reaching the maximum.
       */

    }, {
      key: "loop",
      get: function get() {
        return this._loop;
      },
      set: function set(loop) {
        // Only act if looping is different
        if (loop !== this._loop) {
          // Recalibrate
          this._previousTime = this.time;
          this._previousNow = this._now(); // Set looping

          this._loop = loop; // Recalculate time listeners

          this._recalculateTimeListeners(); // Trigger event listeners


          this.trigger('setloop');
        }
      }
    }]);

    return VirtualClock;
  }();

  _exports["default"] = VirtualClock;
  _exports["default"].default = _exports["default"];
  return _exports["default"];
});
//# sourceMappingURL=virtual-clock.js.map