var projection, path;

function drawD3Map(mapFile) {

    map_width=300;
    map_height=300;
    // LOAD DATA
    queue()
        .defer(d3.json, "maps/zh-mainland-provinces.topo.json") // mainland
        .defer(d3.json, "maps/zh-chn-twn.topo.json") // taiwan 
        .defer(d3.json, "maps/zh-hkg-mac.topo.json") // hk and macau
        .defer(d3.json, mapFile)
        .await(drawMap); // function that uses files

    // DRAW 
    // create SVG map
    var map_svg = d3.select("#map").append("svg")
        .attr("width", map_width)
        .attr("height", map_height)
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("viewBox", "0 0 " + map_width + " " + map_height);

    projection = d3.geo.mercator()
        .center([180,8])
        .scale(250);

    path = d3.geo.path()
        .projection(projection);

    var umap = [];
    var color;

    // DRAW
    function drawMap(error,mainland,taiwan,hkmacau,data) {
        
        // DATA 
        // console.log(data)
        // parse data properly
        
        data.provinces.map(function(d) {umap[d.name]=d.count });
        delete(umap[null]);
        delete(umap[0]);

        var v = Object.keys(umap).map(function(k){return umap[k]})
        // console.log(v);

        // COLORS

        // province color scale
        var pro={}, i=0, val=[];
        for(key in umap) { pro[key]=i; i++; val.push(umap[key])}
        
        // range of green with grey color if no values
        // var greens=d3.scale.quantize().domain(d3.extent(val)).range(colorbrewer.Greens[9]);
        var greens=d3.scale.linear().domain([1,5]).range(["black","white"]);

        color = function(key){ return (key==undefined)? "#cccccc" : greens(key) };

        // BACKGROUND
        /*
        map_svg.append("g")
            .attr("class", "background")
            .append("rect")
            .attr("class", "background")
            .attr("width", map_width)
            .attr("height", map_height)
            .attr("fill", "#eeeeee")
            .attr("stroke", "black")
            .attr("stroke-width", "0.35");

        // TITLE AND INFOS
        map_svg.append('g')
            .attr("class","info")
            .attr("transform", "translate("+(map_width-140)+","+(map_height-180)+")")
            .append("rect")
            .attr({fill : "transparent", map_height: 160,map_width:160})

        map_svg.select('.info')
            .append("g")
            .attr("class", "title")
            .append("text")
            // .attr("dx", function(d){return 35})          
            .attr("transform", "translate(0,-70)")
            .attr("dy", function(d){return 16})
            .attr("text-anchor", "middle")  
            .attr("font-family", "sans-serif")
            .attr("fill", "#4B4B4B")
            .style("text-decoration", "bold")  
            .text(data.title)
            .attr("font-size", 16)
            .call(wrap, 150);

        map_svg.select('.info')
            .append("g")
            .attr("class","legend")
            .append("text")
            .attr("dx", function(d){return 0})          
            .attr("dy", 12 )
            .attr("text-anchor", "middle")  
            .attr("font-family", "sans-serif")
            .attr("fill", "#aaaaaa")
            .attr("font-size", 12)
            .text(data.desc)
            .call(wrap, 150);

        map_svg.select('.info')
            .append("g")
            .attr("class","scale")
            .attr("transform", "translate(-30,115)")
            .append("svg:polyline")     
            .attr("points", "0,-5 0,0 80,0 80,-5")
            .style("stroke", "#cccccc")
            .style("stroke-width", 1)
            .attr("fill", "transparent");

        map_svg.select('.scale')
            .append("text")
            .attr("dx", 40)          
            .attr("dy", -8 )
            .attr("text-anchor", "middle")  
            .attr("font-family", "sans-serif")
            .attr("fill", "#aaaaaa")
            .attr("font-size", 9)
            .text("100km")

            // .call(wrap, 150);

        
        map_svg.select('.info')
            .append("g")
            .attr("class","credits")
            .attr("transform", "translate(0,140)")
            .append("text")
            .attr("dx", function(d){return 0})          
            .attr("dy", 9 )
            .attr("text-anchor", "middle")  
            .attr("font-family", "sans-serif")
            .attr("fill", "#aaaaaa")
            .attr("font-size", 11)
            .text(data.credits)
            .call(wrap, 150);
        */

        // CAPTION
        // Color bar adapted from http://tributary.io/tributary/3650755/
        var cw=10;
        map_svg.append("g")
            .attr("class","caption")
            .append("g")
            .attr("class","color-bar")
            .selectAll("rect")
            .data(d3.range(d3.min(v), d3.max(v), (d3.max(v)-d3.min(v))/50.0))
            .enter()
            .append("rect")
            .attr({width: cw,
                  height: 5,
                  y: function(d,i) { return map_height-cw-i*5 },
                  x: map_width-50,
                  fill: function(d,i) { return color(d); } })

        /*
        map_svg.select(".caption")
            .append("g")
            .attr("transform", "translate(" + (map_width-cw) + "," + (map_height-cw-5*49) + ")")
            .call(d3.svg.axis()
                   .scale(d3.scale.linear().domain(d3.extent(v)).range([5*50,0]))
                    .orient("right"))
            .attr("font-family", "sans-serif")
            .attr("fill", "#4B4B4B")
            .attr("font-size", 10)
        */
        map_svg.select('.caption')
            .append("g")
            .attr("class","units")
            .attr("transform", "translate("+(map_width-cw-10)+","+(map_height/2-cw)+")")
            // .attr("transform", "rotate(90 "+(map_width-cw)+","+(map_height/2-cw)+")")
            .append("text")
            .attr("dx", -5)          
            .attr("dy", 2 )
            .attr("text-anchor", "middle")  
            .attr("font-family", "sans-serif")
            .attr("fill", "#4b4b4b")
            .attr("font-size", 10)
            .attr("transform", "rotate(-90)")//function(d){ console.log(d); return "rotate(90 "+d.x+","+d.y+")"})          
            .text(data.units)
            // .call(wrap, 50);

        drawProvinces(error,mainland);
        drawTaiwan(error,taiwan);
        drawHkMacau(error,hkmacau);
    }

    // Mainland provinces
    function drawProvinces(error, cn) {
        
        // var codes=[];
        // for (var i = 0; i < topojson.feature(cn, cn.objects.provinces).features.length; i++) {
        //     codes.push(topojson.feature(cn, cn.objects.provinces).features[i].properties.name)
            
        // };
        // console.log(codes);

        map_svg.append("g")
            .attr("class", "map")
            .append("g")
            .attr("class", "mainland")
            .selectAll("path")
            .data(topojson.feature(cn, cn.objects.provinces).features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("id", function(d) { return d.id; })
            .attr("class", "province")
            .attr("fill", "#cccccc")
            .attr("fill", function(d) { return color(umap[d.properties.name]); })
            .attr("stroke", "#ccc")
            .attr("stroke-width", "0.35");
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
            .attr("stroke", "#ccc")
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
            .attr("transform", "translate(0,"+(map_height-120)+")")
            .selectAll("path")
            .data(topojson.feature(cn, cn.objects.layer1).features)
            .enter()
            .append("path")
            .attr("d", path2)
            .attr("id", function(d) { return d.id; })
            .attr("class", "province")
            .attr("fill", function(d) { return color(umap["Xianggang"]); })
            .attr("stroke", "#ccc")
            .attr("stroke-width", "0.15");

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
             .attr("x2", 130)
             .attr("y2", 20)
             .style("stroke", "#cccccc")
             .style("stroke-width", 1);
        
        map_svg.select(".hk")
            .append("svg:line")
             .attr("x1", 130)
             .attr("y1", 20)
             .attr("x2", 160)
             .attr("y2", 60)
             .style("stroke", "#cccccc")
             .style("stroke-width", 1);

    }

    // TODO : rest of the world - Haiwai


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