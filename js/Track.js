(function(){

  var Track = Backbone.Model.extend({

    // default params
    defaults: {
      muted: false,
      _muted: false,
      soloed: false
    },

    // get things started
    initialize: function(){
      var ac = this.get('context');
      this.regions = new RegionList;
      this.set('input', ac.createGain());
      this.set('mute', ac.createGain());
      this.set('_mute', ac.createGain());
      this.set('gain', ac.createGain());
      this.connect();
    },

    // connect all of our nodes
    connect: function(){
      this.get('input').connect(this.get('mute'));
      this.get('mute').connect(this.get('_mute'));
      this.get('_mute').connect(this.get('output'));
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
    }
    
  });

  window.Track = Track;

}());