// stacks = JSON.parse(substackData)

function compute_radius(n_subs) {
  var radius = 5;
  if (n_subs > 0) {
    if(document.getElementById("logcheck").checked == true) {
      radius = 4*Math.log(n_subs / 2000 + 1) + 5;
    } else {
      radius = n_subs / 10000 + 5;
    }
    if(radius < 5) {
      radius = 5;
    }
  }
  return radius;
}

var namesToUrls = {};
for(var i = 0; i < stacks.length; i++) {
  var stack = stacks[i];
  namesToUrls[stack.name] = stack.url;
}

var urlDict = {};

const substacks = {
  nodes : [{'id' : "aoisjifda", group : '1'}],
  links : []
}
var validURLS = [];
for(var i = 0; i < stacks.length; i++) {
  validURLS.push(stacks[i].url);
}
for(var i = 0; i < stacks.length; i++) {
  var stack = stacks[i];
  stack.inlinks = 0;
  var id = stack.url;
  urlDict[id] = stack;
  var radius = compute_radius(stack.n_subs)
  // console.log(id + "has " + stack.n_subs + " subscribers and radius: " + radius);
  var newNode = {'id' : id, group : i, 'nodeRadius': radius, 'nodeTitle': stack.name}
  // validURLS.push(id)
  substacks.nodes.push(newNode);
  for(var j = 0; j < stack.outlinks.length; j++) {
    //if outlink is valid:
    if(validURLS.includes(stack.outlinks[j])) {
      substacks.links.push({"source" : id, "target" : stack.outlinks[j], "value" : 1});
    }
  }
}
//calculate incoming links for each substack
for(var i = 0; i < substacks.links.length; i++) {
  var link = substacks.links[i];
  urlDict[link.target].inlinks += 1;
}

function reloadNodes() {
  var radii = {}
  for(var i = 0; i < stacks.length; i++) {
    var stack = stacks[i];
    var id = stack.url;
    radii[id] = compute_radius(stack.n_subs);
  }
  d3.selectAll('svg g').selectChildren("circle").attr("r", ({id: d}) => radii[d])
}

console.log(substacks);

chart = ForceGraph(substacks, {
    nodeId: d => d.id,
    nodeGroup: d => d.group,
    nodeTitle: d => `${d.id}\n${d.group}`,
    linkStrokeWidth: l => Math.sqrt(l.value),
    width: window.innerWidth,
    height: window.innerHeight,
     // a promise to stop the simulation when the cell is re-run
    invalidation: new Promise(resolve => { resolve() })
  })

//add to document
document.body.prepend(chart)

let zoom = d3.zoom()
  .on('zoom', handleZoom);

function handleZoom(e) {
  // d3.select('svg g')
  //   .attr('transform', e.transform);
  d3.selectAll('svg g')
    .attr('transform', e.transform);
}

function initZoom() {
  d3.select('svg')
    .call(zoom);
}
initZoom();

//on tab key pressed
document.addEventListener('keydown', function(event) {
  if(event.keyCode == 9) {
    if(document.getElementById("search").classList.contains("hidden")) {
      event.preventDefault();
      document.getElementById("search").classList.remove("hidden");
      document.getElementById("searchbar").focus();
    } else {
      document.getElementById("search").classList.add("hidden");
    }
  }
});

//on escape pressed
document.addEventListener('keydown', function(event) {
  if(event.keyCode == 27) {
    if(!document.getElementById("search").classList.contains("hidden")) {
      document.getElementById("search").classList.add("hidden");
      document.getElementById("searchresults").innerHTML = "";
    }
  }
});

function search() {
  var text = document.getElementById("searchbar").value;
  const results = fuzzysort.go(text, stacks, {key: 'name'});
  var resultsDiv = document.getElementById("searchresults");

  const max_results = 5;

  while (resultsDiv.firstChild) {
    resultsDiv.removeChild(resultsDiv.firstChild);
  }

  for(var i = 0; i < Math.min(max_results, results.length); i++) {
    var resultElement = document.createElement("p");
    resultElement.innerHTML = results[i].target;
    resultElement.onclick = function() {
      document.getElementById("search").classList.add("hidden");
      document.getElementById("searchbar").value = "";
      document.getElementById("searchresults").innerHTML = "";
      //zoom in on node with d3
      var id = stripSlashes(namesToUrls[this.innerHTML]);
      var elem = d3.select("#" + id)
      var x = elem.attr("cx");
      var y = elem.attr("cy");
      infobox_stack(namesToUrls[this.innerHTML], urlDict[namesToUrls[this.innerHTML]])
      
      d3.select("svg").call(zoom.transform, d3.zoomIdentity.translate(-2*x,-2*y).scale(2));

      // d3.selectAll('svg g').selectChildren("circle").attr("stroke", ({id: d}) => d == id ? "black" : "white")
      // d3.selectAll('svg g').selectChildren("circle").attr("stroke-width", ({id: d}) => d == id ? 3 : 1.5)
    }
    resultElement.classList.add("result");
    resultsDiv.appendChild(resultElement);
  }
}