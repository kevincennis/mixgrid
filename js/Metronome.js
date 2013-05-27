(function(){

  var Metronome = function( ac, bpm ){
    this.ac = ac;
    this.setBpm( bpm );
  };

  Metronome.prototype.createBuffer = function(){
    var i = 0
      , sr = this.ac.sampleRate
      , len = this.getBeatLength() * sr
      , f32 = new Float32Array(len);
    while ( i < 1000 && i < len )
      f32[i++] = ( Math.random() * 2 ) - 1;
    return f32;
  };

  Metronome.prototype.start = function( offset ){
    var beatLength = this.getBeatLength(), start;
    this.stop();
    this.src = this.ac.createBufferSource();
    this.src.buffer = this.audioBuffer;
    this.src.loop = true;
    this.src.connect(this.ac.destination);
    start = offset == 0 ? 0 : beatLength - ( offset ? offset % beatLength : 0 );
    this.src.start( this.ac.currentTime + start );
  };

  Metronome.prototype.stop = function(){
    this.src && this.src.stop(0);
  };

  Metronome.prototype.getBeatLength = function(){
    return 60 / this.bpm;
  };

  Metronome.prototype.setBpm = function( bpm ){
    var sr = this.ac.sampleRate, len;
    this.bpm = bpm || 120;
    this.buffer = this.createBuffer();
    len = this.buffer.length;
    this.audioBuffer = this.ac.createBuffer(1, len, sr);
    this.audioBuffer.getChannelData(0).set(this.buffer);
  };

  window.Metronome = Metronome;

}());