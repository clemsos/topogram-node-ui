function drawD3Graph(graphFile) {
    d3.json(graphFile, function(error, data) {

        // console.log(data);

        var graph_width = 1260,
            graph_height = 800,
            padding = 6, // separation between nodes
            maxRadius=100,
            charge=-500,
            gravity=.5,
            linkDistance=102;


        var color = d3.scale.category20b();
        var scale_size=d3.scale.linear().domain([100, 3000]).range([65, maxRadius]);
        var scale_font=d3.scale.linear().domain([100, 3000]).range([15, 80]);

        // parse nodes
        var nodes = {};
        for (var i = 0; i < data.nodes.length; i++) {
            nodes[data.nodes[i]["name"]] =data.nodes[i]
        };

        // Compute the distinct nodes from the links.
        data.edges.forEach(function(link) {            
            link.source = nodes[link.source] || 
                (nodes[link.source] = {name: link.source});
            link.target = nodes[link.target] || 
                (nodes[link.target] = {name: link.target});
            link.value = +link.weight;
        });

        // console.log(data);

        var force = d3.layout.force()
            .nodes(data.nodes)
            .links(data.edges)
            .size([graph_width, graph_height])
            .linkDistance(linkDistance)
            .charge(charge)
            .gravity(gravity)
            .on("tick", tick)
            .start();

        // console.log(force.links())

         var svg = d3.select("#graph")
            .append("svg")
            .attr("width", graph_width)
            .attr("height", graph_height)
            .attr("preserveAspectRatio","xMinYMin meet")
            // .attr("viewBox","0 0 600 1500")
            .append("g").attr('class', "graph");

        // add the links and the arrows
        var path = svg.append("g").selectAll("path")
            .data(force.links())
          .enter() //.append("svg:path")
            .append("line")
            .attr("class", "link")
            .style("stroke", function(d) { return "#CCC" })
            .style("stroke-opacity", function(d) { return 0.3 })
            .attr("marker-end", "url(#end)")
            .style("stroke-width", function(d) {  return 1 });


        // define the nodes
        var node = svg.selectAll(".node")
            .data(force.nodes())
          .enter().append("g")
            .attr("class", "node")
            .call(force.drag);
            // .on("mouseenter", display_info)

        // console.log(node)

        // add the nodes
        node.append("rect")
            // .classed('data', true)
            .attr("width", function(d) { return scale_size(d.count) })
            .attr("height", function(d) { return 20 })
            .style("fill", function(d) {  return "transparent"; })
            .style("stroke", function(d) { return "transparent" })
            ;

        node.append("text")
            .attr("dx", 12)
            .attr("dy", 15)
            .style("font-size", function(d) { return scale_font(d.count) })//scale_size(d.btw_cent) })
            .style("fill", function(d) {  return color(d.count) })
            .attr("text-anchor", "middle") // text-align: right
            .text(function(d) { return d.name });

        // force.stop();

        function tick(e) {

            // path.attr("x1", function(d) { return d.source.x; })
            //         .attr("y1", function(d) { return d.source.y; })
            //         .attr("x2", function(d) { return d.target.x; })
            //         .attr("y2", function(d) { return d.target.y; });        

            node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        }

    });

    
}