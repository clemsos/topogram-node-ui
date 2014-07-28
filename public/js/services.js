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

        /*
        * Given an index,a term, give count and results.
        *
        * Returns a promise.
        */
        var search = function(index,term) {
          var deferred = $q.defer();
          client.search({
            // explain: true,
            version:true,
            // stats :
            q: term,
            size:10,
            index:index,
            type : 'tweet',
            body: {
                "facets" : {
                    "histogram" : {
                        "date_histogram" : {
                            "key_field" : "created_at",
                            "interval" : "hour"
                        }
                    }
                }}
          }
          ).then(function (result) {
              var ii = 0, hits_in, hits_out = [];
                hits_in = (result.hits || {}).hits || [];
                for(;ii < hits_in.length; ii++){
                    hits_out.push(hits_in[ii]._source);
                }
                
                console.log(result);
                console.log(deferred);
                console.log(client);

                deferred.resolve({
                  "tweets":hits_out,
                  "total":result.hits.total ,
                  "histogram":result.facets.histogram.entries
                });
          }, deferred.reject);
          return deferred.promise;
        }

        /**
         * Given an index, a term and an offset, load another round of 10 results.
         *
         * Returns a promise.
         */
        var loadMore = function(index, term, offset){
            var deferred = $q.defer();
            var query = {
                "match": {
                    "_all": term
                }
            };

            client.search({
                "index": index,
                "type": 'tweet',
                q: term,
                "body": {
                    "size": 10,
                    "from": (offset || 0) * 10
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

        /**
         * Given nothing.
         *
         * Returns a list of indices.
         */
        var indexes = function(callback){
          var deferred = $q.defer();

          client.indices.getAliases(function(err,resp) {
            if (err) {
                console.log(err);
                return err;
            } else {
              var indices=[];
              for(var index in resp){
                   indices.push(index);
              }
              callback(indices);
            }
          });
        }

        return {
            "search": search,
            "loadMore": loadMore,
            "indexes" :indexes
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