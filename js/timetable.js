timetable = {};

//all things done in a separate thread. set timetable.onload to handle things when functions finish
(function () {
  timetable.parseData = function (csv) {
    var p = new Parallel(csv);
    p.spawn(function (csv) {
      var graph = {nodes: {}, edges: {}};
      var students = {};
      lines = csv.split("\n");
  
      //create nodes
      for (var ii = 0; ii < lines.length; ii++) {
        //skip over blank lines
        if (!lines[ii]) continue;

        var c = lines[ii].split(",")[0];
        var s = lines[ii].split(",")[1];

        graph.nodes[c] = graph.nodes[c] || {};
        graph.nodes[c].students = graph.nodes[c].students || [];
        graph.nodes[c].students.push(s);

        students[s] = students[s] || {};
        students[s].classes = students[s].classes || [];
        students[s].classes.push(c);
      }

      //create edges
      for (node in graph.nodes)
        graph.edges[node] = {};
      for (student in students) {
        var s = students[student]
        for (var ii = 0; ii < s.classes.length; ii++) {
          for (var jj = ii+1; jj < s.classes.length; jj++) {
            var edge1 = graph.edges[s.classes[ii]];
            var edge2 = graph.edges[s.classes[jj]];

            edge1[s.classes[jj]] = edge1[s.classes[jj]] || {};
            edge2[s.classes[ii]] = edge2[s.classes[ii]] || {};
          
            edge1[s.classes[jj]].weight = edge1[s.classes[jj]].weight || 0;
            edge2[s.classes[ii]].weight = edge2[s.classes[ii]].weight || 0;

            edge1[s.classes[jj]].weight += 1;
            edge2[s.classes[ii]].weight += 1;
          }
        }
      }

      return graph;
    }).then(function (data) {
      this.onload({type : "parseData", data : data});
    }.bind(this));
  };

  //implements a genetic algorithm
  timetable.schedule = function (graph, options) {
    var options = options || {colors:6, populationSize:100, iterations:500};
    var p = new Parallel([graph, options]);
    p.spawn(function (data) {
      //returns random integer in [min, max]
      function randInt(min, max) {
        return min+Math.round((max-min)*Math.random());
      }

      var graph = data[0], options = data[1];
      var infinity = Math.pow(10, 32);
      var colors = [];
      var nodeIndex = Object.keys(graph.nodes);
      var best = {score: infinity};

      for (var ii = 0; ii < options.colors; ii++) colors.push[ii];

      function fitness(coloring) {
        var score = 0;
        for (var ii = 0; ii < nodeIndex.length; ii++) {
          for (var jj = ii+1; jj < nodeIndex.length; jj++) {
            var e = nodeIndex[ii], f = nodeIndex[jj];
            if (coloring[e] === coloring[f] && graph.edges[e][f])
              score += graph.edges[e][f].weight;
          }
        }
        return score;
      }

      function selection(population) {
        population.sort(function (x,y) { return x.score - y.score });
        return population.slice(0, Math.floor(options.populationSize/2));
      }

      function recombine(p1, p2) {
        var child = {};
        for (var ii = 0; ii < nodeIndex.length; ii++) {
          var n = nodeIndex[ii];
          child[n] = Math.random() < 0.5 ? p1[n] : p2[n];
        }
        child.score = fitness(child);
        return child;
      }

      function mutate(population) {
        for (var ii = 0; ii < population.length; ii++) {
          var n = nodeIndex[randInt(0, nodeIndex.length-1)];
          if (Math.random() < 0.2)
            population[ii][n] = randInt(0, options.colors-1);
        }
      }

      //generate population
      var population = [];
      for (var ii = 0; ii < options.populationSize; ii++) {
        var coloring = {};
        for (var jj = 0; jj < nodeIndex.length; jj++) {
          var n = nodeIndex[jj];
          coloring[n] = randInt(0, options.colors-1);
        }
        coloring.score = fitness(coloring);
        population.push(coloring);
      }

      //evolve!
      for (var ii = 0; ii < options.iterations; ii++) {
        population = selection(population);

        if (population[0].score < best.score) best = population[0];

        var children = [];
        while (population.length + children.length < options.populationSize) {
          var p1 = randInt(0, population.length-1);
          var p2 = randInt(0, population.length-1);
          population.push(recombine(population[p1], population[p2]));
        }

        population = population.concat(children);

        mutate(population);
      }

      return best;
    }).then(function (data) {
      this.onload({type : "schedule", data : data});
    }.bind(this));
  };

}());
