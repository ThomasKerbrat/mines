
/**
 * Timer constructor function.
 * Manage a timer with play/pause/resume capabilities.
 */
function Timer() {
    this.isPaused = true;
    this.value = 0;

    this._interval = null;
    this._pauseTime = 0;

    this.onSecondChangeCallback = function () { };
}

Timer.prototype.start = function start() {
    this.value = Date.now();
    this.isPaused = false;
    var self = this;

    this._interval = setInterval(function timerInterval() {
        if (self.isPaused === true) { return; }
        var diff = new Date(Date.now() - self.value);
        try {
            self.onSecondChangeCallback(diff);
        } catch (error) {
            console.log('An error occured in the onSecondChange callback:', error);
        }
    }, 100);
};

Timer.prototype.pause = function pause() {
    this.isPaused = true;
    this._pauseTime = Date.now();
};

Timer.prototype.resume = function resume() {
    this.isPaused = false;
    this.value += Date.now() - this._pauseTime;
};

Timer.prototype.onSecondChange = function onSecondChange(callback) {
    if (typeof callback !== 'function') { throw new TypeError('callback must be a function'); }
    this.onSecondChangeCallback = callback;
};
