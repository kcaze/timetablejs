timetable = (function () {
  function timetable(data_csv, settings_json) {
    var graph, settings, options;

    function csvToGraph(csv) {
      var students = {};
      var lines = csv.split("\n");
      graph = {nodes: {}, edges: {}};
  
      //create nodes
      for (var ii = 0; ii < lines.length; ii++) {
        //skip over blank lines
        if (!lines[ii]) continue;

        var cols = lines[ii].split(",");
        if (cols.length < 2) {
          throw "Missing columns in line "+(ii+1)+".";
        }

        var c = cols[0]; // class_id
        var s = cols[1]; // student_id

        graph.nodes[c] = graph.nodes[c] || {};
        graph.nodes[c].students = graph.nodes[c].students || [];
        graph.nodes[c].students.push(s);

        students[s] = students[s] || {};
        students[s].classes = students[s].classes || [];
        students[s].classes.push(c);
      }

      //create edges
      for (node in graph.nodes) {
        graph.edges[node] = {};
      }

      for (student in students) {
        var s = students[student];
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
      // classes not listed in the settings defaults to placeable in all blocks
      for (n in graph.nodes) {
        settings.classes[n] = settings.classes[n] || settings.blocks;
      }
    }

    try {
      csvToGraph(data_csv);
    } catch(e) {
      timetable.onComplete({ type: "error", message: e });
      return; // abort
    }
    console.log("CSV parsed and produced graph.")
    console.log(graph);
    try {
      jsonToSettings(settings_json);
    } catch(e) {
      timetable.onComplete({ 
        type: "error", 
        message: "Error while parsing restrictions file: '"+e.message+"'"
      });
      return; // abort
    }
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
