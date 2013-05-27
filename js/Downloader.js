(function(){

  // Rate-limit xhr so that there are no more than
  // {Mix.simultaneous} happening at a time
  

  // @param {Function} callback [function to fire when all xhrs have been completed]
  // @param {Number} max [maximum number of simultaneous xhrs]
  var Downloader = function( callback, max ){
    this.callback = callback || function(){};
    this.total = 0;
    this.loaded = 0;
    this.loading = 0;
    this.queue = [];
    this.simultaneous = max || 3;
    this.start = Date.now();
  };

  // add an xhr to the queue
  // 
  // @param {XMLHTTPRequest} xhr [the ajax object]
  // @param {Function} callback [function to call on xhr complete]
  // @param {Boolean} async [is the provided callback asynchronous?]
  Downloader.prototype.add = function( xhr, callback, async ){
    this.total++;
    xhr.addEventListener('load', function(){
      // stuff we need to do when the xhr is done
      var asyncCallback = function(){
        this.loaded++;
        this.loading--;
        this.fetch();
      }.bind(this);
      // if the callback needs to perform an asynchronous task like
      // decoding audio data before it's truly "done", we need to
      // pass it a callback function so we know when it's done
      if ( async ){
        // release cnotrol of the UI thread in case 
        // there's anything else waiting to get done
        setTimeout(function(){
          callback(asyncCallback);
        }, 0);
      // otherwise, just invoke the callback
      } else {
        asyncCallback();
        callback();
      }
    }.bind(this));
    // add the xhr to our download queue
    this.queue.push(xhr);
    // try to send some requests
    this.fetch();
  }

  // send requests or execute our callback
  Downloader.prototype.fetch = function(){
    // are we done?
    if ( this.loaded == this.total && !this.loading ){
      return this.callback();
    }
    // are we at capacity?
    if ( this.loading >= this.simultaneous ){
      return;
    }
    // get some more
    while ( this.loading < this.simultaneous && this.queue.length ){
      this.loading++;
      this.queue.pop().send();
    }
  }

  window.Downloader = Downloader;

}());