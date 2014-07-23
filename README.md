# timetableJS

## Introduction

timetableJS is an online tool used to solve the problem of scheduling classes into discrete time blocks,
minimizing the number of conflicts for the students taking classes. To use timetableJS, a CSV data file and
JSON restrictions file are required.

Because timetableJS employs stochastic algorithms to minimize the number of conflicts present,
the schedule is randomly generated each time. Therefore, the optimal schedule may not be outputted the first time
timetableJS is run. It is recommended to run timetableJS multiple times until you are satisfied with the number of conflicts present
in the schedule.

## Data file

The data file is used to specify the list of students that take each class. It should be a [CSV file](http://en.wikipedia.org/wiki/Comma-separated_values) where
each line is formatted as `<CLASS_ID>, <STUDENT_ID>`. The example data file used for
scheduling WAB's 2013-2014 HL classes can be found [here](app/files/data.csv).

## Restrictions file

The restrictions file is used to specify any restrictions that timetableJS must schedule around. In addition,
the restrictions file is also used to specify which scheduling algorithm to use. Currently, only a genetic
algorithm (GA) is implemented. The restrictions file should be a [JSON file](http://en.wikipedia.org/wiki/JSON) in the following format:
```
{
  // The list of all possible time blocks. If a class is omitted 
  // in the whitelist, it is assumed there are no restrictions.
  "blocks" : ["BLOCK_1", "BLOCK_2", ..., "BLOCK_N"],

  // A whitelist of time blocks for each class.
  "classes" : {
    "CLASS1_ID" : ["BLOCK_1", "BLOCK_2", ..., "BLOCK_N1"],
    "CLASS2_ID" : ["BLOCK_1", "BLOCK_2", ..., "BLOCK_N2"],
    //etc
  },

  // Classes that can never be scheduled in the same time block
  "classConflicts" : {
    "CLASS_A" : ["CLASS1", "CLASS2", ..., "CLASSN"],
    "CLASS_B" : ["CLASS1", "CLASS2", ..., "CLASSN"],
  }

  "algorithm" : "GA",
  "iterations" : "500",
  "populationSize" : "100",
}
```
A higher population size and number of iterations increases the likelihood of a low conflict schedule but also drastically increases
the amount of time required to obtain a schedule. The population size is recommended to be in the range 100 to 1000, and the recommended 
number of iterations likewise.
The example restrictions file used for scheduling WAB's 2013-2014 HL classes can be found [here](app/files/restrictions.json).
