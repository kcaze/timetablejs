onmessage = function (e) {
  var data = JSON.parse(e.data);
  switch (data.settings.algorithm) {
    case "GA":
      GA(data.graph, data.settings);
      break;
    default:
      GA(data.graph, data.settings);
      break;
  }
};

//genetic algorithm
function GA(graph, settings) {
  var populationSize = settings.populationSize || 200;
  var iterations = settings.iterations || 300;
  //returns random integer in [min, max]
  function randInt(min, max) {
    return min+Math.round((max-min)*Math.random());
  }

  var infinity = Math.pow(10, 32);
  var nodeIndex = Object.keys(graph.nodes);
  var best = {score: infinity};

  function fitness(coloring) {
    var score = 0;
    for (var ii = 0; ii < nodeIndex.length; ii++) {
      for (var jj = ii+1; jj < nodeIndex.length; jj++) {
        var e = nodeIndex[ii], f = nodeIndex[jj];
        if (coloring[e] == coloring[f] && graph.edges[e][f])
          score += graph.edges[e][f].weight;
      }
    }
    return score;
  }

  function selection(population) {
    for (var ii = 0; ii < population.length; ii++)
      population[ii].score = fitness(population[ii]);
    population.sort(function (x,y) { return x.score - y.score });
    return population.slice(0, Math.floor(populationSize/2));
  }

  function recombine(p1, p2) {
    var child = {};
    for (var ii = 0; ii < nodeIndex.length; ii++) {
      var n = nodeIndex[ii];
      child[n] = Math.random() < 0.5 ? p1[n] : p2[n];
    }
    return child;
  }

  function mutate(population) {
    for (var ii = 0; ii < population.length; ii++) {
      var n = nodeIndex[randInt(0, nodeIndex.length-1)];
      if (Math.random() < 0.5) {
        var r = randInt(0, settings.classes[n].length-1);
        population[ii][n] = settings.classes[n][r];
      }
    }
  }

  //generate population
  var population = [];
  for (var ii = 0; ii < populationSize; ii++) {
    var coloring = {};
    for (var jj = 0; jj < nodeIndex.length; jj++) {
      var n = nodeIndex[jj];
      var r = randInt(0, settings.classes[n].length-1);
      coloring[n] = settings.classes[n][r];
    }
    coloring.score = fitness(coloring);
    population.push(coloring);
  }

  //and... evolve!
  for (var ii = 0; ii < iterations; ii++) {
    postMessage(JSON.stringify({ type : "progress", progress : ii, max : iterations }));
    population = selection(population);
  
    if (population[0].score < best.score) {
      best = {};
      for (var jj = 0; jj < nodeIndex.length; jj++)
        best[nodeIndex[jj]] = population[0][nodeIndex[jj]];
      best.score = population[0].score;
    }
  
    var children = [];
    while (population.length + children.length < populationSize) {
      var p1 = randInt(0, population.length-1);
      var p2 = randInt(0, population.length-1);
      population.push(recombine(population[p1], population[p2]));
    }
  
    population = population.concat(children);
  
    mutate(population);
  }

  //generate the schedule object to return
  var schedule = {clashes : best.score};
  schedule.blocks = {};
  for (var ii = 0; ii < nodeIndex.length; ii++) {
    schedule.blocks[nodeIndex[ii]] = best[nodeIndex[ii]];
  }
  schedule.clashStudents = [];
  //so ugly...
  for (var ii = 0; ii < nodeIndex.length; ii++) {
    for (var jj = ii+1; jj < nodeIndex.length; jj++) {
      if (best[nodeIndex[ii]] == best[nodeIndex[jj]]) {
        var students1 = graph.nodes[nodeIndex[ii]].students;
        var students2 = graph.nodes[nodeIndex[jj]].students;
        for (var kk = 0; kk < students1.length; kk++) {
          if (students2.indexOf(students1[kk]) != -1) {
            schedule.clashStudents.push({
              student : students1[kk], 
              class1 : nodeIndex[ii],
              class2 : nodeIndex[jj],
              block : best[nodeIndex[ii]]
            });
          }
        }
      }
    }
  }

  postMessage(JSON.stringify({ type : "complete", schedule : schedule }));
}
