// config object

var Config = function() {

    var self = this;

     /*
      MODEL

      self.tstart      : Date
      self.tend        : Date
      self.provinces   : Array
      self.users       : Array
      self.words       : Array
      self.layout      : String

    */

    self.validLayout =  [
      "user", 
      "map",
      "geo"
    ];

    self.setName= function(name) {
      self.name=name;
    }

    self.setStart = function(start) {
      // if(!isValidDate(start)) throw new Error("Invalid datetime: " + start);
      self.start = start;
    }

    self.setEnd = function(end) {
      // if(!isValidDate(end)) throw new Error("Invalid datetime: " + end);
      self.end = end;
    }

    self.getFilename = function() {
      var s=String(new Date(self.start)).split(" ").slice(1,4).join("_")
      var e=String(new Date(self.end)).split(" ").slice(1,4).join("_")
      return self.name+"_"+s+"_"+e;
    }

    self.geoColors = function() {

      return {
        "Anhui": "#a1d99b",
        "Aomen": "#c7e9c0",
        "Beijing": "#756bb1",
        "Chongqing": "#9e9ac8",
        "Fujian": "#bcbddc",
        "Gansu": "#dadaeb",
        "Guangdong": "#c7e9c0",
        "Guangxi": "#969696",
        "Guizhou": "#bdbdbd",
        "Hainan": "#d9d9d9",
        "Hebei": "#393b79",
        "Heilongjiang": "#5254a3",
        "Henan": "#6b6ecf",
        "Hubei": "#9c9ede",
        "Hunan": "#637939",
        "Inner Mongol": "#8ca252",
        "Jiangsu": "#b5cf6b",
        "Jiangxi": "#cedb9c",
        "Jilin": "#8c6d31",
        "Liaoning": "#bd9e39",
        "Ningxia": "#e7ba52",
        "Qinghai": "#e7cb94",
        "Shaanxi": "#843c39",
        "Shandong": "#ad494a",
        "Shanghai": "#d6616b",
        "Shanxi": "#e7969c",
        "Sichuan": "#7b4173",
        "Taiwan": "#a55194",
        "Tianjin": "#ce6dbd",
        "Xianggang": "#de9ed6",
        "Xinjiang": "#1f77b4",
        "Xizang": "#aec7e8",
        "Yunnan": "#ff7f0e",
        "Zhejiang": "#ffbb78",
        "Haiwai" : "#bd9e39",
        "Qita":"#ff7f0e",
        "Others": "#cccccc"
            }
    }

    self.toJSON = function() {
      return JSON.stringify({
        start: self.start,
        end: self.end,
        name: self.name
      })
    }

}

function isValidDate(d) {
  if ( Object.prototype.toString.call(d) !== "[object Date]" )
    return false;
  return !isNaN(d.getTime());
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}