(function(){

  var ac = new webkitAudioContext()
    , mix = new Mix({context: ac})
    , mixURL = 'tracks.json';

  // grab some JSON
  function fetchMixData(){
    $.getJSON(mixURL, function( data ){
      createTracks( data, function(){
        drawMix();
        mix.play();
      });
    });
  }

  // create our tracks and add them to the mix
  function createTracks( tracks, callback ){
    var loaded = 0;
    tracks.forEach(function( trackData ){
      var track = new Track({
        name: trackData.name, 
        context: mix.get('context'),
        output: mix.get('input'),
        mix: mix
      });
      mix.tracks.add(track);
      createRegions( track, trackData.regions, function(){
        loaded++;
        if ( loaded == tracks.length ) callback();
      });
    });
  }

  // create our regions and add them to a track
  function createRegions( track, regions, callback ){
    var loaded = 0;
    regions.forEach(function( regionData ){
      var xhr = new XMLHttpRequest();
      xhr.open('GET', regionData.url, true);
      xhr.responseType = 'arraybuffer';
      xhr.addEventListener('load', function(){
        ac.decodeAudioData(xhr.response, function( buffer ){
          regionData.context = track.get('context');
          regionData.buffer = buffer;
          regionData.output = track.get('input');
          regionData.mix = track.get('mix');
          track.regions.add(regionData);
          loaded++;
          if ( loaded == regions.length ) callback();
        });
      }, false);
      xhr.send();
    });
  }

  // quick and dirty track layout so i can 
  // see what the fuck i'm doing
  function drawMix(){
    var pps = 20;
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

  // doooo ittttttt
  fetchMixData();

  // expose the mix Model so we can fuck with it in the console
  window.mix = mix;

  // "instructions"
  console.log('play: mix.play()');
  console.log('pause: mix.pause()');
  console.log('set playback position: mix.set(\'position\', 20)');
  console.log('mute: mix.tracks.findWhere({name: \'Rhythm_1\'}).mute()');
  console.log('unmute: mix.tracks.findWhere({name: \'Rhythm_1\'}).unmute()');
  console.log('slice left: mix.tracks.findWhere({name: \'Rhythm_1\'}).regions.models[0].set(\'startOffset\', 30)');
  console.log('slice right: mix.tracks.findWhere({name: \'Rhythm_1\'}).regions.models[0].set(\'stopOffset\', 20)');
  console.log('start position: mix.tracks.findWhere({name: \'Rhythm_1\'}).regions.models[0].set(\'start\', 10)');

}());