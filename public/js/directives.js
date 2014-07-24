 // directives.js

app.directive('timeslider', function ($parse) {
    return {
      restrict: 'E',
      replace: true,
      template: '<input type="text" />',
      link: function ($scope, element, attrs) {

        $scope.$watch('timeMax', function(updatedTimeMax, oldVal) {
            
            if(updatedTimeMax != undefined) {
                
                var model = $parse(attrs.model);
                var slider = $(element[0]).slider({
                    "max": updatedTimeMax,
                    "value": [0,updatedTimeMax]
                });

                slider.on('slide', function(ev) {
                    model.assign($scope, ev.value);

                    $scope.start=$scope.timeSeriesData[ev.value[0]].timestamp;
                    $scope.end=$scope.timeSeriesData[ev.value[1]-1].timestamp;

                    $scope.$apply();

                });

            }
        })
      }
    }
});

app.directive('timeserie', function () {
    // var chart = d3.custom.timeSerie(),
    

    return {
        replace: false,
        scope: { 
            timeData: '=timeData',
            start: '=start',
            end: '=end',
            memeName: "=memeName"

         },
        link: function ($scope, element, attrs) {
            
            // console.log("timeline binded");

            var margin = {top: 20, right: 20, bottom: 80, left: 40},
                        width = 900,
                        height = 250,
                        gap = 0,
                        ease = 'cubic-in-out',
                        bars;
            
            var duration = 500;

            var time_width = width - margin.left - margin.right,
                time_height = height - margin.top - margin.bottom;

            // Construct our SVG object.
            var svg = d3.select(element[0])
                .append("svg")
                .style("background","#fff")
                .attr("width", time_width + margin.left + margin.right)
                .attr("height", time_height + margin.top + margin.bottom)
                    .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            $scope.$watch('timeData', function(updatedTimeData, oldVal) {

                // console.log($scope.start)
                if(updatedTimeData != undefined && $scope.start!= undefined && $scope.end!= undefined) {

                    // console.log('draw timeline');

                    var _data=updatedTimeData;

                    // Scales.
                    var x = d3.time.scale().range([time_width/_data.length/2, time_width-time_width/_data.length/2]);
                    // var x = d3.scale.ordinal().rangeRoundBands([0, time_width], .05);
                    var y = d3.scale.linear().range([time_height, 0]);

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

                    // Set scale domains. 
                    x.domain(d3.extent(_data, function(d) { return d.date; }));
                    y.domain([0, d3.max(_data, function(d) { return d.count; })]);
                    
                    svg.transition().duration(duration).attr({width: width, height: height})
                    
                    // Call x-axis. 
                    d3.select(".x.axis")
                        .transition()
                        .duration(duration)
                        .ease(ease)
                        .call(xAxis);

                   
                    
                    // Draw bars. 
                    bars = svg.append("g")
                        .attr("class","timebar")
                        .selectAll(".timebar")
                        .data( _data, function(d) { return d.date; });

                    console.log($scope);
                    d3.select(".timebar")
                        .append("g")
                        .attr("transform","translate(50,10)")
                        .append("text")
                        .style("font-size",9)
                        .style("color", "#404040")
                        .text("Volume of tweets in meme "+$scope.memeName +" (year 2012)")

                    bars.transition()
                        .duration(duration)
                        .ease(ease)
                        .attr("x", function(d) { return x(d.date) - time_width/_data.length/2; })
                        .attr("width", time_width / _data.length)
                        .attr("y", function(d) { return y(d.count); })
                        .attr("height", function(d) { return time_height - y(d.count);});

                    bars.enter().append("rect")
                        .attr("class", "count")
                        .attr("width", time_width / _data.length)
                        .attr("x", function(d) { return x(d.date) - (time_width/_data.length)/2; })
                        .attr("y", time_height)
                        .attr("height", 0)
                        .style("fill", function(d){ return (d.selected)?"steelblue":"#CCC"})
                        .transition().duration(1000)
                        .attr("y", function(d) { return y(d.count); })
                        .attr("height", function(d) { return time_height - y(d.count);});

                    svg.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + time_height + ")")
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

                    svg.append("g")
                        .attr("class", "y axis")
                        .attr("transform", "translate(0,0)")
                        .call(yAxis)
                        .selectAll("text")
                            .attr("font-family", "sans-serif")
                            .attr("fill", "#4B4B4B")
                            .attr("font-size", 10)
                    
                    svg.select(".y")
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
                  
                    svg.selectAll(".domain")
                        .attr("fill", "none")
                        .attr("stroke", "#000")

                    bars.exit().transition().style({opacity: 0}).remove();

                    duration = 500;

                    function updateChart() {
                        // console.log($scope);
                      bars.data($scope.timeData)
                        .style("fill", function(d){ 
                            return (d.selected)?"steelblue":"#CCC"})
                    }

                    $scope.$watch('start', function(newStart, oldVal) {
                        if (newStart!=undefined) updateChart();
                        
                    })
                    $scope.$watch('end', function(newEnd, oldVal) {
                        if (newEnd!=undefined) updateChart();
                        
                    })
                    
                }
            })
        }
    }
});

app.directive("map", function () {
    return {
        // replace: false,
        controller: 'geoCtrl',
        restrict : "AE",
        scope: { 
            province : "="
         },
        link: function ($scope, element, attrs) {
            
            ////// SETUP
                var centroids,
                    mapFeatures,
                    centroidsSort="gdp";
                    mapY=100,
                    map_width=800,
                    map_height=500,
                    vizWidth=1000;

                var geo = d3.select(element[0]).append("svg")
                    .style("background","#fff")
                    .attr("width", map_width)
                    .attr("height", map_height)
                    .attr("preserveAspectRatio", "xMidYMid")
                    .attr("viewBox", "0 0 " + map_width + " " + map_height);

                var projection = d3.geo.mercator()
                    .center([116,39]) // china long lat 
                    .scale(vizWidth/2);

                var mapPath = d3.geo.path()
                    .projection(projection);

                var mapLegend=geo.append("g").attr("class","map-legend")
                                .attr("transform", "translate("+(50)+","+(10)+")");
                                // console.log($scope);
                var mapControls=geo.append("g").attr("class","map-controls")
                                .attr("transform", "translate("+(map_width-150)+","+(50)+")");

                $scope.$watch('memeName', function(newVal, oldVal) {
                    console.log(newVal);
                    if(newVal!=undefined) {                           
                        mapLegend.append("text")
                            .attr("dx",1)
                            .attr("dy",12)
                            .text("Users interactions by provinces for '"+newVal+"'")
                            .style("fill","#404040")
                            .style("margin-left",5)
                            .style("font-size",10)
                            .call(wrap, 115);
                    }
                })

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

                // projection for HK / Macau
                var projection2 = d3.geo.mercator()
                    .center([126,17])
                    .scale(2000);

                var path2 = d3.geo.path()
                    .projection(projection2);

                var map=geo.append("g").attr("class", "map")
                            .style("fill",'#fff')
                        // .attr("transform","translate(30,0)") 
                
                $scope.centroids=[]

                var defaultFillColor="#eee",
                    defaultStrokeColor="#404040";

            // draw map
            $scope.$watch("provincesInfo",function (val){

                if(val==undefined) return
            
                $scope.$watch('mainland', function(newVal, oldVal) {
                    if(newVal!=undefined) {
                        var features=topojson.feature(newVal, newVal.objects.provinces).features;
                        drawProvinces(features);    
                        parseCentroids(features);
                    }
                })
                
                $scope.$watch('taiwan', function(newVal, oldVal) {
                    if(newVal!=undefined) {
                        var features=topojson.feature(newVal, newVal.objects.layer1).features.filter(function(d) { return d.properties.GU_A3 === 'TWN'; })
                        parseCentroids(features)
                        drawTaiwan(features)
                    }
                })

                $scope.$watch('hkmacau', function(newVal, oldVal) {
                    if(newVal!=undefined) {
                        var features=topojson.feature(newVal, newVal.objects.layer1).features;
                        parseCentroids(features)
                        drawHkMacau(features)
                    }
                })
            })

            // draw edges
            var geoEdges= geo.append("g").attr("class","geo-path")

            var geoDefs=geo.append("defs").attr("class","geo-arrows")

            var geoStrokeColor="#428bca"
            
            // tooltip  
            var tip = d3.tip()
                  .attr('class', 'd3-tip')
                  .offset([10, 0])
                  .html(function(d) {
                    return "<small> "+ "<strong>Name: </strong><em>"+d.name+"</em><br />"+"<strong>Population: </strong><em>"+d.population+"</em><br />"+"<strong>Gdp: </strong><em>"+d.gdp+"</em>"+"</small>";
                  })

            geo.call(tip);

            // total pie
            $scope.$watch("provincesCount", function(newVal, oldVal) {
                if (newVal!= undefined) {
                    drawUserPie(d3.select(".geo-pie-container"),newVal,$scope.memeName)
                }
            })

            $scope.$watch('geoEdges', function(newVal, oldVal) {

                if(newVal==undefined || newVal==[] && $scope.centroidsXY==undefined) return
            
                d3.selectAll(".geoPath").remove();

                var geoMarkers=geoDefs.selectAll("marker")
                   .data(["end"])

                geoMarkers.enter()
                    .append("marker")
                    .attr("id", String)
                    .attr("viewBox", "0 -5 10 10")
                    .attr("refX", 10)
                    .attr("refY", 0)
                    // .attr("refY", function(d,i){
                    //     console.log(d,i);
                    //     return 5
                    // })
                    .attr("markerWidth", 2)
                    .attr("markerHeight", 2)
                    .attr("orient", "auto")
                    .append("svg:path")
                    .style("fill", function(d) { return geoStrokeColor })
                    .attr("d", "M0,-5L10,0L0,5");
                    // .style("stroke-width", 2)
                
                var geoPaths=geoEdges.selectAll(".geoPath")
                    .data(newVal)

                geoPaths.enter() 
                    .append("g")
                    .attr("class", "geoPath")
                
                var isArc=true,
                    showInternals=true;

                // edges position 
                if($scope.centroidsXY!=undefined) {
                    geoPaths.each(function (d){

                        var self=d3.select(this);
                        var p;
                        if (d.source!= d.target) {
                            
                            if(isArc) p=self.append("path")
                            else p=self.append("line")

                            if (!isArc) geoStrokeColor="red"

                            // console.log(p);
                            p.attr("stroke-width",3)
                                // .attr("stroke", "url(#grad1)")
                                .style("stroke", function(d) { return geoStrokeColor })
                                .style("stroke-opacity", function(d) { return 0.3 })
                                .style("fill","none")
                                
                            if(isArc) p.attr("marker-end", "url(#end)")

                            
                            var maxArc=200,
                                r=5,
                                x1=$scope.centroidsXY[d.source].x,
                                y1=$scope.centroidsXY[d.source].y,
                                x2=$scope.centroidsXY[d.target].x,
                                y2=$scope.centroidsXY[d.target].y,
                                dx = x1-x2,
                                dy = y1 - y2,
                                dr = Math.min(Math.sqrt(dx * dx + dy * dy),maxArc)
                                // console.log(r);

                            if(isArc)
                                p.attr("d", "M" + 
                                    x1 + "," + 
                                    y1 + "A" + 
                                    dr + "," + dr + " 0 0,1 " + 
                                    x2 + "," + 
                                    y2
                                )
                            else                 
                                p.attr("x1", x1)
                                    .attr("y1", y1)
                                    .attr("x2", x2)
                                    .attr("y2", y2)
                        
                        } else if(showInternals) {

                            var r=2,
                                x1=$scope.centroidsXY[d.source].x,
                                y1=$scope.centroidsXY[d.source].y;

                            var p=self.append("circle")

                                .attr("r",r)
                                .attr("cx", x1)
                                .attr("cy", y1)
                                .style("fill", function(d) { return geoStrokeColor })
                                // .style("stroke-opacity", function(d) { return 0.3 })
                                .style("stroke","none")
                                // .attr("marker-end", "url(#end)")

                        }

                    })
                    
                }
                
                
                


                // edges size
                if($scope.ratio!=undefined) {
                    // poids de l'échange pondéré par la population totale de Weibo
                    var geoExt=newVal.map(function(d){
                            return (d.weight*$scope.ratio[d.source])/100;
                        }),
                        geoEdgesScale=[1,10]
                        geoPathStrokeWidth=d3.scale.linear().domain(d3.extent(geoExt)).range(geoEdgesScale),
                        legendExt=d3.scale.linear().domain(geoEdgesScale).range(d3.extent(geoExt));
                    
                    if (isArc) geoPaths.selectAll("path").attr("stroke-width", function(d) {   return geoPathStrokeWidth(d.weight *($scope.ratio[d.source]/100)); })
                    else geoPaths.selectAll("line").attr("stroke-width", function(d) {   return geoPathStrokeWidth(2*d.weight *($scope.ratio[d.source]/100)); })

                    geoPaths.selectAll("circle").attr("r", function(d) {  
                        return geoPathStrokeWidth(d.weight *($scope.ratio[d.source]/100));
                    });


                    //legend
                    d3.select(".legend-rates").remove()

                    var mapRates=mapLegend.append("g")
                            .attr("class","legend-rates");


                    mapRates.append("text")
                        .attr("transform","translate(0,30)")
                        .attr("dx",1)
                        .attr("dy",10)
                        .text("User interactions rates (%) (weighted by population by province)")
                        .style("fill","#aaa")
                        .style("margin-left",5)
                        .style("font-size",10)
                        .call(wrap, 150);

                    
                    for (var i = 1; i < 4; i++) {
                        var ls=d3.scale.linear().domain([1,4]).range(geoEdgesScale)
                            strokeWidth=geoPathStrokeWidth(legendExt(ls(i))),
                            y=80+i*12+strokeWidth,
                            percent=Math.round(legendExt(ls(i))/d3.sum(geoExt)*100);

                        mapRate=mapRates.append("g")

                        mapRate.append("text")
                            .attr("dx",1)
                            .attr("dy",y+3)
                            .text( percent+"%" )
                            .style("fill","#aaa")
                            .style("margin-left",5)
                            .style("font-size",9);

                        mapRate.append("line")
                                 .attr("x1", 30)
                                 .attr("y1", y)
                                 .attr("x2", 60)
                                 .attr("y2", y)
                                 .style("stroke", geoStrokeColor)
                                 .style("stroke-width", strokeWidth);

                    }


                }
                

                // geoPaths.exit().selectAll()
                


            })
            
            function parseCentroids (features) {
                var vizWidth=900,
                    cnt=0,
                    rgx=d3.scale.linear().domain([0,30]).range([100,vizWidth]);

                features.forEach(function(d, i) {

                    var centroid;
                    cnt=$scope.centroids.length;

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

                    // mapCentroids[i].absx= rgx(i)-rgx(i-1);
                    centroid.fixx = rgx(cnt); // fix display
                    centroid.fixy = mapY+100; // fix display

                    if (centroid.some(isNaN)) return;

                    centroid.feature = d;
                    if (d.properties.name != undefined) centroid.name=d.properties.name
                    else if (d.properties.name==undefined && d.properties.NAME=="Taiwan") centroid.name='Taiwan';
                    else if (d.properties.name==undefined && d.properties.NAME=="Macao") centroid.name='Aomen';
                    else centroid.name='Xianggang';

                    centroid.type="province";
                    // console.log($scope.provincesInfo[centroid.name]);
                    centroid.cleanName=$scope.provincesInfo[centroid.name].clean_name
                    centroid.gdp=$scope.provincesInfo[centroid.name].gdp
                    centroid.population=$scope.provincesInfo[centroid.name].population
                    centroid.weibo_population=$scope.provincesInfo[centroid.name].population

                    d.name=centroid.name;
                    d.cleanName=$scope.provincesInfo[centroid.name].clean_name
                    d.gdp=$scope.provincesInfo[centroid.name].gdp
                    d.population=$scope.provincesInfo[centroid.name].population
                    d.weibo_population=$scope.provincesInfo[centroid.name].population

                    $scope.centroids.push(centroid);
                    
                    if($scope.centroids.length==34) drawCentroids();
                });
            }
        
            $scope.$watch('clusters', function(newVal, oldVal) {
                if(newVal!=undefined && newVal!=oldVal) setupLegend($scope.clusters)
            }) 

            function setupLegend(_data) {
                // console.log(_data);
                var mColor=d3.scale.category10();
                // controls 
                var toggleGeoClustersButton=mapControls.append("g").attr("class","toggleClusters")
                    .on("click",function (d){ 
                       toggleClusters();
                    })
                toggleGeoClustersButton.append("circle")
                    .attr("r",5)
                    .attr("cx",10)
                    .attr("cy",20)
                toggleGeoClustersButton.append("text")
                    .attr("dx",20)
                    .attr("dy",20)
                    .style("fill","#404040")
                    .style("font-size",10)
                    .text(function (d) {
                        if($scope.showClusters) return "Hide clustering"
                        else return "Show clustering"
                    })


                var toggleGeoEdgesButton=mapControls.append("g").attr("class","toggleEdges")
                    .on("click",function (d){ 
                       toggleEdges();
                    })

                    toggleGeoEdgesButton.append("circle")
                        .attr("r",5)
                        .attr("cx",10)
                        .attr("cy",50)
                    
                    toggleGeoEdgesButton.append("text")
                        .attr("dx",20)
                        .attr("dy",50)
                        .style("fill","#404040")
                        .style("font-size",10)
                        .text(function (d) {
                            if($scope.showClusters) return "Hide edges"
                            else return "Show edges"
                        })

                var toggleCentroidsButton=mapControls.append("g").attr("class","toggleCentroids")
                    .on("click",function (d){ 
                       toggleCentroids();
                    })
                    toggleCentroidsButton.append("circle")
                        .attr("r",5)
                        .attr("cx",10)
                        .attr("cy",35)
                    toggleCentroidsButton.append("text")
                        .attr("dx",20)
                        .attr("dy",35)
                        .style("fill","#404040")
                        .style("font-size",10)
                        .text(function (d) {
                            if($scope.showClusters) return "Hide centroids"
                            else return "Show centroids"
                        })

                var data=[];
                for (province in _data) {
                    var d="path."+province
                    d3.select(d)
                        .attr("fill", mColor(_data[province]))
                    if(data.indexOf(_data[province])==-1) data.push(_data[province])
                };
                // console.log(_data);
                var svgClusterLegend=geo
                       .append("g")
                       .attr("class","geo-clusters-legend")
                        .attr("width", 200)
                        .attr("height", data.length/2*20)
                        .attr("transform","translate("+(50)+","+(map_height-100)+")")
                
                svgClusterLegend.selectAll("*").remove()

                svgClusterLegend.append("text")
                    .style("font-size", 10)
                    .text("Province users interactions groups ")
                
                var i=0,
                    r=5;
                
                var clustersLegend=svgClusterLegend
                    .selectAll(".cluster-legend-item")
                   .data(data.sort(function(a,b){ return a-b}))
                   .enter()
                   .append("g")
                   .attr("class","cluster-legend-item")
                   .attr("transform",'translate(0,20)')

                    clustersLegend
                        .append("circle")
                        .attr("cx",function (d,i){
                            if (d<data.length/2) return 10
                            else return 110
                        })
                        .attr("cy",function (d,i){
                            if (d<data.length/2) return i*r*3
                            else return (i-data.length/2)*r*3
                        })
                        .attr("r",r)
                        .style("fill",function(d,i){ return mColor(d)});

                    clustersLegend
                        .append("text")
                        .attr("dx",function (d,i){
                            if (d<data.length/2) return 20
                            else return 120
                        })
                        .attr("dy",function (d,i){
                            if (d<data.length/2) return i*r*3
                            else return (i-data.length/2)*r*3
                        })
                        .style("text-anchor", "start")
                        .style("font-size", "10px")
                        .attr("fill", "#404040")
                        .text(function(d){ return "community "+(d+1)})
            }
        
            function toggleClusters (){
                if($scope.showClusters){ 
                    tickMapColor($scope.clusters);
                    d3.selectAll(".geo-clusters-legend").style("display",null)
                }
                else {
                    tickMapColor(null);
                    d3.selectAll(".geo-clusters-legend").style("display","none")
                }
                $scope.showClusters= !$scope.showClusters;
                d3.select(".toggleClusters").select("text").text(function (d) {
                        if($scope.showClusters) return "Hide clustering"
                        else return "Show clustering"
                    })
            }

            function toggleEdges (){

                if($scope.showEdges) {
                    d3.selectAll(".geoPath").style("display","none")
                    d3.selectAll(".legend-rates").style("display","none")

                }
                else {
                    d3.selectAll(".geoPath").style("display",null)
                    d3.selectAll(".legend-rates").style("display",null)
                }

                $scope.showEdges= !$scope.showEdges;
                d3.select(".toggleEdges").select("text").text(function (d) {
                        if($scope.showEdges) return "Hide edges"
                        else return "Show edges"
                    })
            }

            function toggleCentroids (){
                // console.log("edges");
                if($scope.showCentroids) {
                    d3.select(".centroids").style("display","none")
                    // d3.selectAll(".centroid").select("circle").style("display","none")
                }
                else {
                    // d3.selectAll(".centroid").select("circle").style("display",null)
                    d3.selectAll(".centroids").style("display",null)
                }

                $scope.showCentroids= !$scope.showCentroids;
                d3.select(".toggleCentroids").select("text").text(function (d) {
                    if($scope.showCentroids) return "Hide centroids"
                    else return "Show centroids"
                })
            }

            function tickMapColor(_data) {
                if (_data==null) {
                    d3.selectAll(".province").select("path").attr("fill",defaultFillColor);
                } else {
                    console.log('test');
                    var mColor=d3.scale.category10();
                    for (province in _data) {
                        // console.log(province);
                        var d="path."+province
                        d3.select(d)
                            .attr("fill", mColor(_data[province]))
                    };

                }
            }

            function drawUserPie(element, _data,_memeName) {

                // var mcolor=d3.scale.category20c();
                console.log($scope.geoColors);

                element.select(".pie-chart").remove()
                
                var data=[];
                var t=d3.sum(_data.map(function(d){ return d.count }));
                var others=0;
                
                _data.forEach(function (d){
                    if(d.label == 0) return
                    if(d.count/t*100>3) data.push({"label":d.label,
                                "color": $scope.geoColors[d.label], 
                                "value": d.count})
                    else others+=d.count
                })
                data.push({"label":"Others",
                            "color": $scope.geoColors["Others"], 
                            "value": others})


                var width = 250,
                    height = 250,
                    radius = Math.min(width, height) / 2,
                    margin=40,
                    labelr=radius - 30;

                var arc = d3.svg.arc()
                      .outerRadius(radius-margin)
                      .innerRadius(0);

                var pie = d3.layout.pie()
                      .sort(null)
                      .value(function(d) { return d.value; });

                var svg = element
                      .append("svg")
                      .attr("class","pie-chart")
                      .style("background","#fff")
                      .attr("width", width)
                      .attr("height", height)
                      .append("g")
                      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

                var g = svg.selectAll(".arc")
                      .data(pie(data))
                    .enter().append("g")
                      .attr("class", "arc");

                g.append("path")
                      .attr("d", arc)
                      .attr("data-legend", function(d){ return d.data.label})
                      .style("fill", function(d) { return d.data.color});

                g.append("text")
                    .attr("transform", function(d) { 
                        var c = arc.centroid(d),
                            x = c[0],
                            y = c[1],
                            // pythagorean theorem for hypotenuse
                            h = Math.sqrt(x*x + y*y);
                        return "translate(" + (x/h * labelr+5) +  ',' +
                           (y/h * labelr) +  ")"; 
                    })
                    .attr("dy", ".25em")
                    .attr("text-anchor", "middle") //center the text on it's origin
                    .style("fill-opacity","0.8")
                    .style("text-anchor", "middle")
                    .style("font-size", "10px")
                      .attr("fill", "#404040")
                    .text(function(d) { return d.data.label; });

                svg.append("text")
                      .attr("class", "legend")
                      .attr("transform", "translate("+(0)+","+(height/2-10)+")")
                      .style("text-anchor", "middle")
                      .style("font-size", "10px")
                      .attr("fill", "#ccc")
                      .text("User distribution by province for "+_memeName+" (%)")
                      // .call("wrap",50)
            }

            var clickMap = function (d){
                $scope.province=d.name;
                createCloud(d3.select(".province-words"),$scope.provincesWords[d.name])
            }

            function createCloud(div,_words) {
                div.select("svg").remove()

                var w=200,
                    h=300,
                    fill = d3.scale.category20(), 
                    fontScale=[15,30],
                    cloudScale=_words.map(function(d){return d.count}),
                    cloudScaleFont=d3.scale.linear().domain(d3.extent(cloudScale)).range(fontScale);

                d3.layout.cloud().size([w, h])
                      .words(_words)
                      .padding(1)
                      .rotate(function() { return ~~(Math.random() * 2) * 90; })
                      .font("Impact")
                      .fontSize(function(d) { return cloudScaleFont(d.count); })
                      .on("end", draw)
                      .start();

                function draw(words) {
                    div.append("svg")
                        .attr("width", w)
                        .attr("height", h)
                        .append("g")
                        .attr("transform","translate("+(w/2)+","+(h/2)+")")
                      .selectAll("text")
                        .data(words)
                      .enter().append("text")
                        .style("font-size", function(d) { return d.size + "px"; })
                        .style("font-family", "Impact")
                        .style("fill", function(d, i) { return fill(i); })
                        .attr("text-anchor", "middle")
                        .attr("transform", function(d) {
                          return "translate(" + [d.x, d.y] + ")"+" rotate(" + d.rotate + ")";
                        })
                        .text(function(d) { return d.text; });
                }
            } 

            var mapColor = function(d,i){
                // console.log(d.name);
                return defaultFillColor;
                // console.log($scope.clusters);
                // console.log($scope.clusters[d.name]);
            }

            // Mainland provinces
            function drawProvinces(features) {
                map.append("g")
                    .attr("class", "mainland")
                    .selectAll("path")
                        .data(features)
                    .enter()
                    .append("g")
                    .attr("class", "province")
                    .append("path")
                    .attr("d", mapPath)
                    // .attr("id", function(d) { return d.id; })
                    .attr("class", "province")
                    .attr("class", function(d){ return d.properties.name })
                    .attr("fill", mapColor)
                    .attr("stroke", defaultStrokeColor)
                    .attr("stroke-width", "0.35")
                    .on("click", clickMap)
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide);
            }

            // Taiwan
            function drawTaiwan(features) {

                map.append('g')
                    .attr("class", "taiwan province")
                    .selectAll("path")
                    .data(features)
                    .enter()
                    .append("path")
                    .attr("d", mapPath)
                    .attr("id", function(d) { return d.id; })
                    .attr("class", "province")
                    .attr("class", function(d){ return "Taiwan" })
                    .attr("fill", defaultFillColor)
                    // .attr("fill", function(d) { return mapColor(umap["Taiwan"]); })
                    .attr("stroke", defaultStrokeColor)
                    .attr("stroke-width", "0.35")
                    .on("click", clickMap)
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide);
            }

            // HK and Macau
            function drawHkMacau(features) {
                // console.log(error)
                // console.log(topojson.feature(cn, cn.objects.layer1).features.filter(function(d) { return d.properties.GU_A3 === "HKG" }))
              
                geo.select('.map')
                    .append("g")
                    .attr("class", "hk")
                    .attr("transform", "translate("+650+","+400+")")
                    .selectAll("path")
                    .data(features)
                    .enter()
                    .append("path")
                    .attr("d", path2)
                    // .attr("id", function(d) { return d.id; })
                    .attr("class", "province")
                    .attr("class", "Xianggang")
                    .attr("fill", defaultFillColor)

                    // .attr("fill", function(d) { return mapColor(umap["Xianggang"]); })
                    .attr("stroke", defaultStrokeColor)
                    .attr("stroke-width", "0.35")
                    .on("click", clickMap)
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide);

                geo.select(".hk")
                    .append("text") //add some text
                    .attr("dx", function(d){return 20})
                    .attr("dy", function(d){return 35})
                    .attr("font-family", "sans-serif")
                    .attr("fill", "#aaaaaa")
                    .attr("font-size", 10)
                    .text("Hong Kong & Macau");

                // add demarcation
                geo.select(".hk")
                   .append("svg:line")
                     .attr("x1", 130)
                     .attr("y1", 5)
                     .attr("x2", 0)
                     .attr("y2", 10)
                     .style("stroke", "#cccccc")
                     .style("stroke-width", 1);
                
                geo.select(".hk")
                    .append("svg:line")
                     .attr("x1", 0)
                     .attr("y1", 10)
                     .attr("x2", -10)
                     .attr("y2", 60)
                     .style("stroke", "#cccccc")
                     .style("stroke-width", 1);
            }

            function drawCentroids () {
                
                var popExt=$scope.centroids.map(function(d){ return d.population}),
                    popScale=d3.scale.linear().domain(d3.extent(popExt)).range([.3,2]);

                // var popExt=$scope.centroids.map(function(d){ return d.population}),
                //     popScale=d3.scale.linear().domain(d3.extent(popExt)).range([.3,2]);

                // console.log(popExt);
                $scope.nodeCentroids=geo.append("g")
                    .attr("class", "centroids")
                    .selectAll(".centroid")
                        .data($scope.centroids)
                    .enter()
                    .append("g")
                    .attr("class", "centroid")                    
                    .on("click", clickMap);

                $scope.nodeCentroids
                        .data($scope.centroids)
                        .append("circle")
                        .attr("r", .5)
                        // .attr("r", function (d) { return popScale(d.population) })
                        .style("fill", function(d) {return "green"})

                $scope.nodeCentroids.append("text")
                        .attr("dx", 2)
                        .attr("dy", "0.35em")
                        .style("fill", "#404040" )
                        .style("fill-opacity", "0.8" )
                        .style("font-size", 11 )
                        .text(function(d) {d.name})

                $scope.centroidsXY={}
                $scope.nodeCentroids
                    .each(function (d, i) {
                        var x=($scope.centroidsOnMap)? d.x :d.fixx;
                        var y=($scope.centroidsOnMap)? d.y :d.fixy;

                        $scope.centroidsXY[d.name]={"x":x,"y":y};

                        // console.log(d);
                        var self=d3.select(this);
                        self.transition().attr("transform", "translate(" + x + "," + y + ")")

                        if (!$scope.centroidsOnMap) 
                            self.select("text")
                                .attr("transform", "rotate(60)")
                                .attr("dy","0.45em")
                        else
                            self.select("text")
                                .attr("transform", "rotate(0)")
                })

                tickCentroids()
            }

            function tickCentroids () {

                 $scope.nodeCentroids
                    .each(function (d, i) {
                        
                        var x=($scope.centroidsOnMap)? d.x :d.fixx;
                        var y=($scope.centroidsOnMap)? d.y :d.fixy;

                        // console.log(d);
                        var self=d3.select(this);
                        self.transition().attr("transform", "translate(" + x + "," + y + ")")

                        if (!$scope.centroidsOnMap) 
                            self.select("text")
                                .attr("transform", "rotate(60)")
                                .attr("dy","0.45em")
                        else
                            self.select("text")
                                .attr("transform", "rotate(0)")
            })
                
            }

    
        }
    }
});

app.directive("words", function () {
     return {
        replace: false,
        controller: 'wordCtrl',
        scope: { 
         },
        link: function ($scope, element, attrs) {
            
            //SVG Setup
            var w=900,
                h=500;

            var viz=d3.select(element[0]).append("svg")
                .attr("class","svg-viz")
                .style("background","#fff")
                .attr("width", w)
                .attr("height", h)
                .attr("preserveAspectRatio", "xMidYMid")
                .attr("viewBox", "0 0 " + w + " " + h);

            var divWords=viz.append("g").attr("class","wordzone")

            var wordEdges = divWords.append("g")
                        .attr("class", "wordgraph")

            var words = divWords.append("g")
                        .attr("class", "words")

            var wordsLegend=divWords.append("g")
                        .attr("class", "words-legend")
                        .attr("transform", "translate("+(100)+","+(h-200)+")");
                    
            $scope.$watch('memeName', function(newVal, oldVal) {
                // console.log(newVal);
                if(newVal!=undefined) {                           
                    wordsLegend.append("text")
                        .attr("dx",1)
                        .attr("dy",12)
                        .text("Words correlation for '"+newVal+"'")
                        .style("fill","#404040")
                        .style("margin-left",5)
                        .style("font-size",10)
                        .call(wrap, 135);

                    wordsLegend.append("text")
                        .attr("transform","translate(0,30)")
                        .attr("dx",1)
                        .attr("dy",10)
                        .text("Weighted co-occurences in tweets for 500 most used words")
                        .style("fill","#aaa")
                        .style("margin-left",5)
                        .style("font-size",10)
                        .call(wrap, 150);
                }
            });

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
            
            // data 
            $scope.$watch("wordsLength", function(newVal,oldVal){

                if(newVal==undefined) return
                var wordsData=$scope.words;

                d3.selectAll(".word-link").remove();
                d3.selectAll(".word").remove();

                var wordsX={},
                    wordsY={};

                updateWordXY= function updateWordXY() {

                    var margin=30,
                        rgx=d3.scale.linear().domain([0,wordNodes.length]).range([margin,w-margin-200]),
                        s=d3.shuffle(wordNodes),
                        rgy=d3.scale.linear().domain(fontScale).range([margin,h-150]);

                    for (var i = 0; i < wordNodes.length; i++) {
                        var d=s[i];
                        wordsX[d.name]=rgx(i);
                        wordsY[d.name]=rgy(wordScaleFont(d.count));
                    };
                }

                // parse data properly                     
                var myWordNodes={},
                    myWordEdges={};

                for (var i = 0; i < wordsData.nodes.length; i++) {
                    myWordNodes[wordsData.nodes[i]["name"]]=wordsData.nodes[i];
                    wordsData.nodes[i].children=[];
                    wordsData.nodes[i].selected=false;
                };

                wordsData.edges.forEach(function(link) {
                    // console.log(link.weight);
                     myWordNodes[link.source].children.push(myWordNodes[link.target]);
                     myWordNodes[link.target].children.push(myWordNodes[link.source]);

                    link.source = myWordNodes[link.source] || 
                        (myWordNodes[link.source] = {name: link.source});
                    link.target = myWordNodes[link.target] || 
                        (myWordNodes[link.target] = {name: link.target});
                    link.value = link.weight;
                });


                var wordForce=d3.layout.force()
                        .nodes(wordsData.nodes)
                        .links(wordsData.edges)
                        .size([w,h])
                        .linkDistance(150)
                        .charge(-1000)
                        .gravity(.4)
                        .on("tick", tickWord);

                var wordPath=wordEdges.selectAll(".word-link")
                        .data(wordForce.links())
                
                wordPath.enter()
                    .append("line")
                    .attr("class", "word-link")

                var wordNodes=words.selectAll(".word")
                        .data(wordForce.nodes())

                wordNodes.enter()
                    .append("g")
                    .attr("class", "word")
                    
                if($scope.wordForceStarted) {
                    wordForce.start();
                    wordNodes.call(wordForce.drag);
                }

                drawWords();

                // scales
                var fontScale=[15,60],
                    wordScale=wordsData.nodes.map(function(d){return d.count}),
                    maxMinWordScale=[Math.min.apply(Math,wordScale), Math.max.apply(Math,wordScale)],
                    wordScaleFont=d3.scale.linear().domain(maxMinWordScale).range(fontScale),
                    userPathColor=d3.scale.category20b(),
                    mapColor;
                
                $scope.selection=false;

                function drawWords() {

                    var ext=wordsData.nodes.map(function(d){ return d.children.length }), 
                        wordScaleSize=d3.scale.linear().domain(d3.extent(ext)).range([15, 45]),
                        wordScaleOpacity=d3.scale.linear().domain(d3.extent(ext)).range([.5,1]),
                        wordColor = d3.scale.linear().domain(d3.extent(ext)).range(["#a1d99b","#006d2c"]),
                        c=d3.scale.category10();

                    wordNodes.each(function (d, i) {

                        var self = d3.select(this);
                    
                        self.append("rect")
                            .attr("width", function(d) { return wordScaleSize(d.children.length) })
                            .attr("height", function(d) { return 20 })
                            .style("fill", function(d) {  return "transparent"; })
                            .style("stroke", function(d) { return "transparent" });

                        self.append("text")
                            .attr("dx", 12)
                            .attr("dy", 8)
                            .style("font-size", function(d) { return wordScaleSize(d.children.length) })//scale_size(d.btw_cent) })
                            .style("fill", function(d) {  
                                // return 
                                // "#006d2c" 
                                // console.log(d);
                                return c(d.community)
                            })
                            // .style("fill-opacity", function(d) {  return "#006d2c" })
                            // .style("fill-opacity", function(d) {  return wordScaleOpacity(d.count) })
                            .attr("text-anchor", "middle") // text-align: right
                            .text(function(d) { return d.name });

                        var x=i*20;
                        var y=80;

                        wordsX[d.name]=x;
                        wordsY[d.name]=y;
                    }).on("mouseover",function(d,i,event){
                        // console.log(d3.mouse());Z
                        
                        $scope.selection=true;
                        d.selected=true;
                        d.children.forEach(function(e){
                            e.selected=true;
                        })
                        
                        drawWordPie(divWords.append("g").attr("transform",'translate(100,50)'),
                            $scope.wordProvinces[d.name],
                            d.name
                            )

                    }).on("mouseout",function(d,i){

                        $scope.selection=false;
                        d.selected=false;
                        d.children.forEach(function(e){
                            e.selected=false;
                        })
                        d3.select(".pie-chart").remove()

                    });
                    // .on("click",function(d){
                    //     console.log(d);
                    // })
                    // ;

                    drawWordPath();
                }

                function drawWordPie(element, _data, _word) {

                  element.select(".pie-chart").remove()


                    // parse only more than 3 % and group others
                    data=[];
                    var t=d3.sum(_data.map(function(d){ return d.value }));
                    var others=0;

                    
                    _data.forEach(function (d){
                        if(d.label == 0) return
                        if(d.value/t*100>7) data.push({"label":d.label,
                                    "color": $scope.geoColors[d.label], 
                                    "value": d.value})
                        else others+=d.value
                    })
                    if(others!=0) data.push({"label":"Others",
                                        "color": "#CCC", 
                                        "value": others})

                    var width = 200,
                        height = 200,
                        radius = Math.min(width, height) / 2;

                    var arc = d3.svg.arc()
                      .outerRadius(radius - 10)
                      .innerRadius(0);

                    var pie = d3.layout.pie()
                      .sort(null)
                      .value(function(d) { return d.value; });

                    var svg = element
                      .append("g")
                      .attr("class","pie-chart")
                      .attr("width", 200)
                      .attr("height", 200)
                      .append("g")
                      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

                    var g = svg.selectAll(".arc")
                        .data(pie(data))
                        .enter();

                    g.append("path")
                      .attr("class", "arc")
                      .attr("d", arc)
                      .attr("data-legend", function(d){ return d.data.label })
                      .style("fill", function(d) { return d.data.color; });

                    g.append("text")
                      .attr("transform", function(d) { 
                        return "translate(" + arc.centroid(d) + ")"; 
                    })
                      .attr("dy", ".25em")
                      .style("fill","#000")
                      .style("fill-opacity","0.8")
                      .style("text-anchor", "middle")
                      .style("font-size", 10)
                      .style("fill","#000")
                      .text(function(d) { return d.data.label; });

                    svg.append("text")
                      .attr("class", "legend")
                      .style("text-anchor", "middle")
                      .style("font-size", 11)
                      .style("fill","#404040")
                      .attr("transform", "translate(0,"+(-width/2)+")")
                      .text("Word: "+_word)
                }

                function drawWordPath() {

                    var wordPathExt=wordsData.edges.map(function(d){ return d.weight }),
                        wordPathWeight=d3.scale.linear().domain(d3.extent(wordPathExt)).range([1, 4]),
                        wordPathOpacity=d3.scale.linear().domain(d3.extent(wordPathExt)).range([.1, 1]);
                    
                    wordPath.each(function (d, i) {
                        var self = d3.select(this);
                        
                        self.style("stroke", function(d) { return "#de2d26" })
                            .style("stroke-width", function(d) {  return wordPathWeight(d.weight) })
                            .style("stroke-opacity", function(d) {  return wordPathOpacity(d.weight) });
                    })
                }

                var ext=wordsData.nodes.map(function(d){ return d.children.length }), 
                    wordScaleOpacity=d3.scale.linear().domain(d3.extent(ext)).range([.5,1]);

                function tickWord() {

                    // remove transition for force
                    var ww = ($scope.wordForceStarted)? wordNodes : wordNodes.transition();

                    ww.attr("transform", function(d) { 
                    
                        var r=wordScaleFont(d.children.length),
                            x=(d.x==undefined || !$scope.wordForceStarted)? wordsX[d.name] : Math.max(r, Math.min(w - r, d.x)),
                            y=(d.y==undefined || !$scope.wordForceStarted)? wordsY[d.name] : Math.max(r, Math.min(h - r, d.y));

                        wordsX[d.name]=x;
                        wordsY[d.name]=y;

                        return "translate(" + x + "," + y + ")"; 

                    }).attr("fill-opacity",function(d){
                        // return 1
                        if($scope.selection) {
                            if(!d.selected) return 0.2;
                            else return 1 // wordScaleOpacity(d.children.length);
                        } else return 1 // wordScaleOpacity(d.children.length);
                    });

                    tickWordPath();
                }

                function tickWordPath() {
                    var wordPathExt=wordsData.edges.map(function(d){ return d.weight }),
                        wordPathWeight=d3.scale.linear().domain(d3.extent(wordPathExt)).range([1, 4]),
                        wordPathOpacity=d3.scale.linear().domain(d3.extent(wordPathExt)).range([.1, 1]);

                    wordPath.each(function (d, i) {
                        var self=d3.select(this);

                        self.style("stroke-opacity", function(d) { 
                             if($scope.selection) {
                                if( d.target.selected && d.source.selected) return wordPathOpacity(d.weight)
                                else return 0;
                            } else return wordPathOpacity(d.weight);

                        })
                        
                        var w=wordForce.size()[0],
                            h=wordForce.size()[1],
                            r1=wordScaleFont(d.source.count),
                            x1=Math.max(r1, Math.min(w, d.source.x));
                            y1=Math.max(r1, Math.min(h, d.source.y)),
                            r2=wordScaleFont(d.target.count),
                            x2=Math.max(r2, Math.min(w, d.target.x)),
                            y2=Math.max(r2, Math.min(h, d.target.y));

                        if(!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
                            self.attr("x1", x1)
                                .attr("y1", y1)
                                .attr("x2", x2)
                                .attr("y2", y2)
                        }
                    })       
                }

            });
        }
    }
})

app.directive("users", function () {
     return {
        replace: false,
        controller: 'userCtrl',
        scope: { 
         },
        link: function ($scope, element, attrs) {
            
            var svg_w=d3.select(element[0]).style('width'),
                h=500,
                w=1600;
            
            var sw=1,
                sh=1,
                sx=0,
                sy=0;

            var viz=d3.select(element[0]).append("svg")
                .attr("class","svg-viz")
                .style("background","#fff")
                .attr("width", w)
                .attr("height", h)
                .attr("preserveAspectRatio", "xMidYMid")
                .attr("viewBox", "0 0 "+ w + " " + h)
                

            var divUsers=viz.append("g").attr("class","userzone")
                    .attr("transform","scale("+sh+","+sw+") translate("+sx+","+sy+")")


            var userEdges = divUsers.append("g")
                        .attr("class", "usergraph")

            var users = divUsers.append("g")
                        .attr("class", "users")

            var usersLegend=divUsers.append("g")
                        .attr("class", "users-legend")
                        .attr("transform", "translate("+(20)+","+(h-50)+")");
                    
            $scope.$watch('memeName', function(newVal, oldVal) {
                console.log(newVal);
                if(newVal!=undefined) {                           
                    usersLegend.append("text")
                        .attr("dx",1)
                        .attr("dy",12)
                        .text("Conversational graph for '"+newVal+"'")
                        .style("fill","#404040")
                        .style("margin-left",5)
                        .style("font-size",10)
                        .call(wrap, 135);

                    usersLegend.append("text")
                        .attr("transform","translate(0,30)")
                        .attr("dx",1)
                        .attr("dy",10)
                        .text("Users interactions (@,RT)")
                        .style("fill","#aaa")
                        .style("margin-left",5)
                        .style("font-size",10)
                        .call(wrap, 150);
                }
            });



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


            var userColor=d3.scale.category20b();

            $scope.$watch("usersLength", function(newVal,oldVal){
                if(newVal==undefined) return
                // console.log(newVal);
                var userData=$scope.users;

                // parse data properly                     
                var myUsersNodes={}
                var color = d3.scale.category20c();

                for (var i = 0; i < userData.nodes.length; i++) {
                    myUsersNodes[userData.nodes[i]["name"]]=userData.nodes[i];
                    userData.nodes[i].children=[];
                    userData.nodes[i].selected=false;
                };

                userData.edges.forEach(function(link) {

                    myUsersNodes[link.source].children.push(myUsersNodes[link.target]);
                    myUsersNodes[link.target].children.push(myUsersNodes[link.source]);

                    link.source = myUsersNodes[link.source] || 
                        (myUsersNodes[link.source] = {name: link.source});
                    link.target = myUsersNodes[link.target] || 
                        (myUsersNodes[link.target] = {name: link.target});
                    link.value = link.weight;
                });


                // TODO : move data logic to controllers
                var myCommunities={},
                    myProvinces={},
                    leaders={};

                var communities=userData.nodes.map(function(d){
                    if(myCommunities[d.community]== undefined) myCommunities[d.community]=[]
                        myCommunities[d.community].push(d);
                        return d.community
                })
                
                for (com in myCommunities) {
                    myCommunities[com].sort(function(a,b){ return b.count-a.count});
                    leaders[com]=myCommunities[com][0]; // keep only the biggest node
                    
                    // count by provinces
                    var pc=count(myCommunities[com].map(function(d){ return d.province }))
                    myProvinces[com]=[]
                    for (p in pc) { 
                        myProvinces[com].push({"label":p, "value":pc[p], "color": color(p)})
                    }
                }

                function count(arr){
                    var obj={}
                    for (var i = 0, j = arr.length; i < j; i++) {
                       if (obj[arr[i]]) {
                          obj[arr[i]]++;
                       }
                       else {
                          obj[arr[i]] = 1;
                       } 
                    }
                    return obj;
                }

                d3.selectAll(".user-link").remove();
                d3.selectAll(".user").remove();

                var userForce=d3.layout.force()
                        .nodes(userData.nodes)
                        .links(userData.edges)
                        .size([500,h])
                        // .linkDistance(50)
                        .charge(-100)
                        .gravity(.4)
                        .on("tick", tickUsers);

                var userPath=userEdges.selectAll(".user-link")
                        .data(userForce.links())
                
                userPath.enter()
                    .append("line")
                    .attr("class", "user-link")

                var userNodes=users.selectAll(".user")
                        .data(userForce.nodes())

                userNodes.enter()
                    .append("g")
                    .attr("class", "user")

                if($scope.userForceStarted) {
                    userForce.start();
                    // console.log(userNodes.call(""));
                    userNodes.call(userForce.drag);
                } 


                drawUsers();
                
                var padding = 5, // separation between same-color circles
                    clusterPadding = 36, // separation between different-color circles
                    maxRadius = 20;

                function drawUsers(){

                    var userExt=userData.nodes.map(function(d){ return d.children.length }),
                        legendExt=d3.scale.linear().domain([0,3]).range(d3.extent(userExt)),
                        userSize=d3.scale.linear().domain(d3.extent(userExt)).range([3,20]);

                    var a=[];
                    for(p in myProvinces) {
                        a.push(myProvinces[p].length);
                    }

                    var clutersColors=colorbrewer.Accent[4].reverse(),
                        userProvinceClusteringColor=d3.scale.linear().domain(d3.extent(a)).range(clutersColors);

                    userNodes.each(function (d, i) {
                            
                            var self = d3.select(this);
                            
                            self.append("circle")
                            .attr("r",function(d){ 
                                d.radius=userSize(d.children.length);
                                return d.radius;
                            })
                            .style("fill", function(d){
                                if($scope.showCommunities) return userColor(d.community)
                                else return userProvinceClusteringColor(myProvinces[d.community].length)
                            })
                    }).on("click",function(d,i){

                        $scope.selection=true;
                        d.selected=true;
                        d.children.forEach(function(e){
                            e.selected=true;
                        })
                        var pieX=400+d3.selectAll(".pie-chart")[0].length*200;
                        // console.log(pieX);
                        var self=d3.select(this);
                        
                        self.append("text")
                          .attr("class", "legend")
                          .style("text-anchor", "middle")
                          .style("font-size", 11)
                          .style("fill","#404040")
                          // .attr("transform", "translate(0,"+(-width/2)+")")
                          .text(d.community)

                          console.log(myProvinces[d.community]);

                        drawUserPie(
                            divUsers.append("g").attr("transform",'translate('+pieX+',200)'),
                            myProvinces[d.community],
                            d.community)
                    }) 
                    /*.on("mouseout",function(d,i){
                        $scope.selection=false;
                        d.selected=false;
                        d.children.forEach(function(e){
                            e.selected=false;
                        })
                        d3.select(".pie-chart").remove()
                    });
*/
                    // legend
                    d3.select(".legend-communities").remove()

                    var legendCommunities=usersLegend.append("g")
                        .attr("class","legend-communities")
                        .attr("transform","translate("+(400)+",0)")
                        .append("g")
                        .attr("class","legend-size")

                    // clustering
                    if(!$scope.showCommunities) {

                        var clusterLeg=d3.scale.linear().domain([0,clutersColors.length]).range(d3.extent(a))

                        legendCommunities
                            .append("text")
                            .style("fill","#404040")
                            .style("font-size", 10)
                            // .attr("height", 15)
                            .attr("dy", function(d,i) {return -40-(clutersColors.length+1)*15 })
                            .attr("dx", 55)
                            .text("Provinces clusters")

                        for (var j = 0; j < clutersColors.length+1; j++) {
                            legendCommunities
                                .append("rect")
                                .style("stroke","none")
                                .attr("width", 15)
                                .attr("height", 15)
                                .attr("y", function(d,i) {return -45-j*15 })
                                .attr("x", 60)
                                .attr("fill", userProvinceClusteringColor(clusterLeg(j)))

                            legendCommunities
                                .append("text")
                                .style("fill","#ccc")
                                .style("font-size", 10)
                                // .attr("height", 15)
                                .attr("dy", function(d,i) {return -40-j*15 })
                                .attr("dx", 85)
                                .text(Math.round(clusterLeg(j))+" provinces")
                                // .attr("fill", userProvinceClusteringColor(clusterLeg(j)))

                        }
                    }

                    // size
                    legendCommunities
                        .append("text")
                        .style("fill","#404040")
                        .style("font-size", 10)
                        // .attr("height", 15)
                        .attr("dy", function(d,i) {return -10 })
                        .attr("dx", 30)
                        .text("Interactions for each users")

                    for (var i = 0; i < 3; i++) {
                        
                        var d=legendExt(i);
                        
                        legendCommunities
                            .append("circle")
                            .attr("r",userSize(d) )
                            .attr("cy",userSize(d))
                            .attr("cx", 50)
                            .style("fill","transparent")
                            .style("stroke","#ccc")

                        legendCommunities
                            .append("line")
                            .attr("x1", 50)
                            .attr("y1", userSize(d)*2)
                            .attr("x2", 100)
                            .attr("y2", userSize(d)*2)
                            .style("stroke","#ccc")
                            .style("stroke-width",.5);
                        
                        legendCommunities        
                            .append("text")
                            .attr("dx", 100)
                            .attr("dy", userSize(d)*2)
                            .style("font-size",9)
                            .style("fill","#aaa")

                            .text((Math.round(d)+1)+" interactions")
                        
                    }
                    drawUserPath()
                }

                function drawUserPath() {
                    
                    userPath.each(function (d, i) {
                        var self = d3.select(this);
                        self.style("stroke", function(d){return "#ccc"})
                            .style("stroke-width",2)
                    })
                }

                function tickUsers(e) {

                    var r=5,
                        w=userForce.size()[0],
                        h=userForce.size()[1];

                    userPath.each(function (d,i) {
                        var self=d3.select(this);

                        var x1=Math.max(r, Math.min(w - r, d.source.x)),
                            y1=Math.max(r, Math.min(h - r, d.source.y)),
                            x2=Math.max(r, Math.min(w - r, d.target.x)),
                            y2=Math.max(r, Math.min(h - r, d.target.y));

                        self.attr("stroke-opacity",function(e){
                            if($scope.selection) {
                                if(!d.selected) return 0.2;
                                else return 1;
                            } else return 1;
                        })

                        if(!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
                            self.attr("x1", x1)
                                .attr("y1", y1)
                                .attr("x2", x2)
                                .attr("y2", y2)
                        }
                        
                    })
                        

                    userNodes
                        // .each(cluster(12 * e.alpha * e.alpha))
                        .each(collide(.5))
                        .attr("transform", function(d) { 
                            
                            var r=5,
                                w=userForce.size()[0],
                                h=userForce.size()[1],
                                x=Math.max(r, Math.min(w - r, d.x)),
                                y=Math.max(r, Math.min(h - r, d.y));
                                // x=d.x,
                                // y=d.y;

                            return "translate(" + x + "," + y + ")"; 
                        }).attr("fill-opacity",function(d){
                            if($scope.selection) {
                                if(!d.selected) return 0.3;
                                else return 1;
                            } else return 1;
                        });
                }

                // Move d to be adjacent to the cluster node.
                function cluster(alpha) {
                  return function(d) {
                    var cluster = leaders[d.community];
                    // console.log(cluster);
                    if (cluster === d) return;
                    var x = d.x - cluster.x,
                        y = d.y - cluster.y,
                        l = Math.sqrt(x * x + y * y),
                        r = d.radius + cluster.radius;
                    if (l != r) {
                      l = (l - r) / l * alpha;
                      d.x -= x *= l;
                      d.y -= y *= l;
                      cluster.x += x;
                      cluster.y += y;
                    }
                  };
                }

                // Resolves collisions between d and all other circles. 
                function collide(alpha) {
                  var quadtree = d3.geom.quadtree(userData.nodes);
                  return function(d) {
                    var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
                        nx1 = d.x - r,
                        nx2 = d.x + r,
                        ny1 = d.y - r,
                        ny2 = d.y + r;
                    quadtree.visit(function(quad, x1, y1, x2, y2) {
                      if (quad.point && (quad.point !== d)) {
                        var x = d.x - quad.point.x,
                            y = d.y - quad.point.y,
                            l = Math.sqrt(x * x + y * y),
                            r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
                        if (l < r) {
                          l = (l - r) / l * alpha;
                          d.x -= x *= l;
                          d.y -= y *= l;
                          quad.point.x += x;
                          quad.point.y += y;
                        }
                      }
                      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                    });
                  };
                }

                function drawUserPie(element, _data, _community) {

                    element.select(".pie-chart").remove()

                    // console.log($scope.geoColors);

                    // parse only more than 3 % and group others
                    data=[];
                    var t=d3.sum(_data.map(function(d){ return d.value }));
                    var others=0;
                    
                    _data.forEach(function (d){
                        if(d.label == 0) return
                        if(d.value/t*100>7) data.push({"label":d.label,
                                    "color": $scope.geoColors[d.label], 
                                    "value": d.value})
                        else others+=d.value
                    })

                    if(others!=0) data.push({"label":"Others",
                                            "color": "#ccc", 
                                            "value": others})
                    // console.log(data);
                    var width = 200,
                        height = 200,
                        radius = Math.min(width, height) / 2;

                    var arc = d3.svg.arc()
                      .outerRadius(radius - 10)
                      .innerRadius(0);

                    var pie = d3.layout.pie()
                      .sort(null)
                      .value(function(d) { return d.value; });

                    var svg = element
                      .append("g")
                      .attr("class","pie-chart")
                      .attr("width", 200)
                      .attr("height", 200)
                      .append("g")
                      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
                
                    svg.on("click", function(d){
                        element.select(".pie-chart").remove()
                    })

                    var g = svg.selectAll(".arc")
                      .data(pie(data))
                      .enter()


                    g.append("path")
                      .attr("class", "arc")
                      .attr("d", arc)
                      .attr("data-legend", function(d){ return d.data.label })
                      .style("fill", function(d) { return d.data.color; });

                    g.append("text")
                      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
                      .attr("dy", ".25em")
                      .style("fill-opacity","0.8")
                      .style("text-anchor", "middle")
                      .style("font-size", 10)
                      .style("fill","#000")
                      .text(function(d) { return d.data.label; });

                    svg.append("text")
                      .attr("class", "legend")
                      .style("text-anchor", "middle")
                      .style("font-size", 11)
                      .style("fill","#404040")
                      .attr("transform", "translate(0,"+(-width/2)+")")
                      .text("Community "+_community)
                }

            })
        }
    }
})

// app.directive('slider', function ($parse) {
//     return {
//       restrict: 'E',
//       replace: true,
//       template: '<input type="text" />',
//       link: function ($scope, element, attrs) {

//         var model = $parse(attrs.model);
        
//         var slider = $(element[0]).slider({
//             "max": updatedTimeMax,
//             "value": [0,updatedTimeMax]
//         });

//         slider.on('slide', function(ev) {
//             model.assign($scope, ev.value);

//             $scope.start=$scope.timeSeriesData[ev.value[0]].timestamp;
//             $scope.end=$scope.timeSeriesData[ev.value[1]-1].timestamp;

//             $scope.$apply();

//         });
//       }
//     }
// });