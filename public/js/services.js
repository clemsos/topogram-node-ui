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
      $resource("/memes",{ }, {
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
      $resource("/api/geo/info",{ }, {
        getData: {method:'GET', isArray: false}
      }),
      "ratio":
      $resource("/api/geo/ratio",{ }, {
        getData: {method:'GET', isArray: false}
      })

  }
});


/**
 * Create a service to power calls to Elasticsearch. We only need to
 * use the search endpoint.
 */
app.factory('searchService',
    ['$q', 'esFactory', '$location', function($q, elasticsearch, $location){
        var client = elasticsearch({
            host: $location.host() + ":9200"
        });


        /**
         * Given a term and an offset, load another round of 10 results.
         *
         * Returns a promise.
         */
        var search = function(term, offset){
            var deferred = $q.defer();
            var query = {
                "match": {
                    "_all": term
                }
            };

            client.search({
                "index": 'weiboscope_39_40',
                "type": 'tweet',
                "body": {
                    "size": 10,
                    "from": (offset || 0) * 10,
                    "query": query
                }
            }).then(function(result) {
              
                var ii = 0, hits_in, hits_out = [];
                hits_in = (result.hits || {}).hits || [];
                for(;ii < hits_in.length; ii++){
                    hits_out.push(hits_in[ii]._source);
                }

                deferred.resolve({
                  "tweets":hits_out,
                  "total":result.hits.total
                });

            }, deferred.reject);
            return deferred.promise;
        };

        /*
        * Given a term, count results.
        *
        * Returns a promise.
        */
        // var count = function(term) {

        //   var deferred = $q.defer();
        //   client.search({
        //     "index": 'weiboscope_39_40',
        //     "type" : 'tweet',
        //     "body": {
        //       "query" : {
        //         "match": {
        //             text: term
        //         }
        //       }
        //     }
        //   }).then(function (result) {
        //       // console.log(result);
        //       // D3 code goes here.
        //       // deferred.resolve("ha");
        //   }, deferred.reject);
        
        //   return deferred.promise;

        // }

        return {
            "search": search
            // "count": count
        };
    }]
);


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