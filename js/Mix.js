(function(){

  var Mix = Backbone.Model.extend({

    // default params
    defaults: {
      position: 0,
      startTime: 0,
      playing: false,
      maxTime: Infinity
    },

    // get things started
    initialize: function(){
      var ac = this.get('context');
      this.tracks = new TrackList;
      this.updatePosition();
      this.set('input', ac.createGain());
      this.get('input').connect(ac.destination);
      this.on('change:position', function(){
        this.get('playing') && this.play();
      });
    },

    // begin playback of all tracks
    play: function(){
      var now = this.acTime()
        , start = this.get('startTime')
        , position = this.get('position');
      this.set('startTime', now - position);
      this.set('maxTime', this.tracks.maxTime());
      this.tracks.play(now, position);
      return this.set('playing', true);
    },

    // pause all tracks
    pause: function(){
      this.tracks.pause()
      return this.set('playing', false);
    },

    // pause and set position back to 0
    stop: function(){
      return this.pause().set('position', 0, {silent: true});
    },

    // rewind to 0 and play
    rewind: function(){
      return this.stop().play();
    },

    // AudioContext.currentTime
    acTime: function(){
      return this.get('context').currentTime;
    },

    // update the current position of the scrubber bar (in seconds)
    updatePosition: function(){
      var now = this.acTime()
        , playing = this.get('playing')
        , start = this.get('startTime')
        , position = this.get('position')
        , delta = now - start;
      playing && this.set('position', delta, {silent: true});
      playing && delta > this.get('maxTime') && this.rewind();
      setTimeout(this.updatePosition.bind(this), 16);
    },

    // selectively apply/remove mutes depending on which tracks
    // are soloed and unsoloed
    soloMute: function(){
      var unsoloed = this.tracks.where({soloed: false})
        , soloed = this.tracks.where({soloed: true})
        , _muted = this.tracks.where({_muted: true})
        , muted = this.tracks.where({muted: true});
      // apply _mute to non-soloed tracks
      if ( soloed.length ){
        unsoloed.forEach(function( track ){
          track._mute();
        });
      }
      // remove _mute when nothing is soloed
      if ( !soloed.length ){
        _muted.forEach(function( track ){
          track._unmute();
        });
      }
    }
    
  });

  window.Mix = Mix;

}());