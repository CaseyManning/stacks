// stacks = JSON.parse(substackData)

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
  var id = stack.url;
  urlDict[id] = stack;
  var radius = 5;
  if (stack.n_subs > 0) {
    console.log("yug")
    if(document.getElementById("logcheck").checked == true) {
      radius = 4*Math.log(stack.n_subs / 2000) + 5;
    } else {
      radius = stack.n_subs / 10000 + 5;
    }
    if(radius < 5) {
      radius = 5;
    }
  }
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

function reloadNodes() {
  var radii = {}
  for(var i = 0; i < stacks.length; i++) {
    var stack = stacks[i];
    var id = stack.url;
    if (stack.n_subs > 0) {
      if(document.getElementById("logcheck").checked == true) {
        radius = 4*Math.log(stack.n_subs / 2000) + 5;
      } else {
        radius = stack.n_subs / 10000 + 5;
      }
      if(radius < 5) {
        radius = 5;
      }
    }
    radii[id] = radius;
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