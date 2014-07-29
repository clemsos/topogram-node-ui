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
        api = require('./routes/api')
        users = require('./routes/users');

    var jwt = require('express-jwt');
    var morgan  = require('morgan'); // logger

    // var tokenManager = require('./config/token_manager');
    // var secret = require('./config/secret');
    // Hook Socket.io into Express
    // var io = require('socket.io').listen(server);

// ## CONFIGURATION

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
        // app.use(morgan());
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
    app.get('/partials/:directory/:file', routes.subpartials);

    // Define a middleware function to be used for every secured routes 
    var auth = function(req, res, next){ 
        if (!req.isAuthenticated()) res.send(401); 
        else next(); 
    }; 

    // JSON API

    // users
    // app.get('/users', auth, users.list);
    app.post('/login', users.login);
    app.get('/logout', users.logout);
    //Create a new user
    app.post('/register', users.register); 

    // memes
    app.get('/api/memes', api.memes);
    app.get('/api/meme/:id', api.meme);
    app.post('/api/meme', api.addMeme);
    app.put('/api/meme/:id', api.editMeme);
    app.delete('/api/meme/:id', api.deleteMeme);

    // memes data
    app.get('/api/meme/:id/status', api.status);
    app.get('/api/meme/:id/download.csv', api.toCSV);
    app.get('/api/meme/:id/csv', api.es2csv);
    app.get('/api/meme/:id/mongo', api.es2mongo);
    app.get('/api/meme/:id/process', api.process);
    // app.get('/api/meme/:id/csv/download', api.csvlink);
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