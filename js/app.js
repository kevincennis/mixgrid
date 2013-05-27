App = new Backbone.Marionette.Application();

App.on("start", function(options) {
  var mixURL = options.mixURL
    , ac = new webkitAudioContext()
    , mix = new App.Models.Mix({context: ac, bpm: options.bpm})
    , downloader = new Downloader(getInput);

  // grab some JSON
  function fetchMixData(){
    $.getJSON(mixURL, function( data ){
      createTracks(data);
    });
  }

  // create our tracks and add them to the mix
  function createTracks( tracks ){
    tracks.forEach(function( trackData ){
      var track = new App.Models.Track({
        name: trackData.name,
        volume: trackData.volume,
        output: mix.get('input'),
        collection: mix.tracks,
        mix: mix
      });
      mix.tracks.add(track);
      createRegions(track, trackData.regions);
    });
  }

  // create our regions and add them to a track
  function createRegions( track, regions ){
    if ( !regions.length ) callback();
    regions.forEach(function( regionData ){
      var callback, xhr = new XMLHttpRequest();
      xhr.open('GET', regionData.url, true);
      xhr.responseType = 'arraybuffer';
      callback = function( downloaderCallback ){
        ac.decodeAudioData(xhr.response, function( buffer ){
          regionData.buffer = buffer;
          regionData.output = track.get('input');
          regionData.mix = track.get('mix');
          track.regions.add(regionData);
          downloaderCallback();
        });
      }
      downloader.add(xhr, callback, true);
    });
  }

  // quick and dirty track layout so i can
  // see what the fuck i'm doing
  function drawMix(){
    var pps = 20;
    $('section').remove();
    mix.tracks.forEach(function( track ){
      var $section = $('<section/>').appendTo('body');
      track.regions.forEach(function( region ){
        var $div = $('<div/>').appendTo($section);
        region.on('change', function(){
          var start = region.get('start')
            , length = region.get('activeBuffer').duration;
          $div.css({left: start * pps, width: length * pps});
        });
        region.trigger('change');
      });
    });
    drawScrubber();
  }

  // draw the scrubber bar
  function drawScrubber(){
    var pps = 20
      , $scrubber = $('#scrubber')
      , left = mix.get('position');
    if ( !$scrubber.length ) {
      $scrubber = $('<span id="scrubber"/>').appendTo('body');
    }
    $scrubber.css('left', left * pps);
    requestAnimationFrame(drawScrubber)
  }

  function getInput(){
    navigator.webkitGetUserMedia({audio: true}, function(stream){
      mix.set('recStream', stream);
      setTimeout(function(){
        drawMix();
        mix.play();
      }, 100);
    }, function(){

    });
  }

  mix.on('createTrack', drawMix);
  mix.on('recordStart', drawMix);
  mix.on('recordStop', drawMix);

  // doooo ittttttt
  fetchMixData();

  // expose the mix Model so we can fuck with it in the console
  window.mix = mix;
  window.drawMix = drawMix;
  window.downloader = downloader;

  // "instructions"
  console.log('play: mix.play()');
  console.log('pause: mix.pause()');
  console.log('set playback position: mix.set(\'position\', 20)');
  console.log('mute: mix.tracks.findWhere({name: \'Rhythm_1\'}).mute()');
  console.log('unmute: mix.tracks.findWhere({name: \'Rhythm_1\'}).unmute()');
  console.log('slice left: mix.tracks.findWhere({name: \'Rhythm_1\'}).regions.models[0].set(\'startOffset\', 30)');
  console.log('slice right: mix.tracks.findWhere({name: \'Rhythm_1\'}).regions.models[0].set(\'stopOffset\', 20)');
  console.log('start position: mix.tracks.findWhere({name: \'Rhythm_1\'}).regions.models[0].set(\'start\', 10)');

});
