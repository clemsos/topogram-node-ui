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

    var routes = require('./routes'),
        api = require('./routes/api');

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
        app.set('view engine', 'jade');
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

    // routes
    app.get('/', routes.index);
    app.get('/partials/:name', routes.partials);

    // JSON API

    // memes
    app.get('/api/memes', api.memes);
    app.get('/api/meme/:id', api.meme);
    app.post('/api/meme', api.addMeme);
    app.put('/api/meme/:id', api.editMeme);
    app.delete('/api/meme/:id', api.deleteMeme);

    // memes data
    app.get('/api/meme/:id/times', api.times);
    app.get('/api/meme/:id/frames/:start/:end', api.frames);
    app.get("/api/meme/:id/geoclusters", api.geoclusters);
    app.get("/api/meme/:id/provincescount", api.provincescount);

    // info
    app.get('/api/geo/info', api.provincesInfo);
    app.get('/api/geo/ratio', api.provincesRatio);

    // redirect all others to the index (HTML5 history)
    app.get('*', routes.index);

// Start server
server.listen(config.TOPOGRAM_NODE_PORT, function() {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});