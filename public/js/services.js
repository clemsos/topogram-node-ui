// services.js

app.factory('config', function($window) {
    return new Config();
});


app.factory('dataService', function() {
    return {

      "users" : { nodes:[],edges:[]},
      "words" : { nodes:[],edges:[]},
      "geo"   : [],
      "wordProvinces": [],
      "trigger": 0

    };
});

app.factory('memeService', function($resource) {
  return {
    "list":
      $resource("/list",{ }, {
        getData: {method:'GET', isArray: false}
      })
    }
});

app.factory('geoService', function($resource) {
  return {
    "mainland":
      $resource("maps/zh-mainland-provinces.topo.json",{ }, {
        getData: {method:'GET', isArray: false}
      }),
    "taiwan":
      $resource("maps/zh-chn-twn.topo.json",{ }, {
        getData: {method:'GET', isArray: false}
      }),
    "hkmacau":
      $resource("maps/zh-hkg-mac.topo.json",{ }, {
        getData: {method:'GET', isArray: false}
      }),
    "info":
      $resource("info",{ }, {
        getData: {method:'GET', isArray: false}
      }),
      "ratio":
      $resource("ratio",{ }, {
        getData: {method:'GET', isArray: false}
      })

  }
});

/*
app.factory('socket', function ($rootScope) {
    
    var socket = io.connect();
    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {  
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          console.log(args)

          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      },
      disconnect: function () {
        socket.disconnect();
      },
      socket: socket

    };
  });
  */