App.module("Models", function(Models, App, Backbone, Marionette, $, _) {
  Models.Region = Backbone.Model.extend({

    // get things started
    initialize: function(){
      // clone the original buffer
      this.setBuffer();
      // update start time when startOffset changes
      // and slice up a new buffer
      this.on('change:startOffset', function( evt, val ){
        var prev = this.previous('startOffset')
          , diff = prev - val
          , start = this.get('start')
          , mix = this.get('mix')
          , playing = mix.get('playing');
        this.set('start', start - diff);
        this.sliceBuffer();
        playing && mix.play();
      });
      // slice up a new buffer when stopOffset changes
      this.on('change:stopOffset', function( evt, val ){
        var mix = this.get('mix')
          , playing = mix.get('playing');
        this.sliceBuffer();
        playing && mix.play();
      });
      // slice up a new buffer when fadeIn changes
      this.on('change:fadeIn', function( evt, val ){
        var mix = this.get('mix')
          , playing = mix.get('playing');
        this.sliceBuffer();
        playing && mix.play();
      });
      // slice up a new buffer when fadeOut changes
      this.on('change:fadeOut', function( evt, val ){
        var mix = this.get('mix')
          , playing = mix.get('playing');
        this.sliceBuffer();
        playing && mix.play();
      });
      // call mix.play() after changing start time so that
      // everything important gets recalculated
      this.on('change:start', function( evt, val ){
        var mix = this.get('mix')
          , playing = mix.get('playing');
        playing && mix.play();
      });
    },

    // default values
    defaults: {
      // start position of the region, relative to mix position 0
      start: 0,
      // compared to the original buffer, where does the region start?
      startOffset: 0,
      // compared to the original buffer, where does the region stop?
      stopOffset: 0,
      // are we currently playing?
      playing: false,
      // fadeIn duration
      fadeIn: 0,
      // fadeOut duration
      fadeOut: 0
    },

    context: function(){
      return this.get('mix').get('context');
    },

    // convert samples to seconds
    samplesToTime: function( samples ){
      return samples / this.get('buffer').sampleRate;
    },

    // convert seconds to samples
    timeToSamples: function( time ){
      return time * this.get('buffer').sampleRate;
    },

    // clone the original buffer, but taking startOffset and
    // stopOffset into account - then set it as `activeBuffer`
    sliceBuffer: function(){
      var buffer = this.get('buffer')
        , channels = buffer.numberOfChannels
        , sampleRate = buffer.sampleRate
        , from = this.timeToSamples(this.get('startOffset'))
        , to = buffer.length - this.timeToSamples(this.get('stopOffset'))
        , len = to - from
        , ab = this.context().createBuffer(channels, len, sampleRate)
        , channel
        , i = 0;
      while ( i < channels ){
        channel = buffer.getChannelData(i);
        channel = channel.subarray(from, to);
        ab.getChannelData(i++).set(this.applyFades(channel));
      }
      return this.set('activeBuffer', ab);
    },

    // apply fades directly to the active buffer. yes, that seems crazy.
    // but it's actually easier to manage than linearRampToValueAtTime
    applyFades: function( arrayBuffer ){
      var fadeIn = this.timeToSamples(this.get('fadeIn'))
        , fadeOut = this.timeToSamples(this.get('fadeOut'))
        , f32 = new Float32Array(arrayBuffer.length)
        , end = f32.length - 1
        , i = o = 0;
      f32.set(arrayBuffer);
      // fade in
      while ( i < fadeIn && i < f32.length )
        f32[i] = f32[i] * ( i++ / fadeIn );
      // fade out
      while ( o < fadeOut && o < end )
        f32[end - o] = f32[end - o] * ( o++ / fadeOut );
      return f32;
    },

    // AudioBufferSource nodes are single-use only,
    // so every time we play we need to make a new one
    // from `activeBuffer`
    createBufferSource: function(){
      var src = this.context().createBufferSource();
      if ( !this.get('activeBuffer') ) this.sliceBuffer();
      src.buffer = this.get('activeBuffer');
      src.connect(this.get('output'));
      this.set('src', src);
      return this;
    },

    // begin playback of the region at the current mix position
    play: function(){
      var mix, now, mixOffset, regionStart, playbackStart, offset, duration;
      // just in case
      this.pause();
      // create a new bufferSource
      this.createBufferSource();
      // get timing info
      mix = this.get('mix');
      now = mix.acTime();
      mixOffset = mix.getPosition();
      // calculate start time, offset, and duration
      regionStart = this.get('start');
      playbackStart = Math.max(0, regionStart - mixOffset);
      offset = Math.max(0, mixOffset - regionStart);
      duration = this.get('activeBuffer').duration;
      // trying to play past the end of the region? bail
      if ( playbackStart + mixOffset > regionStart + duration ) return;
      // play it!
      this.get('src').start(now + playbackStart, offset, duration);
      this.set('playing', true);
      return this;
    },

    // pause playback
    pause: function(){
      this.get('src') && this.get('src').stop(0);
      this.set('playing', false);
      return this;
    },

    // offset (in seconds) of the last playable audio, in relation
    // to mix position 0
    maxTime: function(){
      return this.get('start') + this.get('activeBuffer').duration;
    },

    // clone the Model's buffer on init
    setBuffer: function( buffer ){
      var buffer = buffer || this.get('buffer')
        , channels = buffer.numberOfChannels
        , sampleRate = buffer.sampleRate
        , from = 0
        , to = buffer.length
        , len = to - from
        , ab = this.context().createBuffer(channels, len, sampleRate)
        , channel
        , i = 0;
      while ( i < channels ){
        channel = buffer.getChannelData(i);
        channel = channel.subarray(from, to);
        ab.getChannelData(i++).set(channel);
      }
      this.set('buffer', ab);
      return this.sliceBuffer();
    },

    // copy the entire region
    copy: function(){
      return this.clone();
    },

    // slice a region in half.
    // modifies the original region's stopOffset and the cloned
    // region's startOffset. also remove fades along the
    // split edge
    // 
    // seconds param is relative to the region's start attribute
    slice: function( seconds ){
      var clone = this.copy()
        , start = this.get('start')
        , stopOffset = this.get('stopOffset')
        , startOffset = this.get('startOffset')
        , duration = this.get('activeBuffer').duration;
      this.set({
        stopOffset: stopOffset + ( duration - seconds ),
        fadeOut: 0
      });
      clone.set({
        startOffset: startOffset + seconds,
        fadeIn: 0
      });
      this.get('track').paste(clone);

    },

    toJSON: function(){
      return {
        url: this.get('url'),
        start: this.get('start'),
        startOffset: this.get('startOffset'),
        stopOffset: this.get('stopOffset'),
        fadeIn: this.get('fadeIn'),
        fadeOut: this.get('fadeOut')
      }
    }

  });
});
