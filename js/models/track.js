App.module("Models", function(Models, App, Backbone, Marionette, $, _) {
  Models.Track = Backbone.Model.extend({
    // default params
    defaults: {
      muted: false,
      _muted: false,
      soloed: false,
      recording: false,
      volume: 0.5,
      dBFS: -192,
      pluginTypes: {
        'compressor': 'Compressor',
        'chorus':     'Chorus',
        'tremolo':    'Tremolo',
        'delay':      'Delay',
        'reverb':     'Convolver'
      },
      pluginParams: {
        compressor: {
          bypass: 1,
          threshold: -20,
          release: 250,
          makeupGain: 1,
          attack: 1,
          ratio: 4,
          knee: 5,
          automakeup: false
        },
        chorus: {
          bypass: 1,
          feedback: 0.4,
          delay: 0.0045,
          depth: 0.7,
          rate: 1.5
        },
        tremolo: {
          bypass: 1,
          intensity: 0.3,
          stereoPhase: 0,
          rate: 5
        },
        delay: {
          bypass: 1,
          delayTime: 100,
          feedback: 0.45,
          cutoff: 20000,
          wetLevel: 0.5,
          dryLevel: 1
        },
        reverb: {
          bypass: 1,
          highCut: 22050,
          lowCut: 20,
          dryLevel: 1,
          wetLevel: 1,
          impulse: 'impulses/plate.wav',
        }
      }
    },

    // get things started
    initialize: function(){
      var pluginParams = this.get('pluginParams')
        , defaults = $.extend(true, {}, this.defaults.pluginParams);
      pluginParams = $.extend(true, {}, defaults, pluginParams);
      this.set('pluginParams', pluginParams);
      this.regions = new App.Collections.Regions;
      this.plugins = new App.Collections.Plugins;
      this.plugins.params = this.get('pluginParams');
      this.createPlugins();
      this.connect();
      this.on('change:volume', function(){
        this.get('gain').gain.value = this.get('volume');
      });
    },

    // connect all of our nodes
    connect: function(){
      var ac = this.context()
        , mix = this.get('mix')
        , meter = new Meter(ac);
      this.set({
        input: ac.createGain(),
        mute: ac.createGain(),
        _mute: ac.createGain(),
        gain: ac.createGain(),
        meter: meter
      });
      this.plugins.input = this.get('input');
      this.plugins.connect( ac );
      this.plugins.output.connect(this.get('mute'));
      this.get('mute').connect(this.get('_mute'));
      this.get('_mute').connect(this.get('gain'));
      this.get('gain').connect(this.get('meter').input);
      this.get('gain').connect(this.get('output'));
      this.get('mix').on('pause', function(){
        this.get('recording') && this.recordStop();
      }.bind(this));
      this.get('meter').ondBFS(function( dBFS ){
        this.set('dBFS', dBFS);
      }.bind(this));
      this.regions.forEach(function( region ){
        var src;
        region.set('output', this.get('input'));
        region.sliceBuffer();
        region.createBufferSource();
        src = region.get('src');
        src.connect(this.get('input'));
      }.bind(this));
      if ( this.get('muted') ) this.mute();
      if ( this.get('_muted') ) this._mute();
      if ( this.get('soloed') ) this.solo();
      this.get('gain').gain.value = this.get('volume');
      this.setAllPluginParams();
      return this;
    },

    context: function(){
      return this.get('mix').get('context');
    },

    // begin playback of all regions
    play: function(){
      this.regions.play();
      return this;
    },

    // pause all regions
    pause: function(){
      this.regions.pause();
      return this;
    },

    // offset (in seconds) of the last playable audio, in relation
    // to mix position 0
    maxTime: function(){
      return this.regions.maxTime();
    },

    // mute the track (user-initiated)
    mute: function(){
      this.get('mute').gain.value = 0;
      this.set('muted', true);
      this.get('soloed') && this.unsolo();
      return this;
    },

    // unmute the track (user-initiated)
    unmute: function(){
      this.get('mute').gain.value = 1;
      this.set('muted', false);
      return this;
    },

    // mute the track (initiated by mix.soloMute)
    _mute: function(){
      this.get('_mute').gain.value = 0;
      return this.set('_muted', true);
    },

    // unmute the track (initiated by mix.soloMute)
    _unmute: function(){
      this.get('_mute').gain.value = 1;
      return this.set('_muted', false);
    },

    // solo the track
    solo: function(){
      this.unmute();
      this._unmute();
      this.set('soloed', true);
      this.get('mix').soloMute();
      return this;
    },

    // unsolo the track
    unsolo: function(){
      this.set('soloed', false);
      this.get('mix').soloMute();
      return this;
    },

    // start recording
    record: function(){
      var ac = this.context()
        , mix = this.get('mix')
        , stream = mix.get('recStream')
        , src , channels, pro;
      // no mic input? ask nicely
      if ( !mix.get('inputEnabled') || !stream ) {
        return mix.requestInput();
      }
      src = ac.createMediaStreamSource(stream)
      channels = src.channelCount
      pro = ac.createScriptProcessor(2048, channels, 1);
      src.connect(pro);
      pro.connect(ac.destination);
      this.set({
        processor: pro,
        recBuffers: [],
        recLength: 0,
        recording: true,
        recordStart: mix.getPosition()
      });
      pro.onaudioprocess = function( evt ){
        var inp = evt.inputBuffer
          , ac = this.context()
          , ch = inp.getChannelData(0)
          , f32 = new Float32Array(ch.length)
          , recLength = this.get('recLength')
          , buffer = ac.createBuffer(1, ch.length, ac.sampleRate);
        if ( this.get('recording') ){
          f32.set(ch);
          buffer.getChannelData(0).set(f32);
          this.get('recBuffers').push(f32);
          this.set('recLength', recLength + f32.length);
          this.trigger('stream', buffer);
        } else {
          pro.onaudioprocess = null;
          pro = null;
        }
      }.bind(this);
      !mix.get('playing') && mix.play();
      mix.trigger('recordStart');
      return this.trigger('recordStart');
    },

    recordStop: function(){
      var ac = this.context()
        , arrBuffer = this.mergeRecBuffers()
        , audioBuffer = ac.createBuffer(1, arrBuffer.length, ac.sampleRate);
      audioBuffer.getChannelData(0).set(arrBuffer);
      this.createRegion(audioBuffer);
      this.set('recBuffers', []);
      this.set('recLength', 0);
      this.set('recording', false);
      this.get('mix').trigger('recordStop');
      return this.trigger('recordStop');
    },

    mergeRecBuffers: function(recBuffers, recLength){
      var recBuffers = this.get('recBuffers')
        , recLength = this.get('recLength')
        , result = new Float32Array(recLength)
        , offset = i = 0;
      for ( ; i < recBuffers.length; i++ ){
        result.set(recBuffers[i], offset);
        offset += recBuffers[i].length;
      }
      return result;
    },

    createRegion: function( audioBuffer ){
      this.regions.add({
        buffer: audioBuffer,
        start: this.get('recordStart'),
        output: this.get('input'),
        track: this,
        mix: this.get('mix')
      });
    },

    // add a new region instance to the track
    paste: function( region ){
      this.regions.add(region);
    },

    // set an individual plugin param
    setPluginParam: function( plugin, param, val ){
      this.get('pluginParams')[plugin][param] = val;
      this.plugins.setParam(plugin, param, val);
      return this;
    },

    // set mutliple params on a single plugin
    setPluginParams: function( plugin, params ){
      var key;
      for ( key in params ){
        this.setPluginParam(plugin, key, params[key]);
      }
      return this;
    },

    // set all stored params on every plugin
    setAllPluginParams: function(){
      var params = this.get('pluginParams'), key;
      for ( key in params){
        this.setPluginParams(key, params[key]);
      }
      return this;
    },

    // get a single plugin param
    getPluginParam: function( plugin, param ){
      return this.plugins.getParam(plugin, param);
    },

    // get all params for a single plugin
    getPluginParams: function( plugin ){
      return this.plugins.getParams(plugin);
    },

    // get all params for every plugin
    getAllPluginParams: function(){
      return this.plugins.getAllParams();
    },

    // create a single plugin
    createPlugin: function( name, type ){
      var params = this.get('pluginParams')[name] || {};
      this.plugins.add({
        name: name,
        type: type,
        params: params
      });
    },

    // create all plugins
    createPlugins: function(){
      var types = this.get('pluginTypes'), key;
      for ( key in types ){
        this.createPlugin(key, types[key]);
      }
    },

    toJSON: function(){
      return {
        name: this.get('name'),
        muted: this.get('muted'),
        _muted: this.get('_muted'),
        soloed: this.get('soloed'),
        volume: this.get('volume'),
        pluginParams: this.getAllPluginParams(),
        regions: this.regions.toJSON()
      }
    }

  });

});
