function drawD3Words(wordsFile) {
  d3.json(wordsFile, function(error,data){
    
    console.log(data);
    
    // tabulate("#hashtags", data.hashtags.splice(0,5), ["name","count"])
    // tabulate("#urls", data.urls.splice(0,5), ["name","count"])

    // word clouds  
    var words=data.words.splice(3,100).map(function(d) {
      return {text:d.name, size:d.count/10}
    })

    createCloud(words);
    // console.log(words);

    function createCloud(_words) {
    
      var fill = d3.scale.category20();

      d3.layout.cloud().size([300, 300])
          .words(words)
          .padding(1)
          .rotate(function() { return ~~(Math.random() * 2) * 90; })
          .font("Impact")
          .fontSize(function(d) { return d.size; })
          .on("end", draw)
          .start();

      function draw(words) {
        d3.select("#words").append("svg")
            .attr("width", 300)
            .attr("height", 300)
          .append("g")
            .attr("transform", "translate(140,150)")
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
  })

  function tabulate(div, data, columns) {
      var table = d3.select(div).append("table")
              .attr("class","table table-striped")
              // .attr("style", "margin-left: 250px"),
          thead = table.append("thead"),
          tbody = table.append("tbody");

      // append the header row
      thead.append("tr")
          .selectAll("th")
          .data(columns)
          .enter()
          .append("th")
              .text(function(column) { return column; });

      // create a row for each object in the data
      var rows = tbody.selectAll("tr")
          .data(data)
          .enter()
          .append("tr");

      // create a cell in each row for each column
      var cells = rows.selectAll("td")
          .data(function(row) {
              return columns.map(function(column) {
                  return {column: column, value: row[column]};
              });
          })
          .enter()
          .append("td")
          .attr("style", "font-family: Courier")
              .html(function(d) { return d.value; });
      
      return table;
  }

}