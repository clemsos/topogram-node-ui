function drawD3Layers(graphFile, mapFile) {

    map_width=800;
    map_height=550;


// LOAD DATA /////////////////////////////////////////////////////////////
    queue()
        .defer(d3.json, "maps/zh-mainland-provinces.topo.json") // mainland
        .defer(d3.json, "maps/zh-chn-twn.topo.json") // taiwan 
        .defer(d3.json, "maps/zh-hkg-mac.topo.json") // hk and macau
        .defer(d3.json, mapFile)
        .defer(d3.json, graphFile)
        .await(drawMap); // function that uses files

// SETUP /////////////////////////////////////////////////////////////

    // create SVG map
    var map_svg = d3.select("#map").append("svg")
        .attr("width", map_width)
        .attr("height", map_height)
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("viewBox", "0 0 " + map_width + " " + map_height);

    var projection = d3.geo.mercator()
        .center([116,39])
        .scale(600);

    var path = d3.geo.path()
        .projection(projection);

    var user_nodes = [],
        umap = [],
        user_map_edges = [];

    var color;

    var userColor = d3.scale.category20b();
    var userScaleSize=d3.scale.linear().domain([0, 0.1]).range([5, 30]);

    function drawMap(error,mainland,taiwan,hkmacau,mapData,graphData) {
        
        // DATA : parse data properly

        // sort provinces 
        mapData.provinces.map(function(d) { umap[d.name]=d.count });
        delete(umap[null]);
        delete(umap[0]);
        // console.log(umap);

        var v = Object.keys(umap).map(function(k){return umap[k]})
        // console.log(v);

        // COLORS
        // define color scale
        var colorScale = d3.scale.linear()
                   .domain(d3.extent(v))
                   .interpolate(d3.interpolateHcl)
                   .range(["white","red"]);

        // add grey color if no values
        color = function(i){ 
            if (i==undefined) {return "#cccccc"}
            else return colorScale(i)
        }

// MAP ///////////////////////////////////////////////////////////////
    
    function drawMap() {
        drawMainland(error,mainland);
        drawTaiwan(error,taiwan);
        drawHkMacau(error,hkmacau);
    }

// USER GRAPH ///////////////////////////////////////////////////////////////

    function drawUserGraph(graphData) {

        // Load Graph Data
        var userNodes=graphData.users.nodes;
        var userEdges=graphData.users.edges;

        // console.log(graphData,userEdges,userNodes)

        // parse nodes
        var myUserNodes = {};
        for (var i = 0; i < userNodes.length; i++) {
            myUserNodes[userNodes[i]["name"]] =userNodes[i]
        };

        // Compute the distinct nodes from the links.
        userEdges.forEach(function(link) {            
            link.source = myUserNodes[link.source] || 
                (nodes[link.source] = {name: link.source});
            link.target = myUserNodes[link.target] || 
                (myUserNodes[link.target] = {name: link.target});
            link.value = +link.weight;
        });

        var userForce = d3.layout.force()
            .nodes(userNodes)
            .links(userEdges)
            .size([map_width,map_height])
            .linkDistance(30)
            .charge(-120)
            .gravity(0.3)
            .on("tick", userTick)
            .start();

        var userGraph=map_svg.append("g").attr('class', "graph");

        // add the links and the arrows
        var userGraphPath = userGraph.append("g")
          .attr("class","user-paths")
          .selectAll("path")
            .data(userForce.links())
          .enter() //.append("svg:path")
            .append("line")
            .attr("class", "link")
            .style("stroke", function(d) { return "#000" })
            .style("stroke-opacity", function(d) { return d.weight/10 })
            .attr("marker-end", "url(#end)")
            .style("stroke-width", function(d) {  return 3 });
            
        // build the arrow.
        var userGraphArrows= userGraph.append("defs")
          .attr("class","arrows")
          .selectAll("marker")
            .data(["end"])
          .enter().append("svg:marker")
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markergraph_Width", 6)
            .attr("markergraph_Height", 6)
            .attr("orient", "auto")
          .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");  
        
        // define the nodes
        var userGraphNode = map_svg.append("g")
          .attr("class","users")
          .selectAll(".node")
            .data(userForce.nodes())
          .enter().append("g")
            .attr("class", "node")
            // .on("mouseenter", display_info)
            .call(userForce.drag);

        // add the nodes
        userGraphNode.append("circle")
            .style("fill", function(d) { return userColor(d.community); })
            .attr("r", function(d) { return 5 }) //userScaleSize(d.btw_cent) }) 
            ;


        function userTick() {
            userGraphPath.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

            userGraphNode.attr("transform", function(d) { 
                    return "translate(" + d.x + "," + d.y + ")"; });

        }
    }
        
// USER PLOT //////////////////////////////////////////////////////////////

    // Load Graph Data
    var userNodes=graphData.users.nodes;
    var userEdges=graphData.users.edges;

    // console.log(graphData,userEdges,userNodes)

    // parse nodes
    var myUserNodes = {};
    for (var i = 0; i < userNodes.length; i++) {
        myUserNodes[userNodes[i]["name"]] =userNodes[i]
    };

    // Compute the distinct nodes from the links.
    userEdges.forEach(function(link) {            
        link.source = myUserNodes[link.source] || 
            (nodes[link.source] = {name: link.source});
        link.target = myUserNodes[link.target] || 
            (myUserNodes[link.target] = {name: link.target});
        link.value = +link.weight;
    });

    var userGraph=map_svg.append("g").attr('class', "graph");

// USER PROVINCES ///////////////////////////////////////////////////////////////
        
    function drawUserMapEdges() {

        // Get provinces centroids
        var mapCentroids=[];
        var mapFeatures= [topojson.feature(mainland, mainland.objects.provinces).features,topojson.feature(taiwan, taiwan.objects.layer1).features.filter(function(d) { return d.properties.GU_A3 === 'TWN'; }),topojson.feature(hkmacau, hkmacau.objects.layer1).features]

        
        for (var i = 0; i < mapFeatures.length; i++) {
            mapFeatures[i].forEach(function(d, i) {

                if (d.id === 2 || d.id === 15 || d.id === 72) return; // lower 48
                var centroid = path.centroid(d);
                if (centroid.some(isNaN)) return;
                centroid.x = centroid[0];
                centroid.y = centroid[1];
                centroid.cx = centroid[0];
                centroid.cy = centroid[1];
                centroid.feature = d;
                if (d.properties.name != undefined) centroid.name=d.properties.name
                else if (d.properties.name==undefined && d.properties.NAME=="Taiwan") centroid.name='Taiwan';
                else if (d.properties.name==undefined && d.properties.NAME=="Macao") centroid.name='Aomen';
                else centroid.name='Xianggang';

                centroid.type="province";
                // centroid.color="#ccc";    
                mapCentroids.push(centroid);
            });
        };
        console.log(mapCentroids)

        var mapUsersEdges=[];
        for (var i = 0; i < userNodes.length; i++) {
            mapUsersEdges.push({"source" : userNodes[i].province, "target" : userNodes[i].name})
        };

        // add provinces centroids to nodes
        mapUsersNodes=userNodes.concat(mapCentroids);

        // parse nodes
        var myMapUsersNodes = {};
        for (var i = 0; i < mapUsersNodes.length; i++) {
            myMapUsersNodes[mapUsersNodes[i]["name"]] =mapUsersNodes[i]
        };
        // console.log(myMapUsersNodes);

        // Compute the distinct nodes from the links.
        mapUsersEdges.forEach(function(link) {
            if (link.source != "Qita" && link.source != 0 && link.source !="Haiwai") {
                // console.log(link.source,link.target)
                link.source = myMapUsersNodes[link.source] || 
                    (myMapUsersNodes[link.source] = {name: link.source});
                link.target = myMapUsersNodes[link.target] || 
                    (myMapUsersNodes[link.target] = {name: link.target});
            }
        });

        // Draw centroids
        var provinceNodes = map_svg.append("g")
            .attr("class", "mapCentroids")
            .selectAll(".node")
                .data(mapCentroids)
          .enter().append("g")
            .attr("class", "node")
            .attr("class", function(d){ return "node_"+d.type})
            .attr("transform", function(d) { return "translate(" + d.cx + "," + d.cy + ")"; })
            // .call(mapForce.drag);

        provinceNodes.append("circle")
            .attr("r", 5)
            .style("fill", function(d) {return d.color})

        var userMap = map_svg.append("g")
          .attr("class","users-map")
          
        var userMapPath= userMap.selectAll("path")
            .data(mapUsersEdges)
          .enter() //.append("svg:path")
            .append("line")
            .attr("class", "link")
            .style("stroke", function(d) { return "#CCC" })
            .style("stroke-opacity", function(d) { return 0.3 })
            .style("stroke-width", function(d) {  return 1 });
            // .on("tick", userMapTick);

        userMapTick();

        console.log(userMapPath)
            
        function userMapTick() {
            console.log("ok")
            redrawUserMapEdges();
            userMap.transition()
            .duration(500)
            .each("end", userMapTick);
        }

        function redrawUserMapEdges() {
            userMapPath
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; })
        }
    }

// WORD GRAPH ///////////////////////////////////////////////////////////////
        
    function drawWordGraph(graphData) {

        console.log(graphData);

        var wordNodes=graphData.words.nodes;
        var wordEdges=graphData.words.edges;

        var maxRadius=100,
            charge=-500,
            gravity=.5,
            linkDistance=102;

        var wordScaleSize=d3.scale.linear().domain([100, 3000]).range([65, maxRadius]);
        var wordScaleFont=d3.scale.linear().domain([100, 3000]).range([15, 80]);
        var wordColor = d3.scale.category20b();

        // parse nodes
        var myWordNodes = {};
        for (var i = 0; i < wordNodes.length; i++) {
            myWordNodes[wordNodes[i]["name"]] =wordNodes[i]
        };

        // Compute the distinct nodes from the links.
        wordEdges.forEach(function(link) {            
            link.source = myWordNodes[link.source] || 
                (myWordNodes[link.source] = {name: link.source});
            link.target = myWordNodes[link.target] || 
                (myWordNodes[link.target] = {name: link.target});
            link.value = +link.weight;
        });

        var wordForce = d3.layout.force()
            .nodes(wordNodes)
            .links(wordEdges)
            .size([map_width, map_height])
            .linkDistance(linkDistance)
            .charge(charge)
            .gravity(gravity)
            .on("tick", wordTick)
            .start();

        // define the nodes
        var wordNodesText = map_svg.append("g")
        .attr("class", "words")
        .selectAll("path")
            .data(wordForce.nodes())
          .enter().append("g")
            .attr("class", "node")
            .call(wordForce.drag);

        // add the nodes
        wordNodesText.append("rect")
            // .classed('data', true)
            .attr("width", function(d) { return wordScaleSize(d.count) })
            .attr("height", function(d) { return 20 })
            .style("fill", function(d) {  return "transparent"; })
            .style("stroke", function(d) { return "transparent" })
            ;

        wordNodesText.append("text")
            .attr("dx", 12)
            .attr("dy", 15)
            .style("font-size", function(d) { return wordScaleFont(d.count) })//scale_size(d.btw_cent) })
            .style("fill", function(d) {  return wordColor(d.count) })
            .attr("text-anchor", "middle") // text-align: right
            .text(function(d) { return d.name });

        // add the links 
        var wordPath = map_svg.append("g")
           .attr("class", "word-paths")
           .selectAll("path")
            .data(wordForce.links())
          .enter() //.append("svg:path")
            .append("line")
            .attr("class", "word-link")
            .style("stroke", function(d) { return "#CCC" })
            .style("stroke-opacity", function(d) { return 0.3 })
            .style("stroke-width", function(d) {  return 1 });

         function wordTick(e) {

            wordPath.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });        

            wordNodesText.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        } 
    }

// drawUserGraph(graphData)
// drawWordGraph(graphData)

    }


// FUNCTIONS //////////////////////////////////////////////////////////////
    // Mainland provinces
    function drawMainland(error, cn) {
        
        // var codes=[];
        // for (var i = 0; i < topojson.feature(cn, cn.objects.provinces).features.length; i++) {
        //     codes.push(topojson.feature(cn, cn.objects.provinces).features[i].properties.name)
        //     console.log(topojson.feature(cn, cn.objects.provinces).features[i])
            
        // };
        // console.log(codes);

        map_svg.append("g")
            .attr("class", "map")
            .append("g")
            .attr("class", "mainland")
            .selectAll("path")
            .data(topojson.feature(cn, cn.objects.provinces).features)
            .enter()
            .append("g")
            .attr("class", "province")
            .append("path")
            .attr("d", path)
            .attr("id", function(d) { return d.id; })
            .attr("class", "province")
            .attr("fill", "#cccccc")
            .attr("fill", function(d) { return color(umap[d.properties.name]); })
            .attr("stroke", "black")
            .attr("stroke-width", "0.35");

            // .text(function(d) {return "hha"});
    }

    // Taiwan
    function drawTaiwan(error, cn) {
        // console.log(error)
        // console.log(topojson.feature(cn, cn.objects.layer1))

        // Taiwan
        map_svg.select(".map")
            .append('g')
            .attr("class", "taiwan")
            .selectAll("path")
            .data(topojson.feature(cn, cn.objects.layer1).features.filter(function(d) { return d.properties.GU_A3 === 'TWN'; }))
            .enter()
            .append("path")
            .attr("d", path)
            .attr("id", function(d) { return d.id; })
            .attr("class", "province")
            .attr("fill", "#cccccc")
            .attr("fill", function(d) { return color(umap["Taiwan"]); })
            .attr("stroke", "black")
            .attr("stroke-width", "0.35");
    }

    // HK and Macau
    function drawHkMacau(error, cn) {
        // console.log(error)
        
        // console.log(topojson.feature(cn, cn.objects.layer1).features.filter(function(d) { return d.properties.GU_A3 === "HKG" }))

        var projection2 = d3.geo.mercator()
        .center([126,17])
        .scale(2000);

        var path2 = d3.geo.path()
            .projection(projection2);
      
        map_svg.select('.map')
            .append("g")
            .attr("class", "hk")
            .attr("transform", "translate(50,"+(map_height-120)+")")
            .selectAll("path")
            .data(topojson.feature(cn, cn.objects.layer1).features)
            .enter()
            .append("path")
            .attr("d", path2)
            .attr("id", function(d) { return d.id; })
            .attr("class", "province")
            .attr("fill", function(d) { return color(umap["Xianggang"]); })
            .attr("stroke", "black")
            .attr("stroke-width", "0.35");

        map_svg.select(".hk")
            .append("text") //add some text
            .attr("dx", function(d){return 20})
            .attr("dy", function(d){return 35})
            .attr("font-family", "sans-serif")
            .attr("fill", "#aaaaaa")
            .attr("font-size", 10)
            .text("Hong Kong & Macau")

        // add demarcation
        map_svg.select(".hk")
           .append("svg:line")
             .attr("x1", 30)
             .attr("y1", -10)
             .attr("x2", 150)
             .attr("y2", 20)
             .style("stroke", "#cccccc")
             .style("stroke-width", 3);
        
        map_svg.select(".hk")
            .append("svg:line")
             .attr("x1", 150)
             .attr("y1", 20)
             .attr("x2", 150)
             .attr("y2", 60)
             .style("stroke", "#cccccc")
             .style("stroke-width", 3);
    }

    // TODO : rest of the world - Haiwai / Qita

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

// BUTTONS //////////////////////////////////////////////////////////////

    function toggleGraph() {
        $(".graph").toggle()
    }

    function toggleUsers() {
        $(".users").toggle()
    }

    function toggleMap() {
        $(".map").toggle()
    }

    function toggleMapCentroids() {
        $(".mapCentroids").toggle()
    }

    function toggleUserMaps() {
        $(".users-map").toggle()
    }

    function toggleWordsPath() {
        $(".word-paths").toggle()
    }

    function toggleWords() {
        $(".words").toggle()
    }
