// stacks = JSON.parse(substackData)
var searched_id = null;
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

function startSim(dataset) {

  chart = ForceGraph(dataset, {
      nodeId: d => d.id,
      nodeGroup: d => d.group,
      nodeTitle: d => `${d.id}\n${d.group}`,
      linkStrokeWidth: l => Math.sqrt(l.value),
      width: window.innerWidth,
      height: window.innerHeight,
      // a promise to stop the simulation when the cell is re-run
      invalidation: null
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
}
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

function search_old() {
  var text = document.getElementById("introsearchbar").value;
  const results = fuzzysort.go(text, stacks, {key: 'name'});
  var resultsDiv = document.getElementById("searchresults");

  const max_results = 5;
  console.log("searching for " + text)
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


function search(barId, resultsId) {
  var text = document.getElementById(barId).value;
  const results = fuzzysort.go(text, stacks, {key: 'name'});
  var resultsDiv = document.getElementById(resultsId);

  const max_results = 5;
  console.log("searching for " + text)
  while (resultsDiv.firstChild) {
    resultsDiv.removeChild(resultsDiv.firstChild);
  }

  for(var i = 0; i < Math.min(max_results, results.length); i++) {
    var resultElement = document.createElement("p");
    resultElement.innerHTML = results[i].target;
    resultElement.onclick = function() {
      document.getElementById("introPage").classList.add("hidden");
      document.getElementById(barId).value = "";
      document.getElementById(resultsId).innerHTML = "";

      searched_id = namesToUrls[this.innerHTML];
      var data = filter_substacks(namesToUrls[this.innerHTML], 3);
      console.log(data)
      startSim(data);
      //zoom in on node with d3

      // d3.selectAll('svg g').selectChildren("circle").attr("stroke", ({id: d}) => d == id ? "black" : "white")
      // d3.selectAll('svg g').selectChildren("circle").attr("stroke-width", ({id: d}) => d == id ? 3 : 1.5)
    }
    resultElement.classList.add("result");
    resultsDiv.appendChild(resultElement);
  }
}

//find all at most radius connections away
function filter_substacks(origin, radius) {
  var substacks = {"nodes": [], "links": []};
  var queue = [origin];
  var visited = [origin];
  for(var i = 0; i < radius; i++) {
    console.log(queue)
    var newQueue = [];
    for(var j = 0; j < queue.length; j++) {
      for(var k = 0; k < stacks.length; k++) {
        var stack = stacks[k];
        if(stack.outlinks.includes(queue[j]) && !visited.includes(stack.url)) {
          newQueue.push(stack.url);
          visited.push(stack.url);
        }
        if(urlDict[queue[j]].outlinks.includes(stack.url) && !visited.includes(stack.url)) {
          newQueue.push(stack.url);
          visited.push(stack.url);
        }
      }
    }
    queue = newQueue;
  }
  for(var i = 0; i < visited.length; i++) {
    var stack = urlDict[visited[i]];
    var radius = compute_radius(stack.n_subs)
    var newNode = {'id' : visited[i], group : i, 'nodeRadius': radius, 'nodeTitle': stack.name}
    substacks.nodes.push(newNode);
    for(var j = 0; j < urlDict[visited[i]].outlinks.length; j++) {
      if(visited.includes(urlDict[visited[i]].outlinks[j])) {
        substacks.links.push({"source": visited[i], "target": urlDict[visited[i]].outlinks[j], "value": 1});
      }
    }
  }
  return substacks;
}

function viewAll() {
  document.getElementById("introPage").classList.add("hidden");
  startSim(substacks);

  sim.stop();

  d3.selectAll('svg g').selectChildren("circle")
  .attr("x", d => cached_positions[d.id][0])
  .attr("y", d => cached_positions[d.id][1]);

node
  .attr("cx", d => d.x)
  .attr("cy", d => d.y);

  link
  .attr("x1", d => d.source.x)
  .attr("y1", d => d.source.y)
  .attr("x2", d => d.target.x)
  .attr("y2", d => d.target.y);


}

function save_positions() {
  var positions = {};
  d3.selectAll('svg g').selectChildren("circle").each(function(d) {
    positions[d.id] = [d3.select(this).attr("cx"), d3.select(this).attr("cy")];
  });
  console.log(JSON.stringify(positions));
  
}