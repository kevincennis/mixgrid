App.module("Collections", function(Collections, App, Backbone, Marionette, $, _) {
  Collections.Tracks = Backbone.Collection.extend({
    model: App.Models.Track,

    // begin playback of all tracks
    play: function(){
      return this.forEach(function(track){
        track.play();
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
    },

    connectAll: function(){
      this.forEach(function( track ){
        track.set('output', track.get('mix').get('input'));
        track.connect();
      });
    },

    toJSON: function(){
      var result = [];
      this.forEach(function( track ){
        result.push(track.toJSON());
      });
      return result;
    }

  });
});
