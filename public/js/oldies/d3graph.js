// get the data
function drawD3Graph(graphFile) {
    d3.json(graphFile, function(error, data) {

        // console.log(data);

        var graph_width = 1260,
            graph_height = 800;


        var color = d3.scale.category20b();

        var scale_size=d3.scale.linear().domain([0, 0.1]).range([5, 30]);

        
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

        var force = d3.layout.force()
            .nodes(data.nodes)
            .links(data.edges)
            .size([graph_width, graph_height])
            .linkDistance(30)
            .charge(-120)
            .gravity(0.3)
            .on("tick", tick)
            .start();
        
        // console.log(force.nodes());
        // console.log(force.links());

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
            .style("stroke", function(d) { return "#000" })
            .style("stroke-opacity", function(d) { return d.weight/10 })
            .attr("marker-end", "url(#end)")
            .style("stroke-width", function(d) {  return 3 });
            
        // build the arrow.
        svg.append("defs")
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
        var node = svg.selectAll(".node")
            .data(force.nodes())
          .enter().append("g")
            .attr("class", "node")
            .on("mouseenter", display_info)
            .call(force.drag);

        // console.log(node)

        // add the nodes
        node.append("circle")
            .style("fill", function(d) { return color(d.community); })
            .attr("r", function(d) { return scale_size(d.btw_cent) }) 
            ;


        // add the text 
        // node.append("text")
        //     .attr("x", 12)
        //     .attr("dy", ".35em")
        //     .text(function(d) { return d.name; });


        function tick() {
            path.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

            node.attr("transform", function(d) { 
                    return "translate(" + d.x + "," + d.y + ")"; });
        }

        function display_info(d){
            d3.select(".nodeinfo").selectAll("li").remove()
            var i=0;
            for (var key in d) {
                d3.select(".nodeinfo")
                    .append("li").append("p").text(key + " : "+d[key])
                i++;
            }
        }

    });
}