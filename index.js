
// stacks = JSON.parse(substackData)
var global = false;
var all_anim = false;
var currentUrls;
var zoom;
var searched_id = null;
function compute_radius(n_subs) {
  var min_radius = 7;
  var radius = min_radius;
  if (n_subs > 0) {
    if(document.getElementById("logcheck").checked == true) {
      radius = 4*Math.log(n_subs / 2000 + 1) + min_radius;
    } else {
      radius = n_subs / 10000 + min_radius;
    }
    if(radius < min_radius) {
      radius = min_radius;
    }
  }
  return radius;
}

function calcLinkDist(dist) {
  var min = 0.1;
  var max = 1;
  
  var norm = (dist - min) / (max - min);
  return norm * 240 - 110;
}

var categories = ["Tech", "Politics", "Business",  "Culture", "Entertainment", "Finance", "Food", "Blockchain", "Science", "Other", "Personal", "Sports"];

var namesToUrls = {};
for(var i = 0; i < stacks.length; i++) {
  var stack = stacks[i];
  namesToUrls[stack.name] = stack.url;
}

var urlDict = {};

var linkStrengths = [];
function assemble_nodes(curr_stacks) {

  var validURLS = [];
  for(var i = 0; i < curr_stacks.length; i++) {
    validURLS.push(curr_stacks[i].url);
  }

  var nodesAndLinks = {
    nodes : [],
    links : []
  }
  linkStrengths = [];
  for(var i = 0; i < curr_stacks.length; i++) {
    var stack = curr_stacks[i];
    stack.inlinks = 0;
    var id = stack.url;
    urlDict[id] = stack;
    var radius = compute_radius(stack.n_subs)
    var category = stack.category;
    if(!categories.includes(category)) {
      category = "Other";
    }
    var group = categories.indexOf(stack.category);
    var newNode = {'id' : id, group : group, 'nodeRadius': radius, 'nodeTitle': stack.name}
    nodesAndLinks.nodes.push(newNode);
    for(var j = 0; j < stack.outlinks.length; j++) {
      if(validURLS.includes(stack.outlinks[j])) {
        linkStrengths.push(calcLinkDist(stack.outdists[j]))
        nodesAndLinks.links.push({"source" : id, "target" : stack.outlinks[j], "value" : 1});
      }
    }
  }
  //calculate incoming links for each substack
  for(var i = 0; i < nodesAndLinks.links.length; i++) {
    var link = nodesAndLinks.links[i];
    urlDict[link.target].inlinks += 1;
  }
  return nodesAndLinks;
}

const substacks = assemble_nodes(stacks);

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
  currentUrls = [];
  for(var i = 0; i < dataset.nodes.length; i++) {
    currentUrls.push(dataset.nodes[i].id);
  }
  d3.selectAll('svg g').remove();
  if(sim) {
    sim.stop();
  }
  chart = ForceGraph(dataset, {
      nodeId: d => d.id,
      nodeGroup: d => d.group,
      nodeTitle: d => `${d.id}\n${d.group}`,
      linkStrokeWidth: l => Math.sqrt(l.value),
      width: window.innerWidth,
      height: window.innerHeight,
      // a promise to stop the simulation when the cell is re-run
      invalidation: null,
      linkStrength: linkStrengths
    })

  //add to document
  document.body.prepend(chart)

  zoom = d3.zoom()
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
  d3.selectAll('svg g').selectChildren("line").attr("stroke", "#aaa")

  if(global) {
    document.getElementById("recenter").classList.add("hidden");
    document.getElementById("showglobal").classList.add("hidden");
    // drawingLines = false;
    // document.getElementById("linkscheck").checked = false;
  } else {
    document.getElementById("recenter").classList.remove("hidden");
    document.getElementById("showglobal").classList.remove("hidden");
    drawingLines = true;
    document.getElementById("linkscheck").checked = true;
  }
  toggleLines(drawingLines);
  if(window.innerWidth < 400) {
    document.getElementById("recenter").classList.add("hidden");
    document.getElementById("showglobal").classList.add("hidden");
  }
  toggleLines(drawingLines)
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
    var resultDiv = document.createElement("div");
    resultDiv.classList.add("resultdiv");
    var resultElement = document.createElement("p");
    resultElement.innerHTML = results[i].target;
    resultElement.onclick = function() {
      document.getElementById("introPage").classList.add("hidden");
      document.getElementById(barId).value = "";
      document.getElementById(resultsId).innerHTML = "";

      searched_id = namesToUrls[this.innerHTML];
      // var data = filter_substacks(namesToUrls[this.innerHTML], 3);
      // console.log(data)
      // global = false;
      // startSim(data);

      viewSelected(searched_id)
    }
    resultElement.classList.add("result");

    if(barId == "introsearchbar") {
      resultsDiv.appendChild(resultElement);
    } else {
      var resultButton = document.createElement("p");
      resultButton.classList.add("pbutton");
      resultButton.style.color = "#999";
      resultButton.innerHTML = "locate";
      resultButton.onclick = function() {
        var id = stripSlashes(namesToUrls[this.previousSibling.innerHTML]);
        document.getElementById(barId).value = "";
        document.getElementById(resultsId).innerHTML = "";

        var elem = d3.select("#" + id)
        var x = elem.attr("cx");
        var y = elem.attr("cy");
        infobox_stack(namesToUrls[this.previousSibling.innerHTML], urlDict[namesToUrls[this.previousSibling.innerHTML]])
        
        d3.select("svg").call(zoom.transform, d3.zoomIdentity.translate(-2*x,-2*y).scale(2));
  
      };
      resultDiv.appendChild(resultElement);
      if(currentUrls.includes(namesToUrls[results[i].target])) {
        resultDiv.appendChild(resultButton);
      }
      resultsDiv.appendChild(resultDiv);
    }
  }
}

//find all at most radius connections away
function filter_substacks(origin, radius, maxNodes) {
  // var substacks = {"nodes": [], "links": []};
  var queue = [origin];
  var visited = [origin];
  for(var i = 0; i < radius; i++) {
    if(i == radius-1 && queue.length > 300) {
      break
    }
    var newQueue = [];
    for(var j = 0; j < queue.length; j++) {
      for(var k = 0; k < stacks.length; k++) {
        if(visited.length > maxNodes) {
          break
        }
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

  var curr_stacks = [];
  for(url in visited) {
    curr_stacks.push(urlDict[visited[url]]);
  }
  return assemble_nodes(curr_stacks);
}

function viewAll() {
  global = true;
  if (history.pushState) {
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({path:newurl},'',newurl);
  }
  document.getElementById("introPage").classList.add("hidden");
  document.getElementById("randlink").classList.add("hidden");
  document.getElementById("navbar").classList.remove("hidden");
  startSim(substacks);
  if(!all_anim) {
    sim.stop();

    d3.selectAll('svg g').selectChildren("circle").each(function(d) {
      d.x = cached_positions[d.id][0];
      d.y = cached_positions[d.id][1];
    });

    d3.select("svg").call(zoom.transform, d3.zoomIdentity.scale(0.1));

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    // link.attr("style", "display: none;")
      link.attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    console.log("started static global view")
  }
}
var drawingLines = document.getElementById("linkscheck").checked;

function toggleLines(shouldShow) {
  drawingLines = shouldShow
  if(shouldShow) {
    link.attr("style", "display: unset;")
  } else {
    link.attr("style", "display: none;")
  }
}

function save_positions() {
  var positions = {};
  d3.selectAll('svg g').selectChildren("circle").each(function(d) {
    positions[d.id] = [d3.select(this).attr("cx"), d3.select(this).attr("cy")];
  });
  console.log(JSON.stringify(positions));
  
}

function recenter() {
  if(global || searched_id == null) {
    return;
  }
  var id = stripSlashes(searched_id);
  var elem = d3.select("#" + id)
  var x = elem.attr("cx");
  var y = elem.attr("cy");
  infobox_stack(searched_id, urlDict[searched_id])
  
  d3.select("svg").call(zoom.transform, d3.zoomIdentity.translate(-2*x,-2*y).scale(2));
}

function viewClicked(button) {
  document.getElementById("navbar").classList.remove("hidden");
  viewSelected(button.name);
}

function viewSelected(id, setUrl=true, maxNodes=10000) {
  searched_id = id;
  var data = filter_substacks(id, 3, maxNodes);
  global = false;

  if(setUrl && history.pushState) {
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?url=' + id;
    window.history.pushState({path:newurl},'',newurl);
    
  }
  if(setUrl) {
    document.getElementById("navbar").classList.remove("hidden");
    document.getElementById("randlink").classList.add("hidden");
  }

  startSim(data);
}

if(window.location.search) {
  document.getElementById("introPage").classList.add("hidden");
  document.getElementById("navbar").classList.remove("hidden");
  var url = window.location.search.split("=")[1];
  viewSelected(url);
} else {
  //select random url
  var url = stacks[Math.floor(Math.random() * stacks.length)].url;
  viewSelected(url, false, 300);
  while(currentUrls.length < 30) {
    var url = stacks[Math.floor(Math.random() * stacks.length)].url;
    viewSelected(url, false, 300);
  } 
  document.getElementById("randlink").classList.remove("hidden");
  document.getElementById("randlink").innerHTML = "viewing random graph: " + urlDict[searched_id].name;
  document.getElementsByTagName("body").onclick = () => {console.log('hi')}
}