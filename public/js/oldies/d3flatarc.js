function drawD3Layers(graphFile) {

    map_width=1500;
    map_height=1000;

    var viz = d3.select("#flat").append("svg")
            .attr("width", map_width)
            .attr("height", map_height)
            .attr("preserveAspectRatio", "xMidYMid")
            .attr("viewBox", "0 0 " + map_width + " " + map_height);
    
    var userColor = d3.scale.category20b();
    var userPathColor = d3.scale.category20b();

// LOAD DATA /////////////////////////////////////////////////////////////
    d3.json(graphFile, function(error, graphData) {


        // Load Graph Data
        var userNodes=graphData.users.nodes;
        var userEdges=graphData.users.edges;
        var userCommunities = [];
        // console.log(graphData,userEdges,userNodes)

        var usersX={}
        var communitiesX={}
        var communitiesY=518;

        // parse nodes
        var myUserNodes = {};
        var myUserCommunities = {};
        for (var i = 0; i < userNodes.length; i++) {
             
            myUserNodes[userNodes[i]["name"]] =userNodes[i]
            
            if(myUserCommunities[userNodes[i]["community"]] == undefined) myUserCommunities[userNodes[i]["community"]]=[]
            myUserCommunities[userNodes[i]["community"]].push(userNodes[i])        

        };

        for (var c in myUserCommunities){
            userCommunities.push( { "id": c, "users": myUserCommunities[c], "children" :null } );
        }

        // Compute the distinct nodes from the links.
        userEdges.forEach(function(link) {            
            link.source = myUserNodes[link.source] || 
                (nodes[link.source] = {name: link.source});
            link.target = myUserNodes[link.target] || 
                (myUserNodes[link.target] = {name: link.target});
            link.value = +link.weight;
        });

        // calculate communities coordinates
        var xprev=0,rprev=0;
        for (var i = 0; i < userCommunities.length; i++) {
            var r=userCommunities[i].users.length,
                x=xprev+r*2+rprev-2,
                y=399;

            communitiesX[userCommunities[i].id]=x;
            xprev=x;
            rprev=r;

        };

        var communities = viz.append("g").attr("class","communities")
            .selectAll('.community')
            .data(userCommunities.filter(function (d) { return true })) // if conditionfilter

        var arcs=viz.append("g").attr("class","arcs")
            .selectAll('.arc')
            .data(userEdges.filter(function (d) { return true })) // if conditionfilter
            .enter()
            .append('g')
            .attr('class', 'arc')


        function drawUserArcs() {
                
            arcs.each(function (d, i) {
                
                    var self = d3.select(this);

                    var startx=communitiesX[d.source.community],
                        starty=communitiesY,
                        endx=communitiesX[d.target.community],
                        endy=communitiesY;

                    // console.log(d.source.community,d.target.community,startx,endx)
                    var r = (endx - startx) * 0.51;
                    var ry = Math.min(r, 490);

                    if (!isNaN(startx) && !isNaN(endx) && !isNaN(r) && !isNaN(ry)) {
                        var path = 'M ' + startx + ','+starty+' A ' + r + ',' + ry + ' 0 0,1 ' + endx + ','+endy ;
                        self.append('path')
                            .attr('d', path)
                            .style("fill","transparent")
                            .style('opacity', .5)
                            .style('stroke', function (start, end) { return  userPathColor(d.weight);}(startx, endx));
                    }
                })
                .on('mouseover', function (d) {
                    var self = d3.select(this);
                    self.select("path")
                        .style("stroke","#000")
                        .style("opacity","1");
                })
                .on('mouseout', function (d) {
                    var self = d3.select(this);
                    self.select("path")
                        .style("stroke",function(d) { return  userPathColor(d.weight);})
                        .style("opacity",".5");
                })
        }

        function drawCommunity() {

            communities.enter()
                .append("g")
                .attr("class","community")
                .each(function (d, i) {
                    var self = d3.select(this);
                    var r=d.users.length,
                        x=communitiesX[d.id],
                        y=communitiesY;

                    self.append("circle")
                        .attr("class",function(d) { return "community_"+d.id; })
                        .attr("r",r)
                        // .attr("x",x)
                        // .attr("y",y)
                        .style("fill", function(d) { return (!d.children)? userColor(d.id) : "#000"; })
                        .attr("transform", function(d) { 
                            return "translate(" + x + "," + y + ")"; });

                    // Draw users
                    if(d.children) {
                        var childrenNodes=[]
                        d.children.forEach( function(node) {

                            // draw users

                            //     x=self.attr("x")+10;
                            //     y=self.attr("y")+10;

                            //     console.log(self,d,x,y);

                            //     self.append("circle")
                            //         .attr("class",function(d) { return "community_"+d.id; })
                            //         .attr("r",3)
                            //         .style("fill", function(d) { return userColor(d.id);})
                            //         .attr("transform", function(d) { 
                            //             return "translate(" + x + "," + y + ")"; });
                        })
                    }

                }).on('click', function (d) {
                    toggleChildren(d)
                    drawCommunity()
                })
        }
        
        drawUserArcs()
        drawCommunity()

        // Toggle children.
        function toggleChildren(d) {
          if (d.children) {
            d.children = null;
          } else {
            d.children = d.users;
          }
        }

    })
}