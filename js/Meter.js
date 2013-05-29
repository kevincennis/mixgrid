(function(){

  // calculate peaks as dBFS (-192 to 0)

  var Meter = function( ac ){
    this.ac = ac;
    this.input = ac.createScriptProcessor(512, 1, 1)
    this.input.connect(ac.destination);
    this.input.onaudioprocess = this.getdBFS.bind(this);
    this.callbacks = [];
  }

  // calculate dBFS (-192 to 0, where 0 is loudest)
  Meter.prototype.getdBFS = function( evt ){
    var input = evt.inputBuffer.getChannelData(0)
      , len = input.length   
      , total = i = 0
      , rms
      , db
    while ( i < len ) total += ( input[i] * input[i++] )
    rms = Math.sqrt( total / len );
    db = 20 * ( Math.log(rms) / Math.log(10) );
    // sanity check
    db = Math.max(-192, Math.min(db, 0));
    this.callbacks.forEach(function( callback ){
      callback(db);
    });
    return db;
  }

  // register callbacks that get passed a dBFS value
  // when onaudioprocess fires
  Meter.prototype.ondBFS = function( callback ){
    this.callbacks.push( callback );
  }

  window.Meter = Meter;

}());
