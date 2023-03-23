var ticks = 0;
var lastNode;
var stopped = false;
var sim;
var link;
var node;

function stripSlashes(url) {
  return url.replaceAll("/", "").replaceAll(":", "").replaceAll(".", "").replaceAll(" ", "");
}

function infobox(event) {
  let node = event.subject;
  var stack = urlDict[node.id];
  infobox_stack(node.id, stack);
}

function infobox_stack(nodeID, stack) {
  console.log("infoboxing with id: " + nodeID + " and stack: ")
  console.log(stack)
  document.getElementById("infobox").classList.remove("hidden");
  document.getElementById("boxtitle").innerHTML = stack.name;
  document.getElementById("boxsubs").innerHTML = stack.n_subs + " subscribers";
  if(stack.n_subs < 0) {
    document.getElementById("boxsubs").innerHTML = "Under 1000 subscribers";
  }
  document.getElementById("boxlink").href = stack.url;
  document.getElementById("inlinks").innerHTML = "Recommeded by " + stack.inlinks + "  pages.";
  document.getElementById("outlinks").innerHTML = "Recommends " + stack.outlinks.length + " others.";

  d3.selectAll('svg g').selectChildren("circle").attr("stroke", ({id: d}) => d == nodeID ? "black" : "white")
  d3.selectAll('svg g').selectChildren("circle").attr("stroke-width", ({id: d}) => d == nodeID ? 3 : 1.5)
  d3.selectAll('svg g').selectChildren("line").attr("stroke", d => (d.source.id == nodeID || d.target.id == nodeID) ? "black" : "gray")
}

function stopAnim() {
  sim.stop();
  sim.tick()
  sim.tick()
  sim.tick()
    // while (sim.alpha() > sim.alphaMin()) {
    //   sim.tick();
    // }
    // ticked();
    // The simulation has been completed. Draw the final product and update the timer.
    stopped = true;
    sim.alphaTarget(0).restart()
    sim.stop();
}

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/force-directed-graph
function ForceGraph({
    nodes, // an iterable of node objects (typically [{id}, …])
    links // an iterable of link objects (typically [{source, target}, …])
  }, {
    nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
    nodeGroup, // given d in nodes, returns an (ordinal) value for color
    nodeGroups, // an array of ordinal values representing the node groups
    nodeTitle, // given d in nodes, a title string
    nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
    nodeStroke = "#fff", // node stroke color
    nodeStrokeWidth = 1.5, // node stroke width, in pixels
    nodeStrokeOpacity = 1, // node stroke opacity
    nodeRadius = d => d.nodeRadius, // node radius, in pixels
    nodeStrength,
    linkSource = ({source}) => source, // given d in links, returns a node identifier string
    linkTarget = ({target}) => target, // given d in links, returns a node identifier string
    linkStroke = "#999", // link stroke color
    linkStrokeOpacity = 0.6, // link stroke opacity
    linkStrokeWidth = 1, // given d in links, returns a stroke width in pixels
    linkStrokeLinecap = "round", // link stroke linecap
    linkStrength,
    colors = d3.schemeTableau10, // an array of color strings, for the node groups
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    invalidation // when this promise resolves, stop the simulation
  } = {}) {
    // Compute values.
    const N = d3.map(nodes, nodeId).map(intern);
    const R = d3.map(nodes, nodeRadius);
    const LS = d3.map(links, linkSource).map(intern);
    const LT = d3.map(links, linkTarget).map(intern);
    if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
    const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
    const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
    const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);
    const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);
  
    // Replace the input nodes and links with mutable objects for the simulation.
    nodes = d3.map(nodes, (_, i) => ({id: N[i]}));
    links = d3.map(links, (_, i) => ({source: LS[i], target: LT[i]}));
  
    // Compute default domains.
    if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);
  
    // Construct the scales.
    const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);
  
    // Construct the forces.
    const forceNode = d3.forceManyBody();
    const forceLink = d3.forceLink(links).id(({index: i}) => N[i]);
    if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
    if (linkStrength !== undefined) forceLink.strength(linkStrength);
  
    const simulation = d3.forceSimulation(nodes)
        .force("link", forceLink)
        .force("charge", forceNode)
        .force("center",  d3.forceCenter())
        .on("tick", ticked);
  
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
    link = svg.append("g")
        .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
        .attr("stroke-opacity", linkStrokeOpacity)
        .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
        .attr("stroke-linecap", linkStrokeLinecap)
      .selectAll("line")
      .data(links)
      .join("line");
  

    node = svg.append("g")
        .attr("fill", nodeFill)
        .attr("stroke", nodeStroke)
        .attr("stroke-opacity", nodeStrokeOpacity)
        .attr("stroke-width", nodeStrokeWidth)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
        .attr("r", 5)
        .call(drag(simulation));
    sim = simulation;
      // node.append("text")
      // .text(function(d) {
      //   return d.id;
      // })
      // .style('fill', '#000')
      // .style('font-size', '12px')
      // .attr('x', 6)
      // .attr('y', 3);
  
    if (R) node.attr("r", ({index: i}) => R[i]);
    // console.log(T)
    if (T) node.attr("id", ({index: i}) => stripSlashes(T[i].split("\n")[0]));

    if (W) link.attr("stroke-width", ({index: i}) => W[i]);
    if (L) link.attr("stroke", ({index: i}) => L[i]);
    if (G) node.attr("fill", ({index: i, id: d}) => d == searched_id ? "black" : color(G[i]));
    // if (T) node.append("title").text(({index: i}) => T[i]);
    if (invalidation != null) invalidation.then(() => simulation.stop());
  
    function intern(value) {
      return value !== null && typeof value === "object" ? value.valueOf() : value;
    }
  
    function ticked() {
      ticks += 1;
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
  
      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      // if(!document.getElementById("animcheck").checked && !stopped) {
      //   simulation.stop();
      //   stopped = true;
      //   while (ticks < 400) {
      //     simulation.tick();
      // }
  
      // // The simulation has been completed. Draw the final product and update the timer.
      // draw();
      // // stopped = false;
      // }
    }

    // ticked();
  
    function drag(simulation) {    
      function dragstarted(event) {
        if(stopped) {
          return;
        }
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
        infobox(event)
      }
     
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) {
          simulation.alphaTarget(0.3)
        };
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  
    return Object.assign(svg.node(), {scales: {color}});
  }
