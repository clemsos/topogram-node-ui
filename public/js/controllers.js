// controllers.js

function IndexCtrl($scope, $http) {

  $http.get('/api/memes').
    success(function(data, status, headers, config) {
      $scope.posts = data.memes;
    });
}

function EditPostCtrl($scope, $http, $location, $routeParams) {
  $scope.form = {};
  $http.get('/api/meme/' + $routeParams.id).
    success(function(data) {
      $scope.form = data.post;
    });

  $scope.editPost = function () {
    $http.put('/api/meme/' + $routeParams.id, $scope.form).
      success(function(data) {
        $location.url('/readPost/' + $routeParams.id);
      });
  };
}

function DeletePostCtrl($scope, $http, $location, $routeParams) {
  $http.get('/api/meme/' + $routeParams.id).
    success(function(data) {
      $scope.post = data.post;
    });

  $scope.deletePost = function () {
    console.log('delete',$routeParams.id);
    $http.delete('/api/meme/' + $routeParams.id).
      success(function(data) {
        console.log("deleted",data);
        $location.url('/');
      });
  };

  $scope.home = function () {
    $location.url('/');
  };
}


/**
 * Search interact with the UI.
 */

app.controller('AddPostCtrl',
    ['searchService', "$http",'$scope', '$location', function(tweets, $http, $scope, $location){
        

        // Initialize the scope defaults.
        $scope.indices=[]         // list of elasticsearch indices
        $scope.tweets = [];        // An array of messages results to display
        $scope.page = 0;            // A counter to keep track of our current page
        $scope.allResults = false;  // Whether or not all results have been found.
        $scope.totalResults=0 // All tweets matching the query

        // Query term, plus a default one
        $scope.searchTerm = $location.search().q;
        $scope.index= $location.search().index;

        // default 
        $scope.title="";
        $scope.description="";
        $scope.slug="default";

        $scope.submitMeme = function (isValid) {
          console.log(isValid);
          if(isValid) {
            $scope.meme={
                "name": $scope.slug,
                "term": $scope.searchTerm,
                "index": $scope.index,
                "title": $scope.title,
                "description": $scope.description,
                "created_at" : new Date()
            };

            $http.post('/api/meme', $scope.meme).
              success(function(data) {
                $location.path('/readPost/'+data._id);
                console.log(data);
                console.log("saved");
                $('.modal.in').modal('hide') 
            });
          }
        };


        $scope.slugify = function(Text) {
            if(Text)
              $scope.slug=Text
                .toLowerCase()
                .replace(/ /g,'-')
                .replace(/[^\w-]+/g,'')
                ;
            console.log($scope.slug);
        }

        $scope.search = function(){
            $scope.page = 0;
            $scope.tweets = [];
            $scope.allResults = false;
            $location.search({'q': $scope.searchTerm,
                              "index":$scope.index}
                              );
            // $scope.loadMore();
            $scope.searchFirst();
        };

        /**
         * Load the next page of results, incrementing the page counter.
         * When query is finished, push results onto $scope.recipes and decide
         * whether all results have been returned (i.e. were 10 results returned?)
        */

        $scope.loadMore = function(){
          tweets
            .loadMore($scope.index, $scope.searchTerm, $scope.page++).then(function(results){
              if(results.tweets.length !== 10){
                  $scope.allResults = true;
              }

              var ii = 0;
              for(;ii < results.tweets.length; ii++){
                  $scope.tweets.push(results.tweets[ii]);
              }
            })
        };

        /**
         * A fresh search. Reset the scope variables to their defaults, set
         * the q query parameter.
         */
        $scope.searchFirst= function(){
          tweets.search($scope.index,$scope.searchTerm).then(function(results){

            $scope.totalResults=results.total;
            
            if(results.tweets.length !== 10){
                $scope.allResults = true;
            }

            var ii = 0;
            for(;ii < results.tweets.length; ii++){
                $scope.tweets.push(results.tweets[ii]);
            }

            
            $scope.title=$scope.searchTerm;
            
            if(results.histogram.length){
              $scope.start=results.histogram[0].time;
              $scope.end=results.histogram[results.histogram.length-1].time;
              $scope.timeData=results.histogram;
            }

          });
        };

        /**
        * Get a list of all indices
        */

        $scope.getIndices = function(){
          tweets.indexes(function(indices){
            $scope.indices=indices;
          });
        }

        // Load results on first run
        $scope.searchFirst();
        $scope.getIndices();
    }]
);


// Menu
app.controller('navCtrl', function($scope,config,memeService){
  memeService.list.getData(function(memeList){ 
    $scope.memeList=[];
    memeList.memes.forEach(function(meme){
       // limit list to some of the memes only
       var memelist=['biaoge','thevoice','moyan','hougong', 'gangnam','sextape','dufu','ccp','yuanfang','qiegao']
        if (memelist.indexOf(meme.safename)!=-1) $scope.memeList.push(meme)
    });
  })

  $('body').keydown(function (e) {
      console.log(e.which);
      if(e.which==87 && e.shiftKey==true) $scope.saveWords() // W
      else if (e.which==71 && e.shiftKey==true) $scope.saveMap() // G
      else if (e.which==67 && e.shiftKey==true) $scope.saveUsers() //C
      else if (e.which==84 && e.shiftKey==true) $scope.saveTime()
      else if (e.which==65 && e.shiftKey==true) $scope.saveAll()
  });

  $scope.saveAll = function () {
    $scope.saveTime();
    $scope.saveWords();
    $scope.saveMap();
    $scope.saveUsers();
  }

  $scope.saveTime = function(){
      //time 
      var sv=new Simg($(".time-container svg")[0]);
      var fn="time_"+config.getFilename()
      sv.download(fn);
  }
  $scope.saveWords = function(){
    var sv=new Simg($(".words-container svg")[0]);
    var fn="words_"+config.getFilename()
    sv.download(fn);
  }
  $scope.saveMap = function(){
      // map 
      $(".map-controls").hide()
      var sv=new Simg($(".geo-container svg")[0]);
      var fn="map_"+config.getFilename()
      sv.download(fn);
      $(".map-controls").show()
  }
  $scope.saveUsers = function(){
    var sv=new Simg($(".user-container svg")[0]);
    var fn="users_"+config.getFilename()
    sv.download(fn);
  }
})

// Data
app.controller("ReadPostCtrl", function ($scope, $route, $http, $routeParams) {

  // console.log($routeParams.id);
  var _id=$routeParams.id;
  $http.get('/api/meme/' + $routeParams.id).
    success(function(data) {
      // console.log(data);
      $scope.post = data;
      $scope.csvfile = data.csv;
  });


  $scope.getData= function(_format) {
    console.log('Collecting data from Es...', _format);
    var url='/api/meme/' + $routeParams.id+"/"+_format
    console.log(url);
    $http.get(url).
      success(function(res) {
        console.log(res);
        $scope.log=res.log;
        $route.reload();
        // $scope.post = data.meme;
      });
  }

  $scope.analyzeData = function(){
    console.log('Analyze data...');
    var url='/api/meme/' + $routeParams.id+"/process"
    console.log(url);
    $http.get(url).
      success(function(res) {
        console.log(res);
        // $scope.post = data.meme;
    });



  }



});

app.controller('dataCtrl', function($scope,$http,$routeParams,$location,$timeout,config,dataService){

  var safename= "dufu";
  config.setName(safename);   //default
  console.log(safename);


  $http.get("api/meme/"+$routeParams.id+"/times").success(function(_time_data) {

    $scope.memeName=safename;

    // TIME
    $scope.timeSeriesData=_time_data

    // sort time frames
    $scope.timeSeriesData.sort(function(a,b){ return a.timestamp-b.timestamp});

    $scope.timeSeriesData.map(function(d){ d.timestamp=d.timestamp*1000});

    // init scope values
    $scope.timeMax=$scope.timeSeriesData.length;
    $scope.start=$scope.timeSeriesData[0].timestamp;
    $scope.end=$scope.timeSeriesData[_time_data.length-1].timestamp;
    config.setStart($scope.start)
    config.setEnd($scope.end)    
    // socket.emit('config', config.toJSON());
    
    $scope.updateTimeData();

    // $scope.updateData();
  });


  $scope.stop = function(){
    $timeout.cancel($scope.playFrame);
  }

  var i,step,frames;

  $scope.playAll=function (){
    step=10,
    i=step, 
    frames=$scope.timeSeriesData.length/step;
    $timeout($scope.playFrame,100);
  }

  $scope.playFrame=function() {

    var t0=$scope.timeSeriesData[i-step].timestamp,
        t1=$scope.timeSeriesData[i].timestamp;

        // $scope.start=t0;
        $scope.end=t1;
        console.log(t0,t1);

        i+=step;
        $timeout($scope.playFrame,100)
  }

  // // monitor time changes
  $scope.$watch('start', function(newStart, oldVal) {

    if (newStart!=undefined) {
      $scope.start=newStart; 
      $scope.updateTimeData();
      config.setStart(newStart)
      $scope.updateData();
    }
  })

  $scope.$watch('end', function(newEnd, oldVal) {
    if (newEnd!=undefined) {
      $scope.end=newEnd; 
      $scope.updateTimeData();
      config.setEnd(newEnd);
      // socket.emit('config', config.toJSON());
      $scope.updateData();
    }  
  })

  var color = d3.scale.category20c();

  $scope.updateTimeData=function () {
    $scope.timeSeriesData.forEach(function(d) {
        if(d.timestamp>$scope.start && d.timestamp<$scope.end) d.selected=true
        else d.selected=false
        d.time=new Date(d.timestamp);
    });
  }
  
  $scope.updateData=function () {
    
    if($scope.start!=undefined && $scope.end!=undefined && ($scope.prevStart!=$scope.start || $scope.prevEnd!=$scope.end)) {

      var url="/api/meme/"+$routeParams.id+"/frames/"+$scope.start+"/"+$scope.end
      console.log(url);

      $http.get(url).success(function(_data) {

        // console.log(_data);;
        dataService.users.nodes=_data.users.nodes 
        dataService.users.edges=_data.users.edges,
        dataService.users.index=_data.users.index,
        dataService.words.nodes=_data.words.nodes 
        dataService.words.edges=_data.words.edges,
        dataService.words.index=_data.words.index,
        dataService.geo=_data.geo,
        dataService.wordsProvince=_data.wordsProvince
        dataService.trigger++;
        // console.log(dataService);
      })
    
      $scope.prevStart=$scope.start
      $scope.prevEnd=$scope.end;
    }

  }
});


app.controller('geoCtrl', function($scope,$http,$routeParams,config,geoService,dataService){
  
    $scope.centroidsOnMap=true;
    $scope.memeName=config.name

    geoService.mainland.getData(function(data){ $scope.mainland=data })
    geoService.taiwan.getData(function(data){ $scope.taiwan=data })
    geoService.hkmacau.getData(function(data){ $scope.hkmacau=data })

    geoService.info.getData(function(data){ 
      $scope.provincesInfo=data
    })

    geoService.ratio.getData(function(data){ 
      $scope.ratio=data
    })

    // console.log($scope);
    $http.get("/api/meme/"+$routeParams.id+"/geoclusters").success(function(_geoclusters_data) {
      $scope.clusters=_geoclusters_data;
      // $scope.clusters=null;
      $scope.showClusters=true;
      $scope.showEdges=true;
      $scope.showCentroids=true;
      $scope.geoColors=config.geoColors();
      // $('.geo-path').hide()
      // $('.centroids').hide()
    })

      // console.log($scope.showClusters);
      // config.showClusters=false;
      // $scope.showClusters=!$scope.showClusters;
    $scope.toggleInternals =function(){
      $(".geoPath circle").toggle();
    }

    $scope.toggleGeoEdges =function(){
      $(".geoPath path").toggle();
    }

    $http.get("/api/meme/"+$routeParams.id+"/provincesCount").success(function(_provincesCount_data) {
      $scope.provincesCount=_provincesCount_data;
    })
    
    // update geoData
    var isSetup=false;
    $scope.$watch(function() { return dataService.trigger }, function(newVal,oldVal){
      if(newVal!=oldVal && newVal!=0) {
        // parse words data 
        if(!isSetup){
          // console.log("setup provinces to words ");
          $scope.provincesWords={};
          // console.log(dataService.wordsProvince);
          for (word in dataService.wordsProvince) {
            var p=dataService.wordsProvince[word];
            p.forEach(function(d){
              if($scope.provincesWords[d.label] ==undefined) $scope.provincesWords[d.label]=[]
              $scope.provincesWords[d.label].push({"text":word,"count":d.value})
            })
          }
          isSetup=true
        }
        $scope.geoEdges=dataService.geo;
      }
    })

    $scope.saveGeoCommunities=function(){
      $(".map-controls").hide()
      var sv=new Simg($(".geo-container svg")[0]);
      var fn="map_"+config.getFilename()
      sv.download(fn);
      $(".map-controls").show()
    }

    $scope.saveGeo=function(){
      $(".map-controls").hide()
      var sv=new Simg($(".geo-container svg")[0]);
      var fn="maplink_"+config.getFilename()
      sv.download(fn);
      $(".map-controls").show()

      
    }
    $scope.savePie=function(){
      var sv=new Simg($(".geo-pie-container svg")[0]);
      var fn="geo_pie_"+config.getFilename()
      sv.download(fn);
    }
})

app.controller('wordCtrl', function($scope,$http,config,dataService){

  $scope.wordForceStarted=true;
  $scope.memeName=config.name;
  $scope.geoColors=config.geoColors();

  $scope.$watch(function() { return dataService.trigger }, function(newVal,oldVal){
    if(newVal!=oldVal && newVal!=0) {
      $scope.words=dataService.words;
      if(dataService.words.index!=undefined) $scope.wordsLength=dataService.words.index.length;
      $scope.wordProvinces=dataService.wordsProvince;
    }

  })

  $scope.saveWords=function(){
    var fn="words_"+config.getFilename()
    var sv=new Simg($(".words-container svg")[0]);
    sv.download(fn);
  }
})

app.controller('userCtrl', function($scope,$http,config,dataService){

  $scope.userForceStarted=true;
  $scope.memeName=config.name
  $scope.geoColors=config.geoColors();

  $scope.showCommunities=true; // show provinces clustering or communities

  $scope.$watch(function() { return dataService.trigger }, function(newVal,oldVal){
    if(newVal!=oldVal && newVal!=0) {
      $scope.users=dataService.users;
      if(dataService.users.index!=undefined) $scope.usersLength=dataService.users.index.length;      
    }

  })


  $scope.saveUsers=function(){
    var sv=new Simg($(".user-container svg")[0]);
    var fn="users_"+config.getFilename()
    sv.download(fn);
  }
})