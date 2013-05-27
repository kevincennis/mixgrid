App.module("Collections", function(Collections, App, Backbone, Marionette, $, _) {
  Collections.Regions = Backbone.Collection.extend({
    model: App.Models.Region,
    // begin playback of all regions
    //
    // @param {Number} now [schedule time... usually AudioContext.currentTime]
    // @param {Number} mixOffset [mix playback position]
    play: function( now, offset ){
      this.forEach(function( region ){
        region.play(now, offset);
      });
    },

    // pause all regions
    pause: function(){
      this.forEach(function( region ){
        region.pause();
      });
    },

    // offset (in seconds) of the last playable audio, in relation
    // to mix position 0
    maxTime: function(){
      return Math.max.apply(Math, this.map(function( region ){
        return region.maxTime();
      }));
    }
  });
});
