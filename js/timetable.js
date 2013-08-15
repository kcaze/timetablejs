timetable = (function () {
  function timetable(data_csv, settings_json) {
    var graph, settings, options;
    function csvToGraph(csv) {
      graph = {nodes: {}, edges: {}};
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
    }
    function jsonToSettings(json) {
      settings = JSON.parse(json);
      for (n in graph.nodes)
        settings.classes[n] = settings.classes[n] || settings.blocks;
    }

    csvToGraph(data_csv);
    console.log("CSV parsed and produced graph.")
    console.log(graph);
    jsonToSettings(settings_json);
    console.log("JSON parsed and produced settings.");
    console.log(settings);

    var data = {graph : graph, settings : settings, options : options};
    var w = new Worker("js/schedule.js");
    w.onmessage = function (e) {
      timetable.onComplete(JSON.parse(e.data));
    };
    w.postMessage(JSON.stringify(data));
  }

  timetable.onComplete = function () { };

  return timetable;
}())
