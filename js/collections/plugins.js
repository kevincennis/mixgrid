App.module("Collections", function(Collections, App, Backbone, Marionette, $, _) {
  Collections.Plugins = Backbone.Collection.extend({

    model: App.Models.Plugin,

    params: {},

    connect: function( ac ){
      var input = this.input
        , output = ac.createGain()
        , last = this.input
        , next;
      this.forEach(function( plugin ){
          plugin.createEffect( ac );
      });
      this.setAllParams();
      this.forEach(function( plugin, i, plugins ){
          if ( i == 0 ){
            input.connect(plugin.get('plugin').input);
          }
          if ( i == plugins.length - 1 ){
            next = output;
          } else {
            next = plugins[i + 1].get('plugin').input;
          }
          plugin.connect(next);
      });
      this.output = output;
      return this;
    },

    // set a single param on a plugin intance
    setParam: function( name, param, val ){
      var plugin = this.findWhere({name: name});
      this.params[name][param] = val;
      plugin.setParam(param, val);
      return this;
    },

    // set a multiple params on a plugin intance
    setParams: function( name, params ){
      var key;
      for ( key in params ){
        this.setParam(name, params[key]);
      }
      return this;
    },

    // set multiple params on multiple plugins
    setAllParams: function(){
      var plugins = this.params, key, plugin;
      for ( key in plugins ){
        plugin = this.findWhere({name: key});
        plugin.setParams(plugins[key]);
      }
      return this;
    },

    // get a single param from a plugin instance
    getParam: function( name, param ){
      var plugin = this.findWhere({name: name})
        , value = plugin.getParam(param);
      this.params[name] = value;
      return plugin.getParam(param);
    },

    // get all params from a plugin instance
    getParams: function( name ){
      var plugin = this.findWhere({name: name})
        , values = plugin.getParams();
      this.params[name] = values;
      return values;
    },

    // get all params for all plugin instances
    getAllParams: function(){
      var result = {};
      this.forEach(function( plugin ){
        result[plugin.get('name')] = plugin.getParams();
      });
      this.params = result;
      return result;
    }

  });
});