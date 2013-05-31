App.module("Collections", function(Collections, App, Backbone, Marionette, $, _) {
  Collections.Regions = Backbone.Collection.extend({

    model: App.Models.Region,
    // begin playback of all regions
    play: function(){
      this.forEach(function( region ){
        region.play();
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
    },

    toJSON: function(){
      var result = [];
      this.forEach(function( region ){
        result.push(region.toJSON());
      });
      return result;
    }

  });
});
