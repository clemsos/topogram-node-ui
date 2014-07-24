/*
	d88888b d888888b db   db d88888b d8888b.   .88b  d88.  .d8b.  .d8888. db   db db    db d8888b. 
	88'     `~~88~~' 88   88 88'     88  `8D   88'YbdP`88 d8' `8b 88'  YP 88   88 88    88 88  `8D 
	88ooooo    88    88ooo88 88ooooo 88oobY'   88  88  88 88ooo88 `8bo.   88ooo88 88    88 88oodD' 
	88~~~~~    88    88~~~88 88~~~~~ 88`8b     88  88  88 88~~~88   `Y8b. 88~~~88 88    88 88~~~   
	88.        88    88   88 88.     88 `88.   88  88  88 88   88 db   8D 88   88 88b  d88 88      
	Y88888P    YP    YP   YP Y88888P 88   YD   YP  YP  YP YP   YP `8888Y' YP   YP ~Y8888P' 88      
	                                                                                               
*/	                                                                                               
 
/////////////////////////// MODULE DEPENDENCIES
	var express = require('express');
	var app = module.exports = express();
	var server = require('http').createServer(app);

	var moment = require('moment');

	// dbs
	var redis = require('redis');
	var mongoose = require("mongoose");

	// Hook Socket.io into Express
	var io = require('socket.io').listen(server);

	// homebrew
	var watcher = require("./utils/watcher");
	var parser = require("./utils/parser");
	var faker = require("./utils/faker");
	var Packet = require("./utils/Packet").Packet;

/////////////////////////// CONFIGURATION

	var config = require("./config/config.json");

	app.configure(function(){
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

	var useFakeData=true;
	var deviceList=config.ETHER_DEVICE_LIST;

	// var deviceList=["minidata"];
	// var deviceList=["device1","device2","device3","device4","device5","device6"];

/////////////////////////// STORAGE TO MONGO DB
	mongoose.connect('mongodb://localhost/'+config.ETHER_MONGO_DB, function(err) {
	  if (err) { throw err; }
	});

	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));

	// model 
	var PacketModel = mongoose.model('Packet', {
		mac 	   : String,
		from       : Boolean,
		geo        : String,
		text       : String,
		images     : [],
		date 	   : { type : Date, default : Date.now }
	});

/////////////////////////// ROUTES
	
	app.get('/device', function(req, res){
		// display page
		// display a list of pages
		var page_list="<h1>Available devices</h1>";
		page_list+="<ul>";
		for (var i = 0; i < deviceList.length; i++) {
			 page_list+="<li><a href='"+deviceList[i]+"'>"+deviceList[i]+"</a></li>";
		};
		page_list+="</ul>";
		console.log(page_list)
		res.send(page_list);
	});

	app.get('/device/:mac', function(req, res){
		// display page
		res.render('device', {layout: false});
	});

	app.get('/devices', function(req, res){
		
		var pages=["/devices/2/1","/devices/2/2","/devices/2/3", "/devices/3/1","/devices/3/2","/devices/6"];

		// display a list of pages
		var page_list="<h1>Available pages</h1>";
		page_list+="<ul>";
		for (var i = 0; i < pages.length; i++) {
			 page_list+="<li><a href='"+pages[i]+"'>"+pages[i]+"</a></li>";
		};
		page_list+="</ul>";
		// console.log(page_list)
		res.send(page_list);
	});	

	app.get('/devices/:cols/:index', function(req, res){

		console.log(req.params.cols)
		// display page
		if(req.params.cols == 2) {
			if(req.params.index == 1) {
				res.render('device1-2', {layout: false});
			} else if(req.params.index == 2) {
				res.render('device3-4', {layout: false});
			} else if(req.params.index == 3) {
				res.render('device5-6', {layout: false});
			} 
		} else if(req.params.cols == 3) {
			if(req.params.index == 1) {
				res.render('device1-2-3', {layout: false});
			} else if(req.params.index == 2) {
				res.render('device4-5-6', {layout: false});
			}
		} else if(req.params.cols == 6) {
			res.send("6 columns");
		} else {
			res.send("you are pushing it too far dude")
		}
	});

	app.get('/', function (req, res) {
		res.send('nothing here!');
	});

	// /images/523bc7805651c9bd09000003/1
	app.get('/images/:mongoid/:img', function (req, res) {
		PacketModel.findOne({_id: req.params.mongoid}, function(err, packet){
			if(err) throw new Error(err);
			// console.log(data);
			res.send(packet.images[req.params.img]);
		})
	});

/////////////////////////// SCAN FILES ON HARD DISK

	// init redis connection
	var redisPublisher = redis.createClient();

	// GET RAW DATA AND QUEUE IN REDIS
	function scanFilesAndPipeToRedis(devicefolder) {

		watcher.search4Folders(devicefolder, function(folders){

			// loop through all folders
			for (var i = folders.length - 1; i >= 0; i--) {
				// console.log(folders[i])

				// check if folders hasn't changed lately
				watcher.getTimeDiff(folders[i], function(timediff,folderPath) {
					
					// if the latest change happens before 2min=120s
					if(timediff > 20 ) {
						// console.log(timediff)
						watcher.folderToRawData(folderPath, function(rawdata){
							// console.log(rawdata)
							// add filelist to redis
							var key = config.ETHER_REDIS_RAW;
							redisPublisher.publish(key,rawdata);
						});
					}
				});
			}
		});
	} 

	// Scanning for new files
	function scanFolders() {
		// console.log("scan it, bitch");
		for (var i = 0; i < deviceList.length; i++) {
			var devicePath=config.ETHER_TMP_DIR+deviceList[i]+"/";
			console.log("scanning files on "+devicePath)
			scanFilesAndPipeToRedis(devicePath)
		}
	}

/////////////////////////// PARSE DATA FROM REDIS RAW QUEUE

	var redisRawClient = redis.createClient();
	redisRawClient.subscribe(config.ETHER_REDIS_RAW);

	var mongoPacket;
	// process raw data process 
	redisRawClient.on("message", function(channel, rawdata){
		// console.log("redis got sth new");
		rawdata = JSON.parse(rawdata); 
		if(rawdata.html != '' && rawdata.images.length != 0) { //folders without html or without images won't display

			if(useFakeData) {
				rawdata.from = faker.getRandomFrom();
				rawdata.ip = faker.getRandomIp();
			}

			// parse html to text
			parser.parsePacket(rawdata, function(_rawdata,packet){
				console.log("parsed");

				// store into mongo DB
				mongoPacket = new PacketModel(JSON.parse(packet.toJSON()))
				mongoPacket.save(function (err, savedPacket) {
					if (err) throw new Error("mongo "+ err);
					console.log("saved !");
					
					console.log(savedPacket._id);

					var imgpath;
					for (var i = 0; i < packet.images.length; i++) {
						imgpath="/images/"+savedPacket._id+"/"+i
						console.log(imgpath);
						packet.addImagePath(imgpath);
					};

					redisPublisher.rpush(config.ETHER_REDIS_Q+":"+_rawdata.mac, packet.toSocketJSON());
				});


				// delete folder & files
				// watcher.deleteFolderRecursive(_rawdata.path);
			});
		}
	});

/////////////////////////// SOCKET COMMUNICATION

	var redisSocketClient= redis.createClient()
	// redisSocketClient.subscribe(config.ETHER_REDIS_Q);

	var clientSocket = io
		.sockets
		// .of('/device')
		.on('connection', function (socket) {

			socket.emit('connect', {
				 'hi': 'hello device!'
			});

			socket.on("device",function(data){
				console.log("Hello, my name is " + data.mac);

				var mongoCounter=0;
				function waitForPush() {
				    
				    redisSocketClient.rpop(config.ETHER_REDIS_Q+":"+data.mac, function (list,item) {

				    	// console.log(item)
				        // get data fron mongo
				        if(item ==null) {

				        	// console.log("get data not from mongo", mongoCounter);
				        	// var query=PacketModel.find({"mac":data.mac}).limit(10+mongoCounter*10);
				        	var query=PacketModel.find({"mac":data.mac}).limit(1+mongoCounter).skip(1+mongoCounter) ;

				        	query.execFind(function(err, mongoPacket){
								// console.log(mongoPacket[0])
								// parse into packet
								
								var packet= new Packet;
								if(mongoPacket[0] != undefined) {
									packet.populateFromMongo(mongoPacket[0]);
				        			socket.emit('packet', packet.toSocketJSON());
								} else {
									mongoCounter=0;
								}

				        	});
				        	PacketModel.count({"mac":data.mac}, function(dblength){
				        		if(mongoCounter==dblength) mongoCounter=0;
				        	});
				        }

				        // get data fron redis
				        else {
				        	socket.emit('packet', item);
				        	mongoCounter=0;
				        }

				        mongoCounter++
				        setTimeout(waitForPush,1500+Math.floor(Math.random()*(Math.random()>.8?5000:1500)));
				    });

				}

				waitForPush();
				
			});
		});

// Start server
server.listen(config.ETHER_NODE_PORT, function() {
	console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

// start scanning process
// for (var i = 0; i < deviceList.length; i++) {
// 	scanFilesAndPipeToRedis(deviceList[i]);
// };

// loop()
setInterval(scanFolders, 5000);