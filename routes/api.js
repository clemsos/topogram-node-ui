/*
 * Serve JSON to our AngularJS client
 */

var config = require("../config/config");

var db = require('monk')('localhost/'+config.TOPOGRAM_MONGO_DB)
    , memes = db.get('memes');

var d3 = require('d3');
var zerorpc = require("zerorpc"); // communication with Python

var miner = new zerorpc.Client();
miner.connect("tcp://127.0.0.1:4242");

// GET
exports.memes = function (req, res) {
  memes.find({}, { fields : {"name": 1, "title":1, "description":1, "created_at":1 }, sort : { _id : -1 } },     
   function (err, doc) {
          // console.log(doc);
          if(doc==null) res.send("meme doesn't exist")
          else res.send({ memes : doc})
  });
};

exports.meme = function (req, res) {
  var id = req.params.id;
  memes.find({"_id":id}, { limit : 1, sort : { _id : -1 } },     
   function (err, doc) {
      if(doc==null) res.json(false)
      else {
        var hasMsg=0, 
            hasTimes=0;
        if("messages" in doc[0]) hasMsg=doc[0].messages.length;
        if("times" in doc[0]) hasTimes=doc[0].times.length;

        res.json({
              // meme: doc[0],
              "_id"      : doc[0]._id,
              "title"    : doc[0].title,
              "name"     : doc[0].name,
              "term"     : doc[0].term,
              "index"     : doc[0].index,
              "messages" : hasMsg,
              "times"    : hasTimes,
              "created_at": doc[0].created_at
            });}
  });
};

exports.status =function (req, res) {
  var id = req.params.id;
  memes.find(
    {"_id":id}, 
    { fields : {"times": 1, "messages":1, "created_at":1 } , limit : 1, sort : { _id : -1 } },     
   function (err, doc) {
      if(doc==null) res.json(false)
      else {
        var hasMsg=false, 
            hasTimes=false;
        if("messages" in doc[0]) hasMsg=true;
        if("times" in doc[0]) hasTimes=true;
        res.json(201, {
        "messages": hasMsg,
        "times": hasTimes,
        "created_at": doc[0].created_at
        })
      }
  });
}

exports.process = function(req, res) {
  var id = req.params.id;

  memes.find({"_id":id}, { limit : 1, sort : { _id : -1 } },     
   function (err, doc) {
      if(doc==null) res.json(false)
      else 
        miner.invoke("processData", 
          { "_id": doc[0]._id.toString() }, 
          function(error, resp, more) {
            console.log(error, resp);
            res.json(resp);
          });
  });
}

exports.es2csv = function(req,res) {
  var id = req.params.id;

  memes.find({"_id":id}, { limit : 1, sort : { _id : -1 } },     
   function (err, doc) {
      console.log(doc);
      if(doc==null) res.json(false)
      else 
        miner.invoke("es2csv", 
          doc[0], 
          function(error, resp, more) {
            console.log(resp);
            res.json(resp);
          });
  });
}

exports.es2mongo = function(req,res) {
  var id = req.params.id;

  memes.find({"_id":id}, { limit : 1, sort : { _id : -1 } },     
   function (err, doc) {
      if(doc==null) res.json(false)
      else 
        miner.invoke("es2mongo", 
          { "_id": doc[0]._id.toString() }, 
          function(error, resp, more) {
            console.log(error, resp);
            res.json(resp);
          });
  });
}

exports.times=function(req, res){    
    memes.findOne({"_id":req.params.id}, 
      {limit : 1, sort : { _id : -1 } }, 
      function (err, doc) {
          if(doc==null) res.send("meme doesn't exist")
          else res.send(doc.data.map(function(d){
              return {"count":d.count, "timestamp":d.time}
          }))
    });
}

var color=d3.scale.category20()
exports.frames=function(req, res){
    
    var id=req.params.id,
        start=req.params.start,
        end=req.params.end

    memes.find({"_id":id}, {limit : 1, sort : { _id : -1 } }, 
        function (err, doc) {  
            console.log(doc[0]);
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
};

exports.geoclusters=function(req, res){
    memes.find({"_id":req.params.id}, 
      { fields : {"geoclusters": 1 },limit : 1, sort : { _id : -1 } },     
      function (err, doc) {
        console.log(doc);
        if(doc==null) res.json(false)
        else res.send(doc[0].geoclusters)
    });
};

exports.provincescount=function(req, res){

    memes.find({"_id":req.params.id}, 
      { fields : {"provincesCount": 1 },limit : 1, sort : { _id : -1 } },     
      function (err, doc) {
        console.log(doc);
        if(doc==null) res.json(false)
        else res.send(doc[0].provincesCount)
    });
}

// POST
exports.addMeme = function (req, res) {
  var body=req.body;
  console.log(body);
  memes.insert(body, function (err, meme) {
        console.log(meme);
        if (err) res.json(500, err);
        else res.json(201, meme);
    });
};

// PUT
exports.editMeme = function (req, res) {
  var id = req.params.id;

  if (id >= 0 && id < data.memes.length) {
    data.memes[id] = req.body;
    res.json(true);
  } else {
    res.json(false);
  }
};

// DELETE
exports.deleteMeme = function (req, res) {
  var id = req.params.id;
  memes.remove({_id: id}, function(err){
    if (err) res.json(500, err);
    else res.json(204, {"id": id});
  });
};

// STATIC
// Calculate weighted results for Weibo population
var provinces_info=require("../data/nb_of_users_by_provinces")
var provincesRatio={}
var provincesInfo={};
for (var i = 0; i < provinces_info.provinces.length; i++) {
    var p=provinces_info.provinces[i];
    provincesInfo[p.name]=p;
    provincesRatio[p.name]=p.percent;
}

exports.provincesInfo = function(req, res){
    res.send(provincesInfo);
};

exports.provincesRatio = function(req, res){
    res.send(provincesRatio);
};