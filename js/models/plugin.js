App.module("Models", function(Models, App, Backbone, Marionette, $, _) {
  Models.Plugin = Backbone.Model.extend({

    defaults: {
      params: {},
      plugin: {}
    },

    createEffect: function( ac ){
      var tuna = new Tuna(ac)
        , type = this.get('type')
        , params = this.get('params')
        , plugin = new tuna[type](params)
        , output = this.get('output');
      this.set({
        tuna: tuna,
        plugin: plugin
      });
      this.setParams();
      return this;
    },

    connect: function( node ){
      var plugin = this.get('plugin');
      plugin.connect(node);
    },

    // set an individual effect param
    setParam: function( param, val ){
      this.get('plugin')[param] = val;
      this.get('params')[param] = val;
      return this;
    },

    // set multiple params
    setParams: function( params ){
      var key;
      for ( key in params ){
        this.setParam(key, params[key]);
      }
      return this;
    },

    // get the value of a single param
    getParam: function( param ){
      var params = this.get('params')
        , val = params[param];
      return val;
    },

    // get ALL param values
    getParams: function(){
      var params = this.get('params')
        , result = {}
        , key
      for ( key in params ){
        result[key] = params[key];
      }
      return result;
    }

  });
});