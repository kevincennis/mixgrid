(function(){

  var TrackList = Backbone.Collection.extend({

    model: Track,

    // begin playback of all tracks
    // 
    // @param {Number} now [schedule time... usually AudioContext.currentTime]
    // @param {Number} mixOffset [mix playback position]
    play: function(now, offset){
      return this.forEach(function(track){
        track.play(now, offset);
      });
    },

    // pause all tracks 
    pause: function(){
      return this.forEach(function(track){
        track.pause();
      });
    },

    // offset (in seconds) of the last playable audio, in relation 
    // to mix position 0
    maxTime: function(){
      return Math.max.apply(Math, this.map(function( track ){
        return track.maxTime();
      }));
    }
    
  });

  window.TrackList = TrackList;

}());