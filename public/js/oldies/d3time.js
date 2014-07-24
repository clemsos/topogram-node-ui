function drawD3Time (timeFile) {
 
    // Margins, time_width and time_height. 
    var w=960,
        h=200;


    var margin = {top: 20, right: 20, bottom: 90, left: 30},
        body_time_width = w,
        time_width = body_time_width - margin.left - margin.right,
        time_height = h - margin.top - margin.bottom;

    // Construct our SVG object.
    var svg = d3.select("#timeserie").append("svg")
        .attr("width", time_width + margin.left + margin.right)
        .attr("height", time_height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    d3.json(timeFile, function(error, data) {

        // console.log(data);

        // Scales.
        var x = d3.time.scale().range([time_width/data.length/2, time_width-time_width/data.length/2]);
        // var x = d3.scale.ordinal().rangeRoundBands([0, time_width], .05);
        var y = d3.scale.linear().range([time_height, 0]);

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


        data.forEach(function(d) {
            d.date=new Date(d.timestamp*1000);
            // console.log(dt);
            // d.date = parseDate.parse(dtmp);
            // console.log(d);
        });

        // Set scale domains. 
        x.domain(d3.extent(data, function(d) { return d.date; }));
        y.domain([0, d3.max(data, function(d) { return d.count; })]);

        // Call x-axis. 
        d3.select(".x.axis")
            .transition().duration(1000)
            .call(xAxis);

        // Draw bars. 
        var bars = svg.append("g")
            .attr("class","bars")
            .selectAll(".count")
            .data(data, function(d) { return d.date; });

        bars.exit().remove();
            
        bars.transition().duration(1000)
            .attr("x", function(d) { return x(d.date) - time_width/data.length/2; })
            .attr("width", time_width / data.length)
            .attr("y", function(d) { return y(d.count); })
            .attr("height", function(d) { return time_height - y(d.count);});
            
        bars.enter().append("rect")
            .attr("class", "count")
            .attr("width", time_width / data.length)
            .attr("x", function(d) { return x(d.date) - (time_width/data.length)/2; })
            .attr("y", time_height)
            .attr("height", 0)
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

    });
}