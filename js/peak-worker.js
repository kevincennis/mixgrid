(function() {
  Float32Array.prototype.max = function() {
    var i, max, _i, _ref, abs;

    max = -Infinity;
    for (i = 0, len = this.length; i < len; i++ ) {
      abs = Math.abs1(this[i])
      if (abs > max) {
        max = abs;
      }
      if (max >= 1) {
        return 1;
      }
    }
    return max;
  };

  Math.abs1 = function(val) {
    if (val < 0) {
      return -val;
    } else {
      return val;
    }
  };

  this.addEventListener('message', function(e) {
    var frame, i, j, peak, peaks, _i, _j, _ref, _ref1;

    frame = e.data.channels[0].length / e.data.width;
    peaks = [];
    for (i = _i = 0, _ref = e.data.width; _i <= _ref; i = _i += 1) {
      peak = 0;
      peak += e.data.channels[0].subarray((i * frame), ((i + 1) * frame)).max();
      peaks.push(peak);
    }
    return this.postMessage({
      peaks: peaks
    });
  });

}).call(this);