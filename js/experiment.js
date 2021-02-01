var touchstone = 2;

var state = {
  NONE:0,
  INSTRUCTIONS: 1,
  SHAPES: 2,
  PLACEHOLDERS: 3,
};

var ctx = {
  w: 800,
  h: 600,

  trials: [],
  participant: "",
  startBlock: 0,
  startTrial: 0,
  cpt: 0,

  participantIndex:touchstone == 1 ? "Participant" : "ParticipantID",
  practiceIndex:"Practice",
  blockIndex: (touchstone == 1 ? "Block" : "Block1"),
  trialIndex: (touchstone == 1 ? "Trial" : "TrialID"),
  vvIndex:"VV",
  objectsCountIndex:"OC",

  state:state.NONE,
  targetIndex:0,

  // TODO log measures
  // loggedTrials is a 2-dimensional array where we store our log file
  // where one line is one trial
  loggedTrials:
    touchstone == 1 ?
    [["Participant","Practice","Block","Trial","VV","OC","visualSearchTime","ErrorCount"]] :
    [["DesignName","ParticipantID","TrialID","Block1","Trial","VV","OC","visualSearchTime","ErrorCount"]]
};

var currentResult = {
  pIndex : 0,
  searchTime : 0,
  errorCount : 0
};

/***************************************/
/********** LOAD CSV DESIGN FILE ********/
/****************************************/

var loadData = function(svgEl){
  // d3.csv parses a csv file...
  d3.csv("experiment_touchstone"+touchstone+".csv").then(function(data){
    // ... and turns it into a 2-dimensional array where each line is an array indexed by the column headers
    // for example, data[2]["OC"] returns the value of OC in the 3rd line
    ctx.trials = data;
    // all trials for the whole experiment are stored in global variable ctx.trials
    //console.log(ctx.trials);
    var participant = "";
    var options = [];

    for(var i = 0; i < ctx.trials.length; i++) {
      if(!(ctx.trials[i][ctx.participantIndex] === participant)) {
        participant = ctx.trials[i][ctx.participantIndex];
        options.push(participant);
      }
    }

    var select = d3.select("#participantSel")
    select.selectAll("option")
      .data(options)
      .enter()
      .append("option")
      .text(function (d) { return d; });

    setParticipant(options[0]);

  }).catch(function(error){console.log(error)});
};

/****************************************/
/************* RUN EXPERIMENT ***********/
/****************************************/


var startExperiment = function(event) {
  event.preventDefault();

  // set the trial counter to the first trial to run
  // ctx.participant, ctx.startBlock and ctx.startTrial contain values selected in combo boxes

  for(var i = 0; i < ctx.trials.length; i++) {
    if(ctx.trials[i][ctx.participantIndex] === ctx.participant) {
      if(parseInt(ctx.trials[i][ctx.blockIndex]) == ctx.startBlock
               && (touchstone == 2 || ctx.trials[i][ctx.practiceIndex] === "false")) {
        if(parseInt(ctx.trials[i][ctx.trialIndex]) == ctx.startTrial) {
          ctx.cpt = i - 1;

          if(touchstone == 1) { // include practice trials before this trial for TouchStone 1
            while(ctx.cpt >= 0 && ctx.trials[ctx.cpt][ctx.practiceIndex] === "true") {
              ctx.cpt = ctx.cpt-1;
            }
          }
          currentResult.pIndex = ctx.participant;
          // start first trial
          console.log("start experiment at "+ctx.cpt);
          nextTrial();
          return;
        }
      }
    }
  }

}

var nextTrial = function() {
    ctx.cpt++;
    if((typeof ctx.trials[ctx.cpt] == "undefined") || (ctx.trials[ctx.cpt][ctx.participantIndex]!=currentResult.pIndex)){
      //currentResult.pIndex = ctx.trials[ctx.cpt][ctx.participantIndex];
      displayDownload();
    }else{
      console.log(ctx.trials[ctx.cpt][ctx.participantIndex]);
      displayInstructions();
    }
}

var displayDownload = function() {
  ctx.state = state.INSTRUCTIONS;
  console.log("download");
  d3.select("#instr")
    .append("div")
    .attr("id", "instructions")
    .classed("instr", true);

  d3.select("#instructions")
    .append("p")
    .html("You finished the test !");

  d3.select("#instructions")
    .append("p")
    .html("THANK YOU FOR YOUR PARTICIPATION");

  d3.select("#instructions")
    .append("p")
    .html("You can now download the log file and send it at florian.apavou@u-psud.fr");

}

var displayInstructions = function() {
  ctx.state = state.INSTRUCTIONS;

  d3.select("#instr")
    .append("div")
    .attr("id", "instructions")
    .classed("instr", true);

  d3.select("#instructions")
    .append("p")
    .html("Multiple shapes will get displayed.<br> Only <b>one shape</b> is different from all other shapes.");

  d3.select("#instructions")
    .append("p")
    .html("1. Spot it as fast as possible and press <code>Space</code> bar;");

  d3.select("#instructions")
    .append("p")
    .html("2. Click on the placeholder over that shape.");

  d3.select("#instructions")
    .append("p")
    .html("Press <code>Enter</code> key when ready to start.");
    var step = ctx.trials[ctx.cpt][ctx.trialIndex]%45;
    if(step == 0){
      step = 46;
    }
  d3.select("#instructions")
    .append("p")
    .html("Step: "+step+"/46");

}
/*
var displayError = function() {
  ctx.state = state.INSTRUCTIONS;

  d3.select("#instr")
    .append("div")
    .attr("id", "instructions")
    .classed("instr", true);

  d3.select("#instructions")
    .append("p")
    .html("Wrong answer, the current step is going to start again.");

}

var displaySuccess = function() {
  ctx.state = state.INSTRUCTIONS;

  d3.select("#instr")
    .append("div")
    .attr("id", "instructions")
    .classed("instr", true);

  d3.select("#instructions")
    .append("p")
    .html("Good Answer.");

}
*/

function randomIntFromInterval(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}

var displayShapes = function() {
  ctx.state = state.SHAPES;

  var visualVariable = ctx.trials[ctx.cpt]["VV"];
  var oc = ctx.trials[ctx.cpt]["OC"];
  if(oc === "Small") {
    objectCount = 9;
  } else if(oc === "Medium") {
    objectCount = 25;
  } else {
    objectCount = 49;
  }
  console.log("display shapes for condition "+oc+","+visualVariable);

  var svgElement = d3.select("svg");
  var group = svgElement.append("g")
  .attr("id", "shapes")
  .attr("transform", "translate(100,100)");

  // 1. Decide on the visual appearance of the target
  // In my example, it means deciding on its size (large or small) and its color (light or dark)

  var randomNumber1 = Math.random();
  var randomNumber2 = Math.random();
  var targetSize, targetColor;
  var notTC, notTS;
  if(randomNumber1 > 0.5) {
    targetSize = 25; // target is large
    notTS = 15;
  } else {
    targetSize = 15; // target is small
    notTS = 25;
  }

  if(randomNumber2 > 0.5) {
    targetColor = "YellowGreen"; // target is dark gray
    notTC = "SaddleBrown";
  } else {
    targetColor = "SaddleBrown"; // target is light gray
    notTC = "YellowGreen";
  }

  // 2. Set the visual appearance of all other objects now that the target appearance is decided
  // Here, we implement the case VV = "Size" so all other objects are large (resp. small) if target is small (resp. large) but have the same color as target.
  var objectsAppearance = [];
  console.log("Visual Variable: "+ visualVariable);
  var nonTCCount = 2;
  var nonTSCount = 2;
  var nonTCTSCount = 2;
  for (var i = 0; i < objectCount-1; i++) {
    if(visualVariable == "Size")
    {
      if(targetSize == 25)
      {
        objectsAppearance.push({
          size: 15,
          color: targetColor
        });
      } else {
        objectsAppearance.push({
          size: 25,
          color: targetColor
        });
      }
    }
    else if(visualVariable == "Color")
    {
      if(targetColor == "YellowGreen")
      {
        objectsAppearance.push({
          size: targetSize,
          color: "SaddleBrown"
        });
      } else {
        objectsAppearance.push({
          size: targetSize,
          color: "YellowGreen"
        });
      }
    }
    else
    {
      var objColor;
      var objSize;
      if(nonTCCount > 0){
        objColor = notTC;
        objSize = targetSize;
        nonTCCount --;
      }
      else if(nonTSCount > 0){
        objColor = targetColor;
        objSize = notTS;
        nonTSCount --;
      }
      else if(nonTCTSCount > 0){
        objColor = notTC;
        objSize = notTS;
        nonTCTSCount --;
      }
      else{
        console.log("Random")
        do{
          var rn1 = Math.random();
          var rn2 = Math.random();
          if(rn1 > 0.5){
            objColor = "YellowGreen";
          }
          else{
            objColor = "SaddleBrown";
          }

          if(rn2 > 0.5){
              objSize = 25;
          }
          else{
            objSize = 15;
          }
        }while((objSize == targetSize) && (objColor == targetColor));
      }

      //console.log("Target: "+ targetSize +" & "+ targetColor);
      //console.log("nonTarget: "+ nonTargetSize +" & "+ nonTargetColor);
      console.log(nonTCCount+", "+ nonTSCount+", "+nonTCTSCount);
      console.log(objColor+", "+ objSize);
      objectsAppearance.push({
        size: objSize,
        color: objColor
      })
    }

  }

  // 3. Shuffle the list of objects (useful when there are variations regarding both visual variable) and add the target at a specific index
  shuffle(objectsAppearance);
  // draw a random index for the target
  ctx.targetIndex = Math.floor(Math.random()*objectCount);
  // and insert it at this specific index
  objectsAppearance.splice(ctx.targetIndex, 0, {size:targetSize, color:targetColor});

  // 4. We create actual SVG shapes and lay them out as a grid
  // compute coordinates for laying out objects as a grid
  var gridCoords = gridCoordinates(objectCount, 60);
  // display all objects by adding actual SVG shapes
  for (var i = 0; i < objectCount; i++) {
      group.append("circle")
      .attr("cx", gridCoords[i].x)
      .attr("cy", gridCoords[i].y)
      .attr("r", objectsAppearance[i].size)
      .attr("fill", objectsAppearance[i].color)
      .attr("value", i);
  }

}

var displayPlaceholders = function() {
  ctx.state = state.PLACEHOLDERS;

  var visualVariable = ctx.trials[ctx.cpt]["VV"];
  var oc = ctx.trials[ctx.cpt]["OC"];
  var designName = ctx.trials[ctx.cpt]["DesignName"];
  var participantID = ctx.trials[ctx.cpt]["ParticipantID"];
  var trialID = ctx.trials[ctx.cpt]["TrialID"];
  var block1 = ctx.trials[ctx.cpt]["Block1"];
  var trial = ctx.trials[ctx.cpt]["Trial"];
  var time = currentResult.searchTime;
  var error = currentResult.errorCount;
  var objectCount = 0;

  if(oc === "Small") {
    objectCount = 9;
  } else if(oc === "Medium") {
    objectCount = 25;
  } else {
    objectCount = 49;
  }

  var svgElement = d3.select("svg");
  var group = svgElement.append("g")
  .attr("id", "placeholders")
  .attr("transform", "translate(100,100)");

  var gridCoords = gridCoordinates(objectCount, 60);
  for (var i = 0; i < objectCount; i++) {
    var placeholder = group.append("rect")
        .attr("x", gridCoords[i].x-28)
        .attr("y", gridCoords[i].y-28)
        .attr("width", 56)
        .attr("height", 56)
        .attr("fill", "Gray")
        .attr("value", i);


    placeholder.on("click",
        function() {
          // TODO
          var clickedIndex = d3.select(this).attr("value");
          if(clickedIndex != ctx.targetIndex){
            //displayError();
            console.log("Error");
            currentResult.errorCount += 1;
            ctx.cpt --;
          }
          else{
            //displaySuccess();
            console.log("Success");
            ctx.loggedTrials.push([designName,participantID,trialID,block1,ctx.cpt,visualVariable,oc,time,error]);
          }
          d3.select('#placeholders').remove();
          d3.select('#shapes').remove();
          nextTrial();
          }
      );

  }
}

var timer;
var keyListener = function(event) {
  event.preventDefault();
  if(ctx.state == state.INSTRUCTIONS && event.code == "Enter") {
    d3.select("#instructions").remove();
    displayShapes();
    timer = Date.now();
    console.log(timer);
  }

  if(ctx.state == state.SHAPES && event.code == "Space") {
    d3.select("#instructions").remove();
    currentResult.searchTime = Date.now() - timer;
    console.log(currentResult.searchTime);
    displayPlaceholders();
  }

  /*
  if(ctx.state == state.PLACEHOLDERS && event.code == "Enter") {
    d3.select('#shapes').remove();
    nextTrial();
  }
  */


}

var downloadLogs = function(event) {
  event.preventDefault();
  var csvContent = "data:text/csv;charset=utf-8,";
  console.log("logged lines count: "+ctx.loggedTrials.length);
  ctx.loggedTrials.forEach(function(rowArray){
   var row = rowArray.join(",");
   csvContent += row + "\r\n";
   console.log(rowArray);
  });
  var encodedUri = encodeURI(csvContent);
  var downloadLink = d3.select("form")
  .append("a")
  .attr("href",encodedUri)
  .attr("download","logs_"+currentResult.pIndex+"_"+Date.now()+".csv")
  .text("logs_"+currentResult.pIndex+"_"+Date.now()+".csv");
}


// returns an array of coordinates for laying out objectCount objects as a grid with an equal number of lines and columns
function gridCoordinates(objectCount, cellSize) {
  var gridSide = Math.sqrt(objectCount);
  var coords = [];
  for (var i = 0; i < objectCount; i++) {
    coords.push({
      x:i%gridSide * cellSize,
      y:Math.floor(i/gridSide) * cellSize
    });
  }
  return coords;
}

// shuffle the elements in the array
// copied from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
function shuffle(array) {
  var j, x, i;
  for (i = array.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = array[i];
    array[i] = array[j];
    array[j] = x;
  }
  return array;
}

/*********************************************/

var createScene = function(){
  var svgEl = d3.select("#scene").append("svg");
  svgEl.attr("width", ctx.w);
  svgEl.attr("height", ctx.h)
  .classed("centered", true);

  loadData(svgEl);
};


/****************************************/
/******** STARTING PARAMETERS ***********/
/****************************************/

var setTrial = function(trialID) {
  ctx.startTrial = parseInt(trialID);
}

var setBlock = function(blockID) {
  ctx.startBlock = parseInt(blockID);

  var trial = "";
  var options = [];

  for(var i = 0; i < ctx.trials.length; i++) {
    if(ctx.trials[i][ctx.participantIndex] === ctx.participant) {
      if(parseInt(ctx.trials[i][ctx.blockIndex]) == ctx.startBlock) {
        if(!(ctx.trials[i][ctx.trialIndex] === trial)) {
          trial = ctx.trials[i][ctx.trialIndex];
          options.push(trial);
        }
      }
    }
  }

  var select = d3.select("#trialSel");

  select.selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(function (d) { return d; });

  setTrial(options[0]);

}

var setParticipant = function(participantID) {
  ctx.participant = participantID;

  var block = "";
  var options = [];

  for(var i = 0; i < ctx.trials.length; i++) {
    if(ctx.trials[i][ctx.participantIndex] === ctx.participant) {
      if(!(ctx.trials[i][ctx.blockIndex] === block)
          && (touchstone == 2 || ctx.trials[i][ctx.practiceIndex] === "false")) {
        block = ctx.trials[i][ctx.blockIndex];
        options.push(block);
      }
    }
  }

  var select = d3.select("#blockSel")
  select.selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(function (d) { return d; });

  setBlock(options[0]);

};

function onchangeParticipant() {
  selectValue = d3.select("#participantSel").property("value");
  setParticipant(selectValue);
};

function onchangeBlock() {
  selectValue = d3.select("#blockSel").property("value");
  setBlock(selectValue);
};

function onchangeTrial() {
  selectValue = d3.select("#trialSel").property("value");
  setTrial(selectValue);
};
