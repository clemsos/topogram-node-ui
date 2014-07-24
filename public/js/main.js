var memes_list="data/2012_sina-weibo-memes_list.csv",
    memes={},
    loadmeme;

$(document).ready(function() {

  var url=getLocation(document.URL); // default
  var safename=url.hash.slice(1,url.hash.length);
  console.log(url);

  // DATA : load the list of memes from csv
  $.get(memes_list, function(memes_list_data) {                  

      var memesdata=$.csv.toObjects(memes_list_data);
      
      memesdata.forEach(function(meme) {

        // exclude some memes from the list
        if (meme.safename == "diaosi" || meme.safename == "iphone5" || meme.safename == "tuhao" || meme.safename == "cgc")return 
        if (meme.rank > 2) return
        if (meme.name == "") return

        addMemeMenuItem(meme);
        memes[meme.safename]=meme;
      })

      loadmeme(safename);
  });

  // parse data and add menu item
  function addMemeMenuItem(meme) {
 
    // create thumbnail 
    var memeDiv="<div class='col-sm-2 col-md-2 memethumb'><div class='thumbnail'><div class='.caption'><p>";
    memeDiv+="<small>"+meme.type+"</small><br /> ";
    memeDiv+='<a  onClick="loadmeme('+"'"+meme.safename+"'"+')" href="#'+meme.safename+'">';
    memeDiv+="<strong>"+meme.name+"</strong> "
    memeDiv+='</a>';
    memeDiv+="<br /><small>Keywords: <em>"+meme.keywords+"</em></small>";
    memeDiv+="</p></div></div>";

    // add thumb to memes list
    $(".memelist").append(memeDiv);

    // parse data
    meme.graphFile="data/"+meme.safename+"/"+meme.safename+"_d3graph.json";
    meme.mapFile="data/"+meme.safename+"/"+meme.safename+"_usermap.json";
    meme.timeFile="data/"+meme.safename+"/"+meme.safename+"_time_series.json";
    meme.wordsFile="data/"+meme.safename+"/"+meme.safename+"_words.json";  
  }

  loadmeme=function load_meme(meme_name) {

    reset_display()

    var meme = memes[meme_name];
    console.log(meme);

    // change page title
    var title= meme.safename+' <small>'+meme.name+'<small>'
    $("h1.page-header").html(title);

    // var baidu

    var text={};

    // text.name="<p>Name : "+meme.name+"</p>";
    // text.safename="<p>"++"</p>"

    text.keywords="<li>Keywords : "+meme.keywords+"</li>";
    text.start="<li> Date start :"+meme.start+"</li>";
    // text.type="<p>Type :"+meme.type+"</p>";
    // text.link2="<p><a href='"+meme.link2+" '>Read More</a></p>";

    text.links="<li>Read more : ";
    if(meme.wikipedia != "") text.links+= "<a href='"+meme.wikipedia+" '>Wikipedia</a> ";
    if(meme.baidu != "") text.links+= "<a href='"+meme.baidu+" '>Baidu</a> ";
    if(meme.link1 != "") text.links+= "- <a href='"+meme.link1+" '>Link</a> ";
    text.links+="</li>"

    // text.dataset="<p>Dataset : xxx tweets"
    for (var i = 0; i < Object.keys(text).length; i++) {
      $("#info").append(text[Object.keys(text)[i]]);
      // console.log();
    };

    // drawD3Map(meme.mapFile)
    // drawD3Words(meme.wordsFile);
    // console.log((meme.graphFile,meme.mapFile))
    drawD3Layers(meme.graphFile,meme.mapFile,meme.timeFile);

  }

  function reset_display() {
      $("#info").html("");
      $("#words").html("");
      $("#urls").html("");
      $("#hashtags").html("");
      $("#timeserie").html("");
      $("#map").html("");
      $("#viz").html("");

      if($('#memes').attr("class").split(" ").indexOf("in") != -1) $('#memes').collapse("hide");
    }


  // save stuff
  $(".btn-save-all").click(function(){

    var sv=new Simg($(".svg-viz")[0]);
    sv.download();

  })

  // parse URL
  // var url=getLocation(document.URL)
  // var current_meme=url.hash
  // console.log(current_meme)
  // console.log(url.pathname.split('#')+url.hash)
});

var showInfo = function (_info, _div) {
    if(! typeof(a)=="object") throw "Info should be an object"
}

var showUserInfo = function(_info) {
  
  var _div=$(".userinfobox");
  _div.html("")
  if(_info==null) return;
  console.log(_info);

  var d=_info;
  var infodiv="<div>";
  
  var dl="<dl class=dl-horizontal>";
  dl+="<dt>" +"Users"+"</dt><dd>"+d.users.length+"</dd>";
  dl+="<dt>" +"Average Between Centrality"+"</dt><dd>"+d.avgBtwCent+"</dd>";
  dl+="<dl>";
  infodiv+=dl;

  infodiv+="</div>";
  _div.html(infodiv);

  // console.log(d.provinces);
  $(".userpie").html("")
  drawPie(".userpie", d.provinces);

}

var showUserGraphInfo = function(_info) {
  var _div= $(".usergraphinfo");
  
  console.log(_info);

  _div.html("")
  if(_info==null) return;

  // var d=_info.data;
  var infodiv="<div>";
  var dl="<dl class=dl-horizontal>";

  for(key in _info.graph) {
    dl+="<dt>" +key+"</dt><dd>"+_info.graph[key]+"</dd>";
  }

  for(key in _info.communities) {
    dl+="<dt>" +key+"</dt><dd>"+_info.communities[key]+"</dd>";
  }

  dl+="<dl>";
  infodiv+=dl;
  infodiv+="</div>";
  _div.html(infodiv);
}


function getLocation(href) {
  var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
  return match && {
      protocol: match[1],
      host: match[2],
      hostname: match[3],
      port: match[4],
      pathname: match[5],
      search: match[6],
      hash: match[7]
  }
}

function drawPie(self, data) {

  var width = 200,
    height = 200,
    radius = Math.min(width, height) / 2;

  var color = d3.scale.category20c();

  var arc = d3.svg.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

  var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) {if(d.label != 0 ) return d.value; });

  var svg = d3.select(self)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var g = svg.selectAll(".pie")
      .data(pie(data))
    .enter().append("g")
      .attr("class", "pie");

  g.append("path")
      .attr("d", arc)
      .attr("data-legend", function(d){return d.data.label})
      .style("fill", function(d) { return color(d.data.label); });

  g.append("text")
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("dy", ".25em")
      .style("fill","#000")
      .style("fill-opacity","0.8")
      .style("text-anchor", "middle")
      .text(function(d) { return d.data.label; });

  svg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(50,30)")
      .style("font-size", "12px")
      // .call(d3.legend)
}