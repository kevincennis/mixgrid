!function(){

  var Archiver = {
    path: '/js/ArchiverWorker.js',
    save: function( audioBuffer, filename ){
      var duration = audioBuffer.duration.toFixed(3)
        , worker = new Worker(this.path)
        , start = Date.now();
      console.log('encoding PCM to WAV.');
      console.log('buffer length: ' + duration + ' seconds.');
      worker.onmessage = function( ev ){
        var end = Date.now();
        console.log('WAV encoded in ' + (end - start) + ' ms.')
        this.forceDownload(ev.data, filename);
      }.bind(this);
      worker.postMessage({
        sampleRate: audioBuffer.sampleRate,
        buffers: this.extractBuffers(audioBuffer)
      });
    },
    extractBuffers: function( audioBuffer ){
      var leftIn = audioBuffer.getChannelData(0)
        , rightIn = audioBuffer.getChannelData(1)
        , leftOut = new Float32Array(leftIn.length)
        , rightOut = new Float32Array(rightIn.length);
      leftOut.set(leftIn);
      rightOut.set(rightIn);
      return [leftOut, rightOut];
    },
    forceDownload: function(blob, filename){
      var url = (window.URL || window.webkitURL).createObjectURL(blob)
        , link = window.document.createElement('a')
        , click = document.createEvent('Event');
      link.href = url;
      link.download = filename || 'mix.wav';
      click.initEvent('click', true, true);
      link.dispatchEvent(click);
    }
  };

  window.Archiver = Archiver;

}();