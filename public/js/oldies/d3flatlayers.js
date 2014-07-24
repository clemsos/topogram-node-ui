// Layout
var wordForceStarted=false,
    communitiesForceStarted=true,
    centroidsOnMap=true,
    initViz;

// hide/show things
var displayWordForce=true,
    displayWordToUsers=false,
    displayMapToUsers=true,
    communitySort=null,
    communitySort="",
    centroidsSort= "meme", //"gdp", "population"
    communityUsersLayout= "pie", // "pie"
    communityLayout="geo", //default layout : "YAxis", "XAxis", "geo"
    selectedCommunity=[]; //11

// public functions
var centroidsDisplay;

var wordForce,
    communitiesForce;

// TODO : should be private
var updateCommunityXY,
    tickCommunity,
    drawMapToUsers,
    updateWordXY,
    tickWords,

    tickMapToCommunities;

function drawD3Layers(graphFile,mapFile,timeFile) {

    var vizWidth=1100,
        wordHeight=500,
        userHeight=600,
        communityTopY=wordHeight,
        mapY=communityTopY+userHeight,
        vizHeight=mapY+communityTopY;

    var viz=d3.select("#viz").append("svg")
            .attr("class","svg-viz")
            .attr("width", vizWidth)
            .attr("height", vizHeight)
            .attr("preserveAspectRatio", "xMidYMid")
            .attr("viewBox", "0 0 " + vizWidth + " " + vizHeight);
    

// LOAD DATA /////////////////////////////////////////////////////////////
    queue()
        .defer(d3.json, "maps/zh-mainland-provinces.topo.json") // mainland
        .defer(d3.json, "maps/zh-chn-twn.topo.json") // taiwan 
        .defer(d3.json, "maps/zh-hkg-mac.topo.json") // hk and macau
        .defer(d3.json, "data/ChineseProvincesInfo.json") // additional data
        .defer(d3.json, mapFile) // hk and macau
        .defer(d3.json, graphFile)
        .defer(d3.json, timeFile) 
        .await(draw); // function that uses files

// PARSE DATA /////////////////////////////////////////////////////////////
    function draw(error,mainland,taiwan,hkmacau,provincesInfoData,mapData,graphData,timeData) {

        showUserGraphInfo(graphData.info)


        // USER COMMUNITIES
            var userNodes=graphData.users.nodes;
            var userEdges=graphData.users.edges;
            var userCommunities = [];

            var usersX={}
            var communitiesX={}
            var communitiesY={}

            // Parse user nodes into Community
            var myUserNodes = {};
            var myUserCommunities = {};
            for (var i = 0; i < userNodes.length; i++) {
                 
                myUserNodes[userNodes[i]["name"]] =userNodes[i]
                
                if(myUserCommunities[userNodes[i]["community"]] == undefined) myUserCommunities[userNodes[i]["community"]]=[]
                userNodes[i].btw_cent=Math.random() // TODO :btw cent
                myUserCommunities[userNodes[i]["community"]].push(userNodes[i])        

            };

            // INIT COMMUNITIES NODES {Id, Users, Province}
            for (var c in myUserCommunities){
                var myUsers=myUserCommunities[c];
                var provinces_count={}
                var btwCentTotal=0;

                for (var i = 0; i < myUsers.length; i++) {
                    var num=myUsers[i].province;
                    provinces_count[num] = provinces_count[num] ? provinces_count[num]+1 : 1;
                    btwCentTotal+=myUsers[i].btw_cent;
                };
                
                // console.log(btwCentTotal)
                // console.log(btwCentAvg)
                var btwCentAvg=btwCentTotal/myUsers.length;

                // Create Provinces Data
                var userProvinces=[];
                for( key in provinces_count ) userProvinces.push({"label":key,"value":provinces_count[key]});
                
                userCommunities.push( 
                    {   "id": c, 
                        "users": myUsers, 
                        "words":null, 
                        "children" : null, 
                        "provinces": userProvinces,
                        "avgBtwCent" : btwCentAvg
                    }
                    );
            }

        // MAP : parse data properly

            var provincesInfo={};
            for (var i = 0; i < provincesInfoData.length; i++) {
                provincesInfo[provincesInfoData[i].name]=provincesInfoData[i];
            };

            var umap=[];
            // sort provinces 
            mapData.provinces.map(function(d) { umap[d.name]=d.count });
            delete(umap[null]); // remove useless elements
            delete(umap[0]);

            var v = Object.keys(umap).map(function(k){return umap[k]})

            var projection = d3.geo.mercator()
                .center([116,39]) // china long lat 
                .scale(vizWidth/2);

            var mapPath = d3.geo.path()
                .projection(projection);

            // projection for HK / Macau
            var projection2 = d3.geo.mercator()
                .center([126,17])
                .scale(2000);

            var path2 = d3.geo.path()
                .projection(projection2);

        // CENTROIDS
            // Get provinces centroids
            var mapCentroids=[];
            var mapFeatures= [topojson.feature(mainland, mainland.objects.provinces).features,topojson.feature(taiwan, taiwan.objects.layer1).features.filter(function(d) { return d.properties.GU_A3 === 'TWN'; }),topojson.feature(hkmacau, hkmacau.objects.layer1).features]
            
            var centroids={}

            function updateCentroidsXY() {                
                mapCentroids=[];
                centroids={};
                var cnt=0,
                    rgx=d3.scale.linear().domain([0,30]).range([0,vizWidth-300]);

                for (var i = 0; i < mapFeatures.length; i++) {
                    mapFeatures[i].forEach(function(d, i) {
                        cnt++;
                        var centroid;
                        if (d.properties.name==undefined && (d.properties.NAME=="Hong Kong" || d.properties.NAME=="Macao") ) {
                            centroid = path2.centroid(d);
                            centroid.x = centroid[0]+650;
                            centroid.y = centroid[1]+400;
                            centroid.cx = centroid[0]+650;
                            centroid.cy = centroid[1]+400;
                        } else {
                            centroid = mapPath.centroid(d);
                            centroid.x = centroid[0];
                            centroid.y = centroid[1];
                            centroid.cx = centroid[0];
                            centroid.cy = centroid[1];
                        }

                        if (centroid.some(isNaN)) return;

                        centroid.feature = d;
                        if (d.properties.name != undefined) centroid.name=d.properties.name
                        else if (d.properties.name==undefined && d.properties.NAME=="Taiwan") centroid.name='Taiwan';
                        else if (d.properties.name==undefined && d.properties.NAME=="Macao") centroid.name='Aomen';
                        else centroid.name='Xianggang';

                        centroid.type="province";
                        centroid.cleanName=provincesInfo[centroid.name].clean_name
                        centroid.gdp=provincesInfo[centroid.name].gdp
                        centroid.population=provincesInfo[centroid.name].population

                        mapCentroids.push(centroid);
                    });
                };

                // sort according to selected value
                if (centroidsSort=="gdp") mapCentroids.sort(function(a,b){ return b.gdp-a.gdp;})
                else if (centroidsSort=="population") mapCentroids.sort(function(a,b){ return b.population-a.population;})
                else if (centroidsSort == "meme") mapCentroids.sort(function(a,b){return umap[b.name]-umap[a.name] })
                

                for (var i = 0; i < mapCentroids.length; i++) {
                    var c=mapCentroids[i];
                    
                    mapCentroids[i].absx= rgx(i)-rgx(i-1);
                    mapCentroids[i].fixx = rgx(i); // fix display
                    mapCentroids[i].fixy = mapY+100; // fix display

                    centroids[c.name]=c;
                };
            }

            updateCentroidsXY()
        
        // MAP TO COMMUNITIES        
            var mapUsersEdges=[];
            var tmpUE={}

            for (var i = 0; i < userNodes.length; i++) {
                var o=userNodes[i];
                if( o.province!="0" && o.province != "Qita" && o.province != "Haiwai") {
                    if(tmpUE[o.community+"_"+o.province] == undefined ) tmpUE[o.community+"_"+o.province]=0;
                    tmpUE[o.community+"_"+o.province]+=1;
                }
            };

            for (a in tmpUE) {
                var data=a.split("_");
                mapUsersEdges.push({
                        "source" : data[0],
                        "target" : data[1],
                        "weight" : tmpUE[a] })
            }

            var provinceToUsers={},
                usersToProvinces={};
            
            for (var i = 0; i < mapUsersEdges.length; i++) {
                var d=mapUsersEdges[i];
                
                if(provinceToUsers[d.target]==undefined) provinceToUsers[d.target]=[]
                provinceToUsers[d.target].push(d.source);

                if(usersToProvinces[d.source]==undefined) usersToProvinces[d.source]=[]
                usersToProvinces[d.source].push( {"province" : d.target, "weight" : d.weight} );

            };
            
            // console.log(usersToProvinces);
            var mapCommunitiesX={},
                mapCommunitiesY={};

            var mapCommunitiesXY=function() {

                // console.log("mapCommunitiesXY");

                var centroidsMapCom={};

                // weights by province for each community
                for (uid in usersToProvinces){
                    
                    // vector
                    var p=usersToProvinces[uid],
                        w=0,
                        tmpX=20,
                        o=0;
                    
                    // sort by weight
                    p.sort(function(a,b) { return b.weight -a.weight  })

                    for (var i = 0; i < p.length; i++) {
                        if(i==0) o=centroids[p[i].province].fixx
                        tmpX+=centroids[p[i].province].absx*p[i].weight;
                        w+=p[i].weight;
                    };

                    mapCommunitiesX[uid]=tmpX/w+o;
                    mapCommunitiesY[uid]=Math.random()*300;
                }
            }
            mapCommunitiesXY()

        // PROVINCES TO PROVINCES

            // provinceToUsers
            // usersToProvinces
            // console.log(userEdges.length);
            var provincesToProvinces=[];
            var p2pTmp={};
            for (var i = 0; i < userEdges.length; i++) {

                var s=myUserNodes[userEdges[i].source].province,
                    t=myUserNodes[userEdges[i].target].province;

                if(s!=0 && t!=0 && t!="Qita" && s!="Qita" && t!="Haiwai" && s!="Haiwai") { //remove useless
                    var e=t+"_"+s;
                    if (p2pTmp[e]==undefined) p2pTmp[e]=0;
                    p2pTmp[e]+=1
                }
            };

            for (edge in p2pTmp) {
                var e = edge.split("_");
                provincesToProvinces.push({"source":e[0], "target":e[1], "weight":p2pTmp[edge] });

            }

        // ARCS (Links between communities)
            userEdges.forEach(function(link) {
                link.source = myUserNodes[link.source] || 
                    (nodes[link.source] = {name: link.source});
                link.target = myUserNodes[link.target] || 
                    (myUserNodes[link.target] = {name: link.target});
                link.value = +link.weight;            
            });

            // Create edges between communities
            var communitiesEdges = [],
                myCommunitiesEdges={};

            for (var i = 0; i < userEdges.length; i++) {
                
                var u1=userEdges[i].source, 
                    u2=userEdges[i].target;
                
                
                // skip users in the same community
                if(u1.community!=u2.community) {

                    if(myCommunitiesEdges[u1.community]==undefined) myCommunitiesEdges[u1.community]=[]
                    myCommunitiesEdges[u1.community].push({"name": u2.community, "direction" :"to", "weight": userEdges[i].weight})

                    if(myCommunitiesEdges[u2.community]==undefined) myCommunitiesEdges[u2.community]=[]
                    myCommunitiesEdges[u2.community].push({"name": u1.community, "direction" :"from", "weight": userEdges[i].weight})

                    
                    // communitiesEdges.push(userEdges[i]);

                }
            }

            // console.log(myCommunitiesEdges)

            for (com in myCommunitiesEdges) {
                for (var i = 0; i < myCommunitiesEdges[com].length; i++) {
                    var e=myCommunitiesEdges[com][i];
                    if(e.direction == "from") communitiesEdges.push({"source": Number(com), "target" : e.name, "weight":e.weight})
                    else communitiesEdges.push({"source": e.name, "target" : Number(com), "weight":e.weight})

                };
            }
            
            var myCommunities={}

            for (var i = 0; i < userCommunities.length; i++) {
                var u=userCommunities[i];
                myCommunities[u.id]=u;
            };

            communitiesEdges.forEach(function(link) {
                link.source = myCommunities[link.source] || 
                    (myCommunities[link.source] = {name: link.source});
                link.target = myCommunities[link.target] || 
                    (myCommunities[link.target] = {name: link.target});
                link.value = +link.weight;
            });

        // COMMUNITIES XY
            // nodes scale
            var userDisplayScale=[5,25],
                userScale=userCommunities.map(function(d){return Number(d.users.length)}),
                maxMinUserScale=[Math.min.apply(Math,userScale), Math.max.apply(Math,userScale)],
                userScaleSize=d3.scale.linear().domain(maxMinUserScale).range(userDisplayScale),
                mapCommunitesScaleSize=d3.scale.linear().domain(maxMinUserScale).range([1,5]);                  
            userScale.sort(function(a,b){return b-a});

            var topUsersStart=8,
                iTopUsersStart=1,
                maxTopUsersX=0;

                for (var i = 0; i < userScale.length; i++) {
                    // console.log(userScaleSize(userScale[i]))
                    iTopUsersStart=i;
                    maxTopUsersX+=userScaleSize(userScale[i])*2;
                    if(userScaleSize(userScale[i])<topUsersStart) break
                };
    
            var scaleTopUsersWidth=d3.scale.linear().domain([0,iTopUsersStart]).range([(vizWidth/2)-50-300,(vizWidth/2)+150-300]),
            scaleUsersWidth=d3.scale.linear().domain([0,userScale.length]).range([0,vizWidth-300])

            // calculate communities coordinates
            updateCommunityXY=function communityPos() {

                var xprev=0,yprev=0,rprev=0;

                if(communitySort=="btwCent") {
                    // console.log("sort by avg")
                    userCommunities.sort(function(a,b){
                        // console.log(a,b)
                        if(a.avgBtwCent < b.avgBtwCent) return b,a
                        else return a,b
                    })
                } else if (communitySort = "maxBtwCent") {
                    // console.log("sort by max btw cent")
                    userCommunities.sort(function(a,b){
                        // console.log(a,b)
                        var maxA=Math.max.apply(Math, a.users.map(function(d){ return d.btw_cent }));
                        var maxB=Math.max.apply(Math, b.users.map(function(d){ return d.btw_cent }));

                        if(maxA<maxB) return b,a
                        else return a,b
                    })
                } 
            
                for (var i = 0; i < userCommunities.length; i++) {
                    var r,x,y;
                    r=userScaleSize(userCommunities[i].users.length);
                    if(communityLayout=="YAxis") {
                        x=100,
                        y=yprev+r*2+rprev-2;
                    } else if (communityLayout=="XAxis") {
                        // x=scaleUsersWidth(i);
                        // if(i<=iTopUsersStart) x=xprev+r*2+rprev-2;
                        if(i<=iTopUsersStart) x=scaleTopUsersWidth(i)
                        else x=scaleUsersWidth(i);
                        y=communityTopY-200+Math.random()*200;
                    } else if (communityLayout=="geo") {

                        x=mapCommunitiesX[userCommunities[i].id];
                        y=mapCommunitiesY[userCommunities[i].id];

                    }

                    communitiesX[userCommunities[i].id]=x;
                    communitiesY[userCommunities[i].id]=y;

                    
                    xprev=x;
                    yprev=y;
                    rprev=r;
                }
            }

            updateCommunityXY()

        // WORD nodes
            var wordNodes=graphData.words.nodes;
            var myWordNodes={},
                wordsX={},
                wordsY={};

            for (var i = 0; i < wordNodes.length; i++) {
                myWordNodes[wordNodes[i]["name"]] =wordNodes[i];
                wordNodes[i].words=null;
            };

            // Compute edges for words force
            var wordEdges=graphData.words.edges;
            wordEdges.forEach(function(link) {            
                link.source = myWordNodes[link.source] || 
                    (myWordNodes[link.source] = {name: link.source});
                link.target = myWordNodes[link.target] || 
                    (myWordNodes[link.target] = {name: link.target});
                link.value = +link.weight;
            });

        // WORD TO COMMUNITIES EDGES

            var wordsUsersPath=graphData.words_user;    
            var tmp={};
            wordsToCommunities=[];
            var communitiesToWords={};

            // clean data to match communities instead of users
            wordsUsersPath.forEach(function(word){
                var p=word.source+"_"+word.community;
                // console.log(p);
                if (tmp[p]==undefined) tmp[p]=0;
                tmp[p]+=word.weight;
            })
            
            for(var word in  tmp) {
                var data= word.split("_")

                // console.log(data[1]);

                if(tmp[word] > 30 ) {
                    // if( !isNaN(communitiesX[data[1]]) ) { 
                    wordsToCommunities.push({"source": data[0], "target" : data[1], "weight": tmp[word]})                  

                    // init word
                    if(communitiesToWords[data[1]]== undefined) communitiesToWords[data[1]]=[]
                    communitiesToWords[data[1]].push({"word": data[0], "weight": tmp[word]})
                }

            }
            // console.log(wordsToCommunities)

            wordsToCommunities.forEach(function(link) {            
                link.source = myWordNodes[link.source] || 
                    (myWordNodes[link.source] = {name: link.source});
                link.target = myCommunities[link.target] || 
                    (myCommunities[link.target] = {name: link.target});
                link.value = +link.weight;
            });

            updateWordXY= function updateWordXY() {

                var margin=30,
                    rgx=d3.scale.linear().domain([0,wordNodes.length]).range([margin,vizWidth-margin-200]),
                    s=d3.shuffle(wordNodes),
                    rgy=d3.scale.linear().domain(fontScale).range([margin,communityTopY-150]);

                for (var i = 0; i < wordNodes.length; i++) {
                    var d=s[i];
                    wordsX[d.name]=rgx(i);
                    wordsY[d.name]=rgy(wordScaleFont(d.count));
                };
            }

        // COMMUNITIES NODES - PUSH MORE DATA
            communitiesIndex={}

            userCommunities.forEach(function(community){
                
                community.words=communitiesToWords[community.id];

                if(myCommunitiesEdges[community.id]!=undefined)community.children=myCommunitiesEdges[community.id];

                communitiesIndex[community.id]=community;
            })

// SVG SETUP //////////////////////////////////////////////////////////

    var arcs,
        words,
        wordsToUsers,
        wordPath,
        communities,
        markers,
        map,
        nodeCentroids,
        mapToUsers,
        mapCommunities,
        provinceLinks,
        colorScale,
        userForce,
        users,
        usersPath;

    var maxRadius=100;   

    function setupSVG() {

        // WORDS
        divWords=viz.append("g").attr("class","text")

        wordForce= d3.layout.force()
            .nodes(wordNodes.filter(function (d) {

                if(selectedCommunity.length!=0) {
                    for (var j = 0; j < selectedCommunity.length; j++) {
                        var com=communitiesIndex[selectedCommunity[j]];
                        if(com.words !=undefined) for (var i = 0; i < com.words.length; i++) if(com.words[i].word == d.name) d.visible=true;
                    };
                } else return true
            }))
            .links(wordEdges.filter(function (d) { 
                if(selectedCommunity.length!=0) {
                    for (var j = 0; j < selectedCommunity.length; j++) {
                        var com=communitiesIndex[selectedCommunity[j]];
                        if(com.words !=undefined) {
                            var sourceIn=false, targetIn=false;
                            for (var i = 0; i < com.words.length; i++) {
                                if(com.words[i].word==d.source.name) sourceIn=true;
                                if(com.words[i].word==d.target.name) targetIn=true;
                            }
                            if(sourceIn && targetIn)  return true
                        }
                    }
                } else return true
            }))
            .size([vizWidth, communityTopY-30])
            .linkDistance(150)
            .charge(-1000)
            .gravity(.4)
            .on("tick", tickWord);
            // .start();

        wordPath = divWords.append("g")
            .attr("class", "wordgraph")
            .selectAll("path")
                .data(wordForce.links())
            .enter() //.append("svg:path")
            .append("line")
            .attr("class", "word-link")

        words = divWords.append("g")
            .attr("class", "words")
            .selectAll("path")
            .data(wordNodes.filter(function (d) { 
                if(selectedCommunity.length!=0) {
                    for (var j = 0; j < selectedCommunity.length; j++) {
                        var com=communitiesIndex[selectedCommunity[j]];
                        if(com.words != undefined) {
                            for (var i = 0; i < com.words.length; i++) {
                                if(com.words[i].word == d.name) return true 
                            };
                        }
                    }
            } else return true
            }))
            .enter()
            .append("g")
            .attr("class", "word")
            .call(wordForce.drag);

        wordsToUsers = divWords.append("g")
            .attr("class", "wordusers")
            .selectAll("path")
            .data(wordsToCommunities.filter(function (d) { 
                // if(d.weight > 30) return false
                // console.log(d);
                if(selectedCommunity.length!=0) {
                    for (var j = 0; j < selectedCommunity.length; j++) {
                        var com=communitiesIndex[selectedCommunity[j]];
                        if(com.words !=undefined) {
                            for (var i = 0; i < com.words.length; i++) {
                                if(com.id == d.target.name && com.words[i].word == d.source.name) return true 
                            };
                        }
                    }
                } else return true
            }))
            .enter()
            .append("line")
            // .attr("class", "word-link")

        if(displayWordForce) wordForce.start()

        // COMMUNITIES
        communitiesForce=d3.layout.force()
            .nodes(userCommunities.filter(function (d) { 
                    if(selectedCommunity.length!=0) {

                        for (var j= 0; j<selectedCommunity.length; j++) {
                            if(d.children) {
                                for (var i = 0; i < d.children.length; i++) {
                                    if(d.children[i].name==selectedCommunity[j]) return true 
                                };
                            }
                            if(d.id==selectedCommunity[j]) return true 
                        }
                    } else return true
            }))
            .links(communitiesEdges.filter(function (d) { 
                // console.log(d)
                if(selectedCommunity.length!=0) {
                    for (var i = 0; i < selectedCommunity.length; i++) {
                        if(d.source.community == selectedCommunity[i]) return true 
                        else if(d.target.community == selectedCommunity[i]) return true 
                    };
                } else return true;
            }))
            .size([vizWidth-200,300])
            .linkDistance(150)
            .charge(-1300)
            .gravity(.3)
            .on("tick", tickCommunity);
            // .start();
        
        divCommunities=viz.append("g")
            .attr("class","force")
            .attr("transform","translate(30,"+(communityTopY-20)+")")

        arcs=divCommunities.append("g").attr("class","arcs")
            .selectAll('.arc')
                .data(communitiesForce.links()) // if conditionfilter
            .enter()
            .append('g')
            .attr('class', 'arc')
            .attr("marker-end", "url(#end)")

        markers=divCommunities.append("defs")
          .selectAll("marker")
            .data(["end"])
          .enter()
            .append("svg:marker")

        communities=divCommunities.append("g").attr("class","communities")
            .selectAll('.community')
            .data(communitiesForce.nodes());

        // GEO 
        divGeo=viz.append("g").attr("class","geo")
            .attr("transform","translate(30,0)") 

        mapCommunities=divGeo.append("g").attr("class","map-communities")
            .selectAll('.mapCommunity')
            .data(communitiesForce.nodes());
        
        map=divGeo.append("g")
            .attr("class", "map")
            .attr("transform", function(d) { return "translate(0,"+ (mapY) +")";})

        provinceLinks=divGeo.append("g")
                .attr("class","province-links" )
                .selectAll('.province-link')
                .data(provincesToProvinces);

        // Draw centroids
        mapToUsers=divGeo.append("g")
            .attr("class", "mapusers")
            .selectAll("path")
            .data(mapUsersEdges.filter(function (d) { 
                if(selectedCommunity.length!=0) {
                    for (var j = 0; j < selectedCommunity.length; j++) {
                        var com=communitiesIndex[selectedCommunity[j]];
                        for (var i = 0; i < com.provinces.length; i++) {
                            // console.log(i)
                            if(com.id==d.source && com.provinces[i].label==d.target) return true 
                        };
                }
            } else return true
            }))
            .enter()
            .append("path")
            .attr("class", "map-user")

        nodeCentroids=divGeo.append("g")
            .attr("class", "centroids")
            .selectAll(".centroid")
                .data(mapCentroids.filter(function (d) { 

                    if(selectedCommunity.length!=0) {
                        for (var j = 0; j < selectedCommunity.length; j++) {
                            var com=communitiesIndex[selectedCommunity[j]];
                            for (var i = 0; i < com.provinces.length; i++) {
                                if(com.provinces[i].label==d.name) return true 
                            };
                        }
                    } else return true
            }));

        // users
        divUsers=viz.append("g").attr("class","users")

        userForce=d3.layout.force()
            .nodes(userNodes)
            .links(userEdges)
            .size([vizWidth-300,vizHeight])
            .linkDistance(60)
            .charge(-300)
            .gravity(.6)
            .on("tick", tickUsers)
            // .start();

        users = divUsers.append("g").attr("class","usersnodes")
            .selectAll('.user')
            .data(userForce.nodes())
            .call(userForce.drag);
        
        usersPath = divUsers.append("g").attr("class","userslinks")
            .selectAll('.userlink')
            .data(userForce.links())
            .call(userForce.drag);        
    }

    function drawLegend() {

        d3.select("#legend").selectAll("*").remove() //clear precedent version

        var legendWidth=150,
            legendHeight=180,
            legendMargin=3;

        var legend= d3.select("#legend")
            .append("svg")
            .attr("class","legend")
            .attr("width", legendWidth)
            .attr("height", legendHeight)

            // .attr("preserveAspectRatio", "xMidYMid")
            // .attr("viewBox", "0 0 " + vizWidth + " " + vizHeight);

        var communitiesLength=d3.extent(communities.data().map(function(d){ return d.users.length }))

        communitiesLength.push(Math.round((communitiesLength[0]+communitiesLength[1])/2))
        if(communitiesLength[0]<5) communitiesLength[0]=5;
        
        legendCommunities=legend.append("g")
            .attr("class","legend-communities")
            .append("g")
                .attr("class","legend-size")
            .selectAll("circle")
                .data(communitiesLength);

        legendCommunities
            .enter()
            .append("circle")
            .attr("r",  function(d,i){ return userScaleSize(d) })
            .attr("cy", function(d,i){ return userScaleSize(d)})
            .attr("cx", 50)
            .style("fill","transparent")
            .style("stroke","#ccc")

        legendCommunities
            .enter()
            .append("line")
            .attr("x1", 50)
            .attr("y1", function(d,i){ return userScaleSize(d)*2})
            .attr("x2", 100)
            .attr("y2", function(d,i){ return userScaleSize(d)*2})
            .style("stroke","#ccc")
            .style("stroke-width",.5);
        
        legendCommunities
            .enter()
            .append("text")
            .attr("dx", 100)
            .attr("dy", function(d,i){ return userScaleSize(d)*2})
            .style("font-size",9)
            .style("fill","#aaa")

            .text(function(d){ return d+" users" })

        legendBtwCent = legend
            .select(".legend-communities")
            .append("g")
            .attr("class","btw_centr")
            .attr("transform","translate(10,90)")
            .selectAll("rect")
                .data([0,1,2,3,4])
            .enter()

        var cw=20;
        legendBtwCent.append("rect")
            .attr("width",cw+5)
            .attr("height",cw)
            .attr("x",function(d){ return legendMargin+d*(cw+5)})
            .attr("y",legendMargin+30)
            .style("fill", function(d){ return btwPieColor(d)})

        var lg=["0",".2",".4",".6",".8","1"]

        // legendBtwCent.append("text")
        legendBtwCent
            .append("g")
            .append("text")   
            .text(function(d,i){return lg[i]})
            .attr("dx", function(d,i){ return legendMargin+d*(cw+5)})
            .attr("dy", legendMargin+cw*3)
            .style("fill","#aaa")
            .style("font-size",9)
            .style("text-anchor","middle");

        d3.select(".btw_centr")
            .append("text")
            .attr("dx",".35em")
            .attr("dy",10)
            .text("Influence")
            .style("fill","#aaa")
            .style("margin-left",5)
            .style("font-size",12)

        d3.select(".btw_centr")
            .append("text")
            .attr("dx",".35em")
            .attr("dy",25)
            .text("Users Betweeness Centrality")
            .style("fill","#aaa")
            .style("margin-left",5)
            .style("font-size",10)
            // .call(wrap, 150);

        // d3.select("#legend")
            // .attr("transform", "translate ("+(vizWidth-300)+"," +(mapY-100)+ ")")
    }

// DRAW FUNCTIONS ///////////////////////////////////////////////////////

    // colors
        var fontScale=[15,60],
            wordScale=wordNodes.map(function(d){return d.count}),
            maxMinWordScale=[Math.min.apply(Math,wordScale), Math.max.apply(Math,wordScale)],
            wordScaleFont=d3.scale.linear().domain(maxMinWordScale).range(fontScale),
            userPathColor=d3.scale.category20b(),
            mapColor;

        var btwPieColor=d3.scale.linear().domain([1,5]).range(["#ffffb2","#a50f15"]) //.interpolate(d3.interpolateHcl);
        
        // province color scale
        var pro={}, i=0, val=[];
        for(key in umap) { pro[key]=i; i++; val.push(umap[key])}
        
        // var c=d3.scale.category20c();
        // colorProvinces = function(key){ return (key==undefined)? "#cccccc" : greens(key) };
        colorProvinces= function(key){ return "#AAA" }//c(pro[key])}

    // USERS
        
        function drawUsers(){
            users.enter()
                .append("g")
                .attr("class","user")
                .append("circle")
                .attr("r",5)
                .style("fill", function(d){return userPathColor(d.community)})
                .each(function (d, i) {
                    // sth
                })
        }

        function drawUserPath() {
            
            usersPath.enter()
                .append("svg:path")
                .attr("class", "userlink")
                .style("fill", "none")
                .style("stroke", function(d){return userPathColor(d.source.community)})
                .style("stroke-width",2)
        }

        function tickUsers() {

            usersPath.attr("d", function(d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);

                var r=5,
                    w=vizWidth-100,
                    h=vizHeight,
                    x1=Math.max(r, Math.min(w - r, d.source.x)),
                    y1=Math.max(r, Math.min(h - r, d.source.y)),
                    x2=Math.max(r, Math.min(w - r, d.target.x)),
                    y2=Math.max(r, Math.min(h - r, d.target.y));

                return "M" + 
                    x1 + "," + 
                    y1 + "A" + 
                    dr + "," + dr + " 0 0,1 " + 
                    x2 + "," + 
                    y2;
            });

            users
                .attr("transform", function(d) { 
                    
                    var r=5,
                        w=vizWidth-100,
                        h=vizHeight,
                        x=Math.max(r, Math.min(w - r, d.x)),
                        y=Math.max(r, Math.min(h - r, d.y));

                    return "translate(" + x + "," + y + ")"; 
                });
        }
        
    // WORDS
        function drawWords() {

            words.each(function (d, i) {

                var self = d3.select(this);
                
                // var ext;
                // if(selectedCommunity) ext=communitiesIndex[selectedCommunity].words.map(function(d) {return d.weight})
                // else  
                var ext=words.data().map(function(d){ return d.count })
                // console.log(d3.extent(ext))
                var wordScaleSize=d3.scale.linear().domain(d3.extent(ext)).range([15, 35]);
                var wordScaleOpacity=d3.scale.linear().domain(d3.extent(ext)).range([.8,1]);
                var wordColor = d3.scale.linear().domain(d3.extent(ext)).range(["#a1d99b","#006d2c"]);
                self.append("rect")
                    .attr("width", function(d) { return wordScaleSize(d.count) })
                    .attr("height", function(d) { return 20 })
                    .style("fill", function(d) {  return "transparent"; })
                    .style("stroke", function(d) { return "transparent" });

                self.append("text")
                    .attr("dx", 12)
                    .attr("dy", 8)
                    .style("font-size", function(d) { return wordScaleSize(d.count) })//scale_size(d.btw_cent) })
                    .style("fill", function(d) {  return wordColor(d.count) })
                    .style("fill-opacity", function(d) {  return wordScaleOpacity(d.count) })
                    .attr("text-anchor", "middle") // text-align: right
                    .text(function(d) { return d.name });

                var x=i*20;
                var y=80;

                wordsX[d.name]=x;
                wordsY[d.name]=y;
                // self.attr("transform", function(d) { return "translate(" + x + "," + y + ")"; });

            })
        }

        function tickWord() {
            
            // remove transition for force
            var ww = (wordForceStarted)? words : words.transition();

            ww.attr("transform", function(d) { 
                
                // console.log(d)
                var r=wordScaleFont(d.count),
                    w=vizWidth-200,
                    h=communityTopY-30,
                    x=(d.x==undefined || !wordForceStarted)? wordsX[d.name] : Math.max(r, Math.min(w - r, d.x)),
                    y=(d.y==undefined || !wordForceStarted)? wordsY[d.name] : Math.max(r, Math.min(h - r, d.y));

                // console.log(d.x,x,d.y,y,r,w,h);
                wordsX[d.name]=x;
                wordsY[d.name]=y;

                return "translate(" + x + "," + y + ")"; 

            });

            if(displayWordForce) tickWordPath();
        }

        function tickWordPath() {
            

            wordPath.each(function (d, i) {

                var self=d3.select(this);

                if(!wordForceStarted) self.style("stroke-opacity", function(d) { return 0 })
                else self.style("stroke-opacity", function(d) { return 0.3 })

                self.attr("x1", function(d){
                    // console.log(d.source);
                    var r=wordScaleFont(d.source.count),
                        w=wordForce.size()[0],
                        x=Math.max(r, Math.min(w, d.source.x));
                        // console.log(x>w)
                        return d.source.x=x;
                    })
                    .attr("y1", function(d){
                        var r=wordScaleFont(d.source.count),
                            h=wordForce.size()[1],
                            y=Math.max(r, Math.min(h, d.source.y));
                            // console.log(r,h)
                            return d.source.y=y;
                        })
                    .attr("x2", function(d) { 
                        
                        var r=wordScaleFont(d.target.count),
                            w=wordForce.size()[0],
                            x=Math.max(r, Math.min(w, d.target.x));
                            // console.log(x>w)
                            return d.target.x=x;
                             })
                    .attr("y2", function(d) { 
                        var r=wordScaleFont(d.target.count),
                            h=wordForce.size()[1],
                            y=Math.max(r, Math.min(h, d.target.y));
                            // console.log(r,h)
                            return d.target.y=y;
                    });
                });
        }

        function drawWordPath() {

            wordPath.each(function (d, i) {
                var self = d3.select(this);
                
                self.style("stroke", function(d) { return "red" })
                    .style("stroke-width", function(d) {  return 1 });

                if(!wordForceStarted) self.style("stroke-opacity", function(d) { return 0 })
                else self.style("stroke-opacity", function(d) { return 0.3 })
            })
        }

        tickWords=function(){ 
            (wordForceStarted)? wordForce.start():wordForce.stop();
            if(!wordForceStarted) updateWordXY();
            tickWord();
        };

    // COMMUNITIES
        function drawCommunity() {
            
            d3.select(".communities").selectAll("*").remove()

            var scaleBtwCent=d3.scale.linear().domain([0,1]).range([1,5])

            // get max and min values of users length
            var ul=communitiesForce.nodes().map(function(d){
                return d.users.length;
            }).sort(function(a,b){
                return b-a;
            });
            
            
            var maxU=ul[0];
                minU=ul[ul.length-1];
            
            var maxArea=Math.PI*Math.pow(userScaleSize(maxU),2);
                maxAreaPerUser=Math.sqrt(maxArea/maxU)/Math.PI;
            
            var scaleUsers=d3.scale.linear().domain([0,1]).range([.5,Math.round(maxAreaPerUser)])


            // console.log((r/2)/d.users.length);
            communities.enter()
                .append("g")
                .attr("class","community")
                .each(function (d, i) {

                    d.layout="pack" // default

                    var self = d3.select(this);
                    var r=userScaleSize(d.users.length),
                        x=communitiesX[d.id],
                        y=communitiesY[d.id];

                    d.selected=false; // init state

                    // round to int and scale
                    var usersMapBtw=d.users.map(function(d){ 
                        return Math.round(scaleBtwCent(d.btw_cent));
                    });

                    
                    // count occurences
                    var userBtw={}
                    usersMapBtw.map(function(d){ 
                        if(userBtw[d]==undefined) userBtw[d]=0
                        userBtw[d]+=1
                    })


                    var mapBtw=[] // init with rioght values
                    for(u in userBtw) mapBtw.push({"label":u, "value":userBtw[u]});

                    if (communityUsersLayout=="pie") {

                        var pie = d3.layout.pie()
                              .sort(null)
                              .value(function(d) { return d.value });

                        var g = self.append("g").attr("class","node")
                            .selectAll(".node")
                              // .data(pie(d.provinces))
                              .data(pie(mapBtw))
                            .enter().append("g")
                              .attr("class", "piece")
                              .style("stroke","transparent")
                              .style("stroke-width",0)
                              .attr("transform", function(d) { 
                                return "translate(" + x + "," + y + ")"; });

                        var arc = d3.svg.arc()
                          .outerRadius(r*2 - 10)
                          .innerRadius(0);

                        var dis=d;
                        g.append("path")
                          .attr("d", arc)
                          .style("stroke","transparent")
                          .style("stroke-width",0)
                          .style("fill", function(d) { return btwPieColor(Number(d.data.label)); })
                          .style("fill-opacity", function(e) { 
                            for (var i = 0; i < selectedCommunity.length; i++) 
                                 if(Number(dis.id)== selectedCommunity[i]) return 1
                            return .5
                        });
                    } else if (communityUsersLayout=="pack") {

                        // var packData=d.users;
                        d.children=d.users.sort(function(a,b) { return b.btw_cent-a.btw_cent });
                        // packData.push(d)

                        // console.log(d);
                        var pack = d3.layout.pack()
                            .value(function(d) { return d.users? d.users.length : 1 })
                            .size([r*2, r*2]);

                        var node = self.append("g").attr("class","node")
                            .selectAll(".node")
                              .data(pack.nodes(d))
                            .enter().append("g")
                              .attr("transform", function(d) {  return d.users? "translate(" + 0 + "," + 0 + ")" : "translate(" + (0+d.x-r) + "," + (0+d.y-r) + ")"; });
                        

                        node.append("circle")
                            .attr("r", function(d) { return d.users? r : scaleUsers(d.btw_cent) })
                            .style("stroke",function(d) { return d.users? "#aaa" : "none" })
                            .style("stroke-width", 0)
                            .style("fill", function(d) { return d.users? "#edf8e9" : btwPieColor(scaleBtwCent(d.btw_cent)) })
                            

                            // .attr("r", d.users? r : d.btw_cent*5)
                    } else if (communityUsersLayout=="map") {
                    } else {

                        var node = self.append("g").attr("class","node")
                              .attr("transform", "translate(" + x + "," + y + ")" );
                        
                        var btw=0
                        for (var i = 0; i < usersMapBtw.length; i++) {
                            btw+=usersMapBtw[i];
                        };
                        console.log(btw,btw/d.users.length);

                        node.append("circle")
                            .attr("r", r)
                            .style("stroke","none")
                            .style("stroke-width", 1)
                            .style("fill", btwPieColor(btw/d.users.length) )
                    }
                }).on("mouseenter", function(d){
                    d.layout="pack";

                    // drawCommunity();
                })

                // tickCommunity();
        }

        tickCommunity=function () {
            // var userColor = d3.scale.category20b();
            // console.log("tickCommunity");

            communities.each(function (d, i) {
                // console.log(d.id);
                var self = d3.select(this);
                var r=d.users.length,
                    w=communitiesForce.size()[0],
                    h=mapY-communityTopY-30,
                    x=(d.x==undefined || !communitiesForceStarted)? communitiesX[d.id] : Math.max(r, Math.min(w - r, d.x)),
                    y=(d.y==undefined || !communitiesForceStarted)? communitiesY[d.id] : Math.max(r, Math.min(h - r, d.y));

                self.selectAll(".node")
                    // .transition()
                    .attr("transform", function(d) {return "translate(" + x + "," + y + ")"; });

                d.x=x;
                d.y=y;
                return d;
            })
            
            tickCommunityPath();
            if(displayWordToUsers) tickWordsToUsers();
        }

        function drawCommunityPath() {
                
            arcs.each(function (d, i) {
                var self = d3.select(this);
                self.append("path")
                    // .style("stroke-width",function(d) { return 5;})
                    .style("stroke",function(d) { return  "#000" ;})//userPathColor(200*d.weight);})
            }).on('mouseover', function (d) {
                    var self = d3.select(this);
                    self.select("path")
                        // .style("stroke","#000")
                        .style("opacity","1")
                })
                .on('mouseout', function (d) {
                    var self = d3.select(this);
                    self.select("path")
                        .style("opacity",".5");
                })
        }

        function tickCommunityPath() {

            arcs.each(function (d, i) {

                    var self = d3.select(this);
                    
                    var x1,y1,x2,y2,
                        path,
                        toItself=false;

                    if (communitiesForceStarted) {
                    
                        var r1=d.source.users.length,
                            r2=d.target.users.length,
                            w=vizWidth-200,
                            h=vizHeight-30,
                            x1=Math.max(r1, Math.min(w - r1,d.source.x)),
                            y1=Math.max(r1, Math.min(h - r1,d.source.y))
                            x2=Math.max(r2, Math.min(w - r2,d.target.x)),
                            y2=Math.max(r2, Math.min(h - r2,d.target.y));
                        
                        if(x2==x1) return; // avoid  toItself

                        var dx = d.target.x - d.source.x,
                            dy = d.target.y - d.source.y,
                            // dr = Math.sqrt(dx * dx + dy * dy);
                            dr =0;

                        path = 'M ' + x1 + ','+y1+' A ' + dr + ',' + dr + ' 0 0,1 ' + x2 + ','+y2 ;
                    } else {

                        x1=communitiesX[d.source.community],
                        y1=communitiesY[d.source.community],
                        x2=communitiesX[d.target.community],
                        y2=communitiesY[d.target.community];

                        if(d.source.community==d.target.community) return
                    
                        if(communityLayout=="XAxis") {
                            var r = (x2 - x1) * 0.51,
                                ry = Math.min(r, 490);
                            path = 'M ' + x1 + ','+y1+' A ' + r + ',' + ry + ' 0 0,1 ' + x2 + ','+y2 ;

                        } else if(communityLayout=="YAxis") {
                            // if(y2!=y1) console.log(Math.min(y2-y1*0.51, 490))
                            var r = (y2 - y1) * 0.51,
                                rx = Math.min(r,490);
                            path = 'M ' + x1 + ','+y1+' A ' + r + ',' + rx + ' 0 0,1 ' + x2 + ','+y2 ;
                        }
                    }

                    var select=(communitiesForceStarted)? self.select('path'):self.select('path').transition();

                    if (path != undefined) {
                            select
                            .attr('d', path)
                            .style("fill","transparent")
                            .style('opacity', .9)
                            .style('stroke-width', d.weight)
                            .style('stroke', userPathColor(d.weight) );
                    }

                })
        }

    // CENTROIDS
        function drawCentroids() {

            nodeCentroids.enter()
              .append("g")
              .attr("class", "centroid")
              .each(function (d, i) {
                var self=d3.select(this);

                self.append("circle")
                    .attr("r", 2)
                    .style("fill", function(d) {return "green"});

                self.append("text")
                    .attr("dx", 2)
                    .attr("dy", "0.35em")
                    .style("fill", "#404040" )
                    .style("fill-opacity", "0.8" )
                    .style("font-size", 11 )
                    .text(d.cleanName);
            }).on("click",function(d){
                if(provinceToUsers[d.name]!=undefined) updateSelection(provinceToUsers[d.name]);
            });;

            tickCentroids();
        }

        tickCentroids = function() {

            nodeCentroids.each(function (d, i) {
                var x=(centroidsOnMap)? d.x :centroids[d.name].fixx;
                var y=(centroidsOnMap)? mapY+d.y :centroids[d.name].fixy;

                var self=d3.select(this);
                self.transition().attr("transform", "translate(" + x + "," + y + ")")

                if (!centroidsOnMap) 
                    self.select("text")
                        .attr("transform", "rotate(60)")
                        .attr("dy","0.45em")
                else
                    self.select("text")
                        .attr("transform", "rotate(0)")
            })
        }

    // PROVINCE TO PROVINCE
        function drawProvince2Province (){

            // tickProvince2Province();
            var linkExtent=provincesToProvinces.map(function(d){ if(d.source!=d.target) return d.weight;}),
                nodeExtent=provincesToProvinces.map(function(d){ if(d.source==d.target) return d.weight;});
            var linkOpacityScale=d3.scale.linear().domain(d3.extent(linkExtent)).range([.05,1]),
                linkSizeScale=d3.scale.linear().domain(d3.extent(linkExtent)).range([2,10]),
                nodeSizeScale=d3.scale.linear().domain(d3.extent(nodeExtent)).range([3,30]);

            provinceLinks
                .enter()
                .append("g")
                .attr("class","province-link")
                .each(function (d, i) {

                    if(d.target!=d.source) {

                        var self=d3.select(this).append("path");

                        var x1=(!centroidsOnMap)? centroids[d.source].fixx : centroids[d.source].x,
                            y1=(!centroidsOnMap)? centroids[d.source].fixy : mapY+centroids[d.source].y,
                            x2=(!centroidsOnMap)? centroids[d.target].fixx : centroids[d.target].x,
                            y2=(!centroidsOnMap)? centroids[d.target].fixy : mapY+centroids[d.target].y;


                        if(!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {

                            var dx = x1 - x2,
                                dy = y1 -y2;

                            if(centroidsOnMap) dr = Math.sqrt(10*(dx*dx)+(dy*dy));
                            // else dr = Math.sqrt((dx*dx)+(dy*dy));
                            else dr=Math.min(dx*dx,490)

                            path = 'M ' + x1 + ','+y1+' A ' + dr + ',' + dr + ' 0 0,1 ' + x2 + ','+y2 ;
                            // console.log(path);

                            self.transition()
                                .attr("d", path)
                                .style("fill","none")
                                .style("stroke", function(d) { return "#428bca" })
                                .style("stroke-opacity", function(d) { return linkOpacityScale(d.weight) })
                                .style("stroke-width", function(d) {  return linkSizeScale(d.weight) });
                        }

                    } else {

                        var self=d3.select(this).append("circle");

                        var x=(!centroidsOnMap)? centroids[d.source].fixx : centroids[d.source].x,
                            y=(!centroidsOnMap)? centroids[d.source].fixy : mapY+centroids[d.source].y;

                        self.transition()
                            .attr("cx", x)
                            .attr("cy", y)
                            .attr("r", nodeSizeScale(d.weight))
                            .style("fill", "#b63b32")

                    }
                
            })


        }
        
        function tickProvince2Province (){
            
            provinceLinks.each(function (d, i) {
                if(d.target!=d.source) {

                    var self=d3.select(this).select("path");

                    var x1=(!centroidsOnMap)? centroids[d.source].fixx : centroids[d.source].x,
                        y1=(!centroidsOnMap)? centroids[d.source].fixy : mapY+centroids[d.source].y,
                        x2=(!centroidsOnMap)? centroids[d.target].fixx : centroids[d.target].x,
                        y2=(!centroidsOnMap)? centroids[d.target].fixy : mapY+centroids[d.target].y;

                    if(!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {

                        var dx = x1 - x2,
                            dy = y1 -y2;

                        if(centroidsOnMap) dr = Math.sqrt(10*(dx*dx)+(dy*dy));
                        else dr = Math.sqrt((dx*dx)+(dy*dy));

                        path = 'M ' + x1 + ','+y1+' A ' + dr + ',' + dr + ' 0 0,1 ' + x2 + ','+y2 ;
                        // console.log(path);

                        self.transition()
                            .attr("d", path)
                            // .style("fill","none")
                            // .style("stroke", function(d) { return "#428bca" })
                            // .style("stroke-opacity", function(d) { return linkOpacityScale(d.weight) })
                            // .style("stroke-width", function(d) {  return linkSizeScale(d.weight) });
                    }

                } else {

                    var self=d3.select(this).select("circle");

                    var x1=(!centroidsOnMap)? centroids[d.source].fixx : centroids[d.source].x,
                        y1=(!centroidsOnMap)? centroids[d.source].fixy : mapY+centroids[d.source].y;

                    self.transition()
                        .attr("cx", x1)
                        .attr("cy", y1);
                }
            });
        }

    // MAP TO USERS
        tickMapToCommunities=function () {

            var extent=mapToUsers.data().map(function(d){return d.weight})
            var weightScale=d3.scale.linear().domain(d3.extent(extent)).range([.05,1]);

            mapToUsers.each(function (d, i) {
                
                var self=d3.select(this);

                var x1=communitiesX[d.source],
                    y1=communitiesY[d.source]+330,
                    x2=(!centroidsOnMap)? centroids[d.target].fixx : centroids[d.target].x,
                    y2=(!centroidsOnMap)? centroids[d.target].fixy : mapY+centroids[d.target].y;


                if(!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {

                    var dx = x1 - x2,
                        dy = y1 -y2,
                        dr = Math.sqrt(10*(dx*dx)+(dy*dy));

                    path = 'M ' + x1 + ','+y1+' A ' + dr + ',' + dr + ' 0 0,1 ' + x2 + ','+y2 ;
                    // console.log(path);

                    self.transition()
                        .attr("d", path)
                        .style("fill","none")
                        .style("stroke", function(d) { return "#ccc" })
                        .style("stroke-opacity", function(d) { return weightScale(d.weight) })
                        .style("stroke-width", function(d) {  return 1 });
                }
                
            })

            mapCommunities.each(function (d, i) {                
                var self=d3.select(this);
                var r=mapCommunitesScaleSize(d.users.length),
                        x=mapCommunitiesX[d.id],
                        y=mapCommunitiesY[d.id];

                    self.transition()
                        .select("circle")
                        .attr("cx",x)
                        .attr("cy",y);
                        // .attr("transform", "translate(" + x + "," + y + ")")
            })
        }

        function drawMapCommunities () {
            
            mapCommunities.enter()
                .append("g")
                .attr("class","community")
                .each(function (d, i) {

                    var self = d3.select(this);

                    var r=mapCommunitesScaleSize(d.users.length),
                        x=mapCommunitiesX[d.id],
                        y=communitiesY[d.id];

                    self.append("circle")
                        .attr("r",r)
                        .attr("fill", "#fff")
                        .attr("cx",x)
                        .attr("cy",y)

                })
        }

        // build the arrows
        function tickArrows() {
            markers
                .attr("id", String)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 15)
                .attr("refY", -1.5)
                // .attr("markerWidth",50)
                // .attr("markerHeight",50)
                .attr("markergraph_Width", 10)
                .attr("markergraph_Height", 10)
                .attr("orient", "auto")
              .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5");  
        }
    
    // WORDS TO USERS
        function tickWordsToUsers() {
            // console.log("displayWordToUsers");
            wordsToUsers.each(function (d, i) {             
                console.log(d.target.name)
                var self=d3.select(this);
                var x1=wordsX[d.source.name],
                    y1=wordsY[d.source.name],
                    x2=(communitiesForceStarted)? d.target.x : communitiesX[d.target.id],
                    y2=(communitiesForceStarted)? d.target.y : communitiesY[d.target.id];
                    x2+=30;
                    y2+=330.0;
                    console.log(x1,x2,y1,y2);

                console.log(d.target)

                if(!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
                    self.style("stroke", function(d) { return "green" })
                        .style("stroke-opacity", function(d) { return (d.weight > 50)? d.weight*0.002:0 })
                        .style("stroke-width", function(d) {  return 2 })
                        .transition()
                        .attr("x1", x1)
                        .attr("y1", y1)
                        .attr("x2", x2)
                        .attr("y2", y2)
                }
            })
        }

    // MAP

        // Mainland provinces
        function drawMainland(error, cn) {
            map.append("g")
                .attr("class", "mainland")
                .selectAll("path")
                .data(topojson.feature(cn, cn.objects.provinces).features)
                .enter()
                .append("g")
                .attr("class", "province")
                .append("path")
                .attr("d", mapPath)
                // .attr("id", function(d) { return d.id; })
                .attr("class", "province")
                .attr("class", function(d){ return d.properties.name })
                .attr("fill", "#eee")
                .attr("stroke", "#404040")
                .attr("stroke-width", "0.35")
                .on("click",function(d){
                    
                    // update users mentioned
                    if(provinceToUsers[d.properties.name]!=undefined) updateSelection(provinceToUsers[d.properties.name]);

                    
                });
        }

        // Taiwan
        function drawTaiwan(error, cn) {

            map.append('g')
                .attr("class", "taiwan province")
                .selectAll("path")
                .data(topojson.feature(cn, cn.objects.layer1).features.filter(function(d) { return d.properties.GU_A3 === 'TWN'; }))
                .enter()
                .append("path")
                .attr("d", mapPath)
                .attr("id", function(d) { return d.id; })
                .attr("class", "province")
                .attr("class", function(d){ return "Taiwan" })
                .attr("fill", "#000")
                // .attr("fill", function(d) { return mapColor(umap["Taiwan"]); })
                .attr("stroke", "#ccc")
                .attr("stroke-width", "0.35")
                .on("click",function(d){
                    
                    // update users mentioned
                    if(provinceToUsers["Taiwan"]!=undefined) updateSelection(provinceToUsers["Taiwan"]);

                    
                });
        }

        // HK and Macau
        function drawHkMacau(error, cn) {
            // console.log(error)
            // console.log(topojson.feature(cn, cn.objects.layer1).features.filter(function(d) { return d.properties.GU_A3 === "HKG" }))
          
            viz.select('.map')
                .append("g")
                .attr("class", "hk")
                .attr("transform", "translate("+650+","+400+")")
                .selectAll("path")
                .data(topojson.feature(cn, cn.objects.layer1).features)
                .enter()
                .append("path")
                .attr("d", path2)
                // .attr("id", function(d) { return d.id; })
                .attr("class", "province")
                .attr("class", "Xianggang")
                .attr("fill", "#000")
                // .attr("fill", function(d) { return mapColor(umap["Xianggang"]); })
                .attr("stroke", "#ccc")
                .attr("stroke-width", "0.35");

            viz.select(".hk")
                .append("text") //add some text
                .attr("dx", function(d){return 20})
                .attr("dy", function(d){return 35})
                .attr("font-family", "sans-serif")
                .attr("fill", "#aaaaaa")
                .attr("font-size", 10)
                .text("Hong Kong & Macau");

            // add demarcation
            viz.select(".hk")
               .append("svg:line")
                 .attr("x1", 130)
                 .attr("y1", 5)
                 .attr("x2", 0)
                 .attr("y2", 10)
                 .style("stroke", "#cccccc")
                 .style("stroke-width", 1);
            
            viz.select(".hk")
                .append("svg:line")
                 .attr("x1", 0)
                 .attr("y1", 10)
                 .attr("x2", -10)
                 .attr("y2", 60)
                 .style("stroke", "#cccccc")
                 .style("stroke-width", 1);
        }

        function tickMap() {
            
            mapColor=d3.scale.linear().domain(d3.extent(v)).range(["#fee5d9","#a50f15"])

            for (var i = 0; i < mapToUsers.data().length; i++) {
                var province="path."+mapToUsers.data()[i].target
                // console.log(c(mapToUsers.data()[i].weight))
                d3.select(province)
                    // .attr("fill",mapColor(mapToUsers.data()[i].weight))
                    .attr("fill",  mapColor(umap[mapToUsers.data()[i].target]))
            };

            // DRAW LEGEND  Color bar adapted from http://tributary.io/tributary/3650755/
            var cw=10,
                ch=2.5;
            map.append("g")
                .attr("class","caption")
                .attr("transform", "translate("+(vizWidth-350)+","+300+")")
                .append("g")
                .attr("class","color-bar")
                .selectAll("rect")
                    .data(d3.range(d3.min(v), d3.max(v), (d3.max(v)-d3.min(v))/50.0))
                .enter()
                .append("rect")
                .attr({width: cw,
                      height: 5,
                      y: function(d,i) { return -i*ch },
                      x: -10,
                      fill: function(d,i) { return mapColor(d); } })
            
            map.select(".caption")
                .append("g")
                .attr("transform", "translate(0,-122.5)")
                .call(d3.svg.axis()
                       .scale(d3.scale.linear().domain(d3.extent(v)).range([ch*50,0]))
                        .orient("right"))
                .attr("font-family", "sans-serif")
                .attr("fill", "#ccc")
                .attr("font-size", 10)
                    
            map.select('.caption')
                .append("g")
                .attr("class","units")
                // .attr("transform", "translate(0,40)")
                // .attr("transform", "rotate(90 "+(map_width-cw)+","+(map_height/2-cw)+")")
                .append("text")
                .attr("dx", 55)          
                .attr("dy", -15 )
                .attr("text-anchor", "middle")  
                .attr("font-family", "sans-serif")
                .attr("fill", "#ccc")
                .attr("font-size", 10)
                .attr("transform", "rotate(-90)")//function(d){ console.log(d); return "rotate(90 "+d.x+","+d.y+")"})          
                .text("Volume of tweets (x100)")
        }

        function drawMap() {
            drawMainland(error,mainland);
            drawTaiwan(error,taiwan);
            drawHkMacau(error,hkmacau);
            tickMap();
        }

    // TIME SERIES
        function drawTimeSerie() {
            
            d3.select("#timeserie").selectAll("*").remove() //clear precedent version
            // Margins, timeWidth and timeHeight. 
            var w=300,
                h=300;

            var margin = {top: 20, right: 20, bottom: 90, left: 30},
                barTimeWidth = w,
                timeWidth = barTimeWidth - margin.left - margin.right,
                timeHeight = h - margin.top - margin.bottom;

            // // Construct our SVG object.
            var svg = d3.select("#timeserie").append("svg")
                .attr("width", timeWidth + margin.left + margin.right)
                .attr("height", timeHeight + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // Build Scales.
            var x = d3.time.scale().range([timeWidth/timeData.length/2, timeWidth-timeWidth/timeData.length/2]);
            // var x = d3.scale.ordinal().rangeRoundBands([0, timeWidth], .05);
            var y = d3.scale.linear().range([timeHeight, 0]);

            // Date parsing.
            // var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S");

            // X-axis.
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                // .ticks(d3.time.month, 1)
                .tickFormat(d3.time.format("%d %B"));

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(10);

            timeData.forEach(function(d) {
                d.date=new Date(d.timestamp*1000);
                // console.log(dt);
                // d.date = parseDate.parse(dtmp);
                // console.log(d);
            });

            // Set scale domains. 
            x.domain(d3.extent(timeData, function(d) { return d.date; }));
            y.domain([0, d3.max(timeData, function(d) { return d.count; })]);

            // Call x-axis. 
            d3.select(".x.axis")
                .transition().duration(1000)
                .call(xAxis);

            var timeseries= svg.append("g")
                .attr("class","time bars series")
                // .attr("transform", "translate(" + (vizWidth-timeWidth-70) + "," +(vizHeight-timeHeight-100)  + ")")  


            // Draw bars. 
            var bars = timeseries.append("g")
                .attr("class","bars")
                .selectAll(".count")
                .data(timeData, function(d) { return d.date; });

            bars.exit().remove();
                
            bars.transition().duration(1000)
                .attr("x", function(d) { return x(d.date) - timeWidth/timeData.length/2; })
                .attr("width", timeWidth / timeData.length)
                .attr("y", function(d) { return y(d.count); })
                .attr("height", function(d) { return timeHeight - y(d.count);});
                
            bars.enter().append("rect")
                .attr("class", "count")
                .attr("width", timeWidth / timeData.length)
                .attr("x", function(d) { return x(d.date) - (timeWidth/timeData.length)/2; })
                .attr("y", timeHeight)
                .attr("height", 0)
                .transition().duration(1000)
                .attr("y", function(d) { return y(d.count); })
                .attr("height", function(d) { return timeHeight - y(d.count);});

            timeseries.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + timeHeight + ")")
                .call(xAxis)
                .selectAll("text")
                    .attr("font-family", "sans-serif")
                    .attr("fill", "#4B4B4B")
                    .attr("font-size", 10)
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", function(d) {
                        return "rotate(-65)" 
                        })
                    // .attr("transform", "rotate(-90)" );

            timeseries.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(0,0)")
                .call(yAxis)
                .selectAll("text")
                    .attr("font-family", "sans-serif")
                    .attr("fill", "#4B4B4B")
                    .attr("font-size", 10)
            
            timeseries.select(".y")
                .append("text") // caption
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .attr("text-anchor", "middle")  
                    .attr("font-family", "sans-serif")
                    .attr("fill", "#4B4B4B")
                    // .style("text-decoration", "bold")  
                    .attr("font-size", 10)
                    .text("Qty per day (tweets)")

        }

// INIT /////////////////////////////////////////////////////////
    
    communitiesDisplay=function() {

        if(communitiesForceStarted) {
            $(".arcs").show();
            $(".mapusers").hide();
            communities.call(communitiesForce.drag)
            communitiesForce.start();
            communities.on("mouseover",function(d){
                // console.log(d)
                showUserInfo(d);

            })

        } else {

            communitiesForce.stop();
            $(".arcs").hide();
            $(".mapusers").show();
            updateCommunityXY();
            communities.on('click', function (d) {

                    // select / remove node on click
                    var isSelected=selectedCommunity.indexOf(d.id)
                    if (isSelected == -1)selectedCommunity.push(d.id);
                    else selectedCommunity.splice(isSelected,1)

                    // infobox
                    // initViz();
            })
            
            updateCommunityXY();
            tickCommunity()
        }
    }

    centroidsDisplay=function() {
        updateCentroidsXY();
        tickMapToCommunities();
        tickCentroids(); 
        mapCommunitiesXY();
        tickProvince2Province();
        tickMapToCommunities();
        // tickMapToCommunities();
    }

    updateSelection=function (selection){
        selectedCommunity=selection;
        initViz();
    }

    initViz=function() {

        // init
        viz.selectAll("*").remove()

        // coordinates
        updateCentroidsXY();
        updateWordXY(); // sort data
        // mapCommunitiesXY();

        // setup
        setupSVG();

        // draw
        drawTimeSerie();
        
        drawWords();
        tickWords();
        
        drawCommunity();
        drawCommunityPath();
        tickArrows();
        communitiesDisplay();

        
        drawCentroids();
        tickMapToCommunities();

        drawWordPath();
        
        drawLegend();
        setupSliders();

        drawMap();
        if(!centroidsOnMap) $(".map").hide();
        else $(".map").show();


        drawProvince2Province();


        // $(".text").toggle();
        // $(".force").toggle();
        // $(".mapusers").toggle();

      
        // drawMapCommunities();
        // drawUsers();
        // drawMapToUsers()
    }

    initViz();
    

// UTILS //////////////////////////////////////////////////////////

    // Toggle children.
    function toggleChildren(d) {
      if (d.children) {
        d.children = null;
      } else {
        d.children = d.users;
      }
    }

    function toggleWords(d, words) {
      d.words=words;
    }

    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 0.7, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy );
            while (word = words.pop()) {
              line.push(word);
              tspan.text(line.join(" "));
              if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy ).text(word);
              }
            }
          });
        }
    }

}

// BUTTONS //////////////////////////////////////////////////////////


$(".btn-wordforce").click(function(e){
    wordForceStarted=(wordForceStarted)?false:true;
    tickWords();  
    var txt='<span class="glyphicon glyphicon-comment"></span> ';
    txt+=(wordForceStarted) ?  "Words Graph" : "Words Cloud";
    $(".btn-wordforce").html(txt);
})

$(".btn-centroids").click(function(e){

    centroidsOnMap=(centroidsOnMap)? false:true;

    if(!centroidsOnMap) $(".map").hide();
    else $(".map").show();

    centroidsDisplay();
    var txt='<span class="glyphicon glyphicon-map-marker"></span> ';
    txt+=(centroidsOnMap)?"List Provinces":"Place on Map";
    $(this).html(txt);
})

$(".btn-sortCentroids").click(function(e){

    centroidsSort=$(this).attr("rel");
    console.log(centroidsSort);
    
    $(".btn-sortCentroids").removeClass("active");
    $(this).addClass("active");

    centroidsDisplay();
})

$(".btn-userlayout").click(function(e){
    communitiesForceStarted=(communitiesForceStarted)? false : true;
    communitiesDisplay()
    var txt=(communitiesForceStarted)? "<span class='glyphicon glyphicon-globe'></span> Provinces Graph" : "<span class='glyphicon glyphicon-user'></span> Discussion Graph";
    $(".btn-userlayout").html(txt);
})

$(".btn-showall").click(function(e){
    updateSelection([]); // init selection with an empty array
})

$(".btn-btwcent").click(function(e){
    communitySort=(communitySort == "btwCent")? "maxBtwCent":"btwCent";
    console.log("btwCent",communitySort);
    updateCommunityXY();
    tickCommunity();
    // $(this).html((communitySort == "btwCent")? "maxBtwCent":"btwCent");
})


$(".switchs button").each(function(e){
    var n=$(this).attr("class").split(" ")[$(this).attr("class").split(" ").length-1].slice(4);
    // console.log($("."+n)).attr("class")
    $(this).addClass( ($("."+n).css('display') != 'none')? "active":"" );

    $(this).click(function(e){
        $("."+n).toggle()
        $(this).removeClass( ($("."+n).css('display') != 'none')? "":"active" );
        $(this).addClass( ($("."+n).css('display') != 'none')? "active":"" );
    })
})


// 

function setupSliders() {

    var communityLinkDistance = $('.communities-options .linkDistance')
        .slider({'value': communitiesForce.linkDistance()})
        .on('slideStop', function(e){
            communitiesForce.linkDistance(e.value);
            communitiesForce.stop()
            communitiesForce.start();
        })

    var communityGravity = $('.communities-options .gravity')
        .slider({"value":communitiesForce.gravity()})
        .on('slide', function(e){
            communitiesForce.gravity(e.value);
        })

    var communityCharge = $('.communities-options .charge')
        .slider({"value":communitiesForce.charge()})
        .on('slideStop', function(e){
            communitiesForce.charge(e.value);
            communitiesForce.start();
        }) 


    var wordLinkDistance = $('.word-options .linkDistance')
        .slider({'value': wordForce.linkDistance()})
        .on('slideStop', function(e){
            wordForce.linkDistance(e.value);
            wordForce.stop()
            wordForce.start();
        })

    var wordGravity = $('.word-options .gravity')
        .slider({'value': wordForce.gravity()})
        .on('slide', function(e){
            wordForce.gravity(e.value);
        })

    var wordCharge = $('.word-options .charge')
        .slider({'value': wordForce.charge()})
        .on('slideStop', function(e){
            wordForce.charge(e.value);
            wordForce.start();
        }) 
}