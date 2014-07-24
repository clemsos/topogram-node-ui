/* 
# TOPOGRAM UI
Visualisation engine for Topogram
*/


// ## MODULE DEPENDENCIES
    // The server is based on express and mongoDB

    var express = require('express');
    var app = module.exports = express();
    var server = require('http').createServer(app);

    var config = require("./config/config.json");

    var moment = require('moment');
    var d3 = require('d3');

    var db = require('monk')('localhost/'+config.TOPOGRAM_MONGO_DB)
    , memes = db.get('memes')

    // Hook Socket.io into Express
    // var io = require('socket.io').listen(server);

// ## CONFIGURATION

    // TODO: Migrate to [Express 4.x](https://github.com/visionmedia/express/wiki/Migrating-from-3.x-to-4.x)

    app.use(function(err, req, res, next){
      console.error(err.stack);
      res.send(500, 'Something broke!');
    });

    app.configure( function(){
        app.set('views', __dirname + '/views');
        app.engine('.html', require('ejs').renderFile);
        app.set('view engine', 'html');
        app.set('view options', {
                layout: false
        });
        
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.static(__dirname + '/public'));

        app.use(app.router);
    });

    app.configure('development', function(){
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.configure('production', function(){
        app.use(express.errorHandler());
    });

// ## ROUTES

    // Calculate weighted results for Weibo population
    var provinces_info=require("./data/nb_of_users_by_provinces")
    var provincesRatio={}
    var provincesInfo={};
    for (var i = 0; i < provinces_info.provinces.length; i++) {
        var p=provinces_info.provinces[i];
        provincesInfo[p.name]=p;
        provincesRatio[p.name]=p.percent;
    }

    //  ``/geo/info``

    // list different information about provinces
    app.get('/geo/info', function(req, res){
        res.send(provincesInfo);
    });

    //  ``/geo/ratio``

    // weight of provinces in total Weibo population (%)
    app.get('/geo/ratio', function(req, res){
        res.send(provincesRatio);
    });

    // ``/memes``

    // memes index
    var memeList=require("./data/2012_sina-weibo-memes_list.json")
    app.get('/memes', function(req, res){        
        res.send(memeList);
    });

    // ``/meme/:meme/data/``
    app.get("/data/:meme",  function(req, res){
        
        console.log(req.params.meme)
        var meme_name=req.params.meme;

        memes.find({"name":req.params.meme}, 
                    {limit : 1, sort : { _id : -1 } }, 
                    function (err, doc) {
                        console.log(doc[0]);
                        if(doc==null) res.send("meme doesn't exist")
                        else res.send(doc[0].data)
                    
        });
    });

    // ``/meme/:meme/times``
    app.get("/meme/:meme/times", function(req, res){
        
        memes.findOne({"name":req.params.meme}, 
                    {limit : 1, sort : { _id : -1 } }, 
                    function (err, doc) {
                        if(doc==null) res.send("meme doesn't exist")
                        else res.send(doc.data.map(function(d){
                            return {"count":d.count, "timestamp":d.time}
                        }))
        });
    });

    // ``/meme/:meme/geoclusters``
    app.get("/meme/:meme/geoclusters",  function(req, res){
        console.log(req.params.meme)
        memes.find({"name":req.params.meme}, 
                      { fields : {"geoclusters": 1 },limit : 1, sort : { _id : -1 } },     
                      function (err, doc) {
                        console.log(doc);
                        if(doc==null) res.send("meme doesn't exist")
                        else res.send(doc[0].geoclusters)
        });
    })

    /* ``/meme/:meme/provincescount/`` */
    app.get("/meme/:meme/provincescount",  function(req, res){
        console.log(req.params.meme)
        memes.find({"name":req.params.meme}, 
                      { fields : {"provincesCount": 1 },limit : 1, sort : { _id : -1 } },     
                      function (err, doc) {
                        console.log(doc);
                        if(doc==null) res.send("meme doesn't exist")
                        else res.send(doc[0].provincesCount)
        });

    })

    /*
     ``/meme/:meme/frames/:start/:end``  

     specific timeframe for a single meme

     ``meme``  original ID of the meme

     ``start`` should be a timestamp

     ``end``  should be a timestamp
     */

    var color=d3.scale.category20()
    app.get("/meme/:meme/frames/:start/:end", function(req, res){
        
        var meme_name=req.params.meme,
            start=req.params.start,
            end=req.params.end

        memes.find({"name":req.params.meme}, {limit : 1, sort : { _id : -1 } }, 
            function (err, doc) {  
                // console.log(doc[0]);
                var data=[];
                for (var i = 0; i < doc[0].data.length; i++) {
                    var d=doc[0].data[i];
                    if(d.time>(start) && d.time<(end)) data.push(d.data)
                }
                
                console.log(req.params,data.length+" frames");
                var dataService={}
                    dataService.users={}, 
                    dataService.words={}, 
                    dataService.geo=[],
                    dataService.wordsProvince={};


                // init
                dataService.users.nodes=[], 
                dataService.users.edges=[],
                dataService.users.index=[],
                dataService.words.nodes=[], 
                dataService.words.edges=[],
                dataService.words.index=[],
                dataService.geo=[],
                dataService.wordsProvince={};

                
                // users
                data.forEach(function (d){

                    if(d==undefined) return; // remove empty timeframes
                    
                    // user nodes
                    d.user_nodes.forEach(function(v){  
                      if(dataService.users.index.indexOf(v.name) == -1 ) {
                        dataService.users.nodes.push(v);
                        dataService.users.index.push(v.name);
                      }
                    });

                    // user edges
                    d.user_edges.forEach(function(v){  
                      if(dataService.users.index.indexOf(v.source) !=-1 && dataService.users.index.indexOf(v.target) != -1 
                        ) {
                          // check if already exists
                          var index=-1;
                          for (var j = 0; j < dataService.users.edges.length; j++) {
                            var e=dataService.users.edges[j];
                            if (v.source===e.source && v.target ===e.target) {
                              index=j;
                              break;
                            } 
                          }   
                          if(index!=-1) dataService.users.edges[index].weight+=v.weight;
                          else dataService.users.edges.push(v);
                      }
                    });

                    // word nodes
                    d.words_nodes.forEach(function(v){  
                      if(dataService.words.index.indexOf(v.name) == -1 ) {
                        dataService.words.nodes.push(v);
                        dataService.words.index.push(v.name);
                      }
                    });

                    // words edges
                    d.words_edges.forEach(function(v){  

                      // check if in scope
                      if(dataService.words.index.indexOf(v.source) !=-1 && dataService.words.index.indexOf(v.target) != -1) {
                          
                          // check if already exists
                          var index=-1;
                          for (var j = 0; j < dataService.words.edges.length; j++) {
                            var e=dataService.words.edges[j];
                            if (v.source===e.source && v.target ===e.target) {
                              index=j;
                              break;
                            } 
                          }   

                          if(index!=-1) dataService.words.edges[index].weight+=v.weight;
                          else dataService.words.edges.push(v);
                      }
                    });

                    // geo (provinces edges)
                    d.provinces_edges.forEach(function(v){  
                        
                        if (v.source == "Qita" || v.source == 0 || v.source =="Haiwai") return 
                        if (v.target == "Qita" || v.target == 0 || v.target =="Haiwai") return 
                        // if (v.target==v.source) return

                        var index=-1;
                        // console.log(v);

                        for (var j = 0; j < dataService.geo.length; j++) {
                          var e=dataService.geo[j];
                          if (v.source===e.source && v.target ===e.target) {
                            index=j;
                            break;
                          } 
                        }
                        if(index!=-1) dataService.geo[index].weight+=v.weight;
                        else dataService.geo.push(v);
                    });

                    // provinces_words
                    d.words_provinces.forEach(function(v){

                      // init word
                      if(dataService.wordsProvince[v.word]==undefined) dataService.wordsProvince[v.word]=[]

                      //check if province already exists
                      var index=-1;
                      for (var j = 0; j < dataService.wordsProvince[v.word].length; j++) {
                        var e=dataService.wordsProvince[v.word][j];
                        if (v.province===e.label) {
                          index=j;
                          break;
                        } 
                      }
                      if(index==-1) dataService.wordsProvince[v.word].push({
                            "label":v.province,
                            "value":v.weight,
                            "color":color(v.province)
                        });
                      else dataService.wordsProvince[v.word][index]["value"]+=v.weight;
                    })
                });

                if(doc==null) res.send("meme doesn't exist")
                else res.send(dataService)
            }
        )
    });

    /* **This is a single Page APP**

    Any routes will redirect to index by default */
    app.get('*', function(req, res){
        res.sendfile(__dirname + '/public/index.html');
    });

// ## SOCKET IO

    /*
    **DEPRECIATED**

    var clientSocket = io
        .sockets
        .on('connection', function (socket) {

            socket.emit('connect', {
                 'hi': 'hello frontend!'
            });

            socket.on("config",function (data){
                var config=JSON.parse(data)
                // console.log(config);
                // updateData(config.start,config.end);
                socket.emit("update");
            })
        });
    */

function updateData (start,end){
    console.log("time changed");
}


// Start server
server.listen(config.TOPOGRAM_NODE_PORT, function() {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});