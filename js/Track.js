(function(){

  var Track = Backbone.Model.extend({

    // default params
    defaults: {
      muted: false,
      _muted: false,
      soloed: false,
      recording: false
    },

    // get things started
    initialize: function(){
      var ac = this.get('context');
      this.regions = new RegionList;
      this.set('input', ac.createGain());
      this.set('mute', ac.createGain());
      this.set('_mute', ac.createGain());
      this.set('gain', ac.createGain());
      this.get('mix').on('pause', function(){
        this.get('recording') && this.recordStop();
      }.bind(this));
      this.connect();
    },

    // connect all of our nodes
    connect: function(){
      this.get('input').connect(this.get('mute'));
      this.get('mute').connect(this.get('_mute'));
      this.get('_mute').connect(this.get('gain'));
      this.get('gain').connect(this.get('output'));
      return this;
    },

    // begin playback of all regions
    // 
    // @param {Number} now [schedule time... usually AudioContext.currentTime]
    // @param {Number} mixOffset [mix playback position]
    play: function( now, offset ){
      this.regions.play(now, offset);
      return this;
    },

    // pause all regions
    pause: function(){
      this.regions.pause();
      return this;
    },

    // offset (in seconds) of the last playable audio, in relation 
    // to mix position 0
    maxTime: function(){
      return this.regions.maxTime();
    },

    // mute the track (user-initiated)
    mute: function(){
      if ( !this.get('muted') ){
        this.get('mute').gain.value = 0;
        this.set('muted', true);
        this.get('soloed') && this.unsolo();
      }
      return this;
    },

    // unmute the track (user-initiated)
    unmute: function(){
      if ( this.get('muted') ){
        this.get('mute').gain.value = 1;
        this.set('muted', false);
      }
      return this;
    },

    // mute the track (initiated by mix.soloMute)
    _mute: function(){
      this.get('_mute').gain.value = 0;
      return this.set('_muted', true);
    },

    // unmute the track (initiated by mix.soloMute)
    _unmute: function(){
      this.get('_mute').gain.value = 1;
      return this.set('_muted', false);
    },

    // solo the track
    solo: function(){
      this.connect();
      this.unmute();
      this._unmute();
      this.set('soloed', true);
      this.get('mix').soloMute();
      return this;
    },

    // unsolo the track
    unsolo: function(){
      this.set('soloed', false);
      this.get('mix').soloMute();
      return this;
    },

    // start recording
    record: function(){
      var ac = this.get('context')
        , mix = this.get('mix')
        , stream = mix.get('recStream')
        , src = ac.createMediaStreamSource(stream)
        , channels = src.channelCount
        , pro = ac.createScriptProcessor(2048, channels, 1);
      src.connect(pro);
      pro.connect(ac.destination);
      this.set({
        processor: pro,
        recBuffers: [],
        recLength: 0,
        recording: true,
        recordStart: mix.getPosition()
      });
      pro.onaudioprocess = function( evt ){
        var inp = evt.inputBuffer
          , ch = inp.getChannelData(0)
          , f32 = new Float32Array(ch.length)
          , recLength = this.get('recLength');
        if ( this.get('recording') ){
          f32.set(ch);
          this.get('recBuffers').push(f32);
          this.set('recLength', recLength + f32.length);
        } else {
          pro.onaudioprocess = null;
          pro = null;
        }
      }.bind(this);
      !mix.get('playing') && mix.play();
      mix.trigger('recordStart');
      return this.trigger('recordStart');
    },

    recordStop: function(){
      var ac = this.get('context')
        , arrBuffer = this.mergeRecBuffers()
        , audioBuffer = ac.createBuffer(1, arrBuffer.length, ac.sampleRate);
      audioBuffer.getChannelData(0).set(arrBuffer);
      this.createRegion(audioBuffer);
      this.set('recBuffers', []);
      this.set('recLength', 0);
      this.set('recording', false);
      this.get('mix').trigger('recordStop');
      return this.trigger('recordStop');
    },

    mergeRecBuffers: function(recBuffers, recLength){
      var recBuffers = this.get('recBuffers')
        , recLength = this.get('recLength')
        , result = new Float32Array(recLength)
        , offset = i = 0;
      for ( ; i < recBuffers.length; i++ ){
        result.set(recBuffers[i], offset);
        offset += recBuffers[i].length;
      }
      return result;
    },

    createRegion: function( audioBuffer ){
      this.regions.add({
        buffer: audioBuffer,
        context: this.get('context'),
        start: this.get('recordStart'),
        output: this.get('input'),
        mix: this.get('mix')
      });
    }
    
  });

  window.Track = Track;

}());