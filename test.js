
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

chart = ForceGraph(substacks, {
    nodeId: (d) => d.id,
    nodeGroup: (d) => d.group,
    linkStrokeWidth: (l) => Math.sqrt(l.value),  
    width: window.innerWidth,
    height: window.innerWidth,
    invalidation: null
})

document.body.prepend(chart)