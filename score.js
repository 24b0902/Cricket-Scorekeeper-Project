let lastBallNoBall = false; 

function create_batsman(name) {
  return {  runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
}

function create_bowler(name) {
  return {  balls: 0, runs: 0, wickets: 0, maidens: 0 };
}

function load_match_data() {
  match = JSON.parse(localStorage.getItem("matchDetails")) || {};
  
  if (!match.team1 || !match.team2) {
    alert("Match setup not found!");
    return;
  }
  update_display();
}

function update_display() {
  //validating innings data
  const currentInningsData = match.innings[match.currentInnings - 1];
  if (!currentInningsData) {
    console.warn("No current innings data available.");
    return;
  }

  //intializing required variables
  const batters = currentInningsData.batters || [];
  const bowlers = currentInningsData.bowlers || [];
  const strikerIndex = currentInningsData.strikerIndex ?? 0;
  const nonStrikerIndex = currentInningsData.nonStrikerIndex ?? 1;
  const currentBowlerIndex = currentInningsData.currentBowlerIndex ?? 0;
  const strikerName = batters[strikerIndex] ;
  const nonStrikerName = batters[nonStrikerIndex] ;
  const strikerStats = currentInningsData.battersStats?.[strikerName] || { runs: 0, balls: 0 };
  const nonStrikerStats = currentInningsData.battersStats?.[nonStrikerName] || { runs: 0, balls: 0 };
  const ballsBowled = currentInningsData.ballsBowled || 0;
  const overs = `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;
  const totalRuns = currentInningsData.totalRuns ?? 0;
  const totalWickets = currentInningsData.totalWickets ?? 0;
  const opponent = match.battingFirst == match.team1 ? match.team2 : match.team1;

  //updating display based on innings number
  if (match.currentInnings == 2) {
    const crr = calculate_CRR(); 
    const rrr = calculate_RRR();
    document.getElementById("crr").innerText = `Current run rate: ${crr} , Required run rate: ${rrr}`;
  }

  if (match.currentInnings == 2 && match.target) {
    document.getElementById("targetDisplay").textContent = `Target: ${match.target}`;
  }
  
  if(match.currentInnings == 1){
  document.getElementById("overallScore").innerText =
    `${match.battingFirst} ${totalRuns}/${totalWickets} (${overs}) vs ${opponent}`;
  }else if(match.currentInnings == 2){
    match.innings[0].totalWickets=match.innings[0].totalWickets?? 0;
    document.getElementById("overallScore").innerText =
    `${match.battingFirst} ${totalRuns}/${totalWickets} (${overs}) vs ${opponent} ${match.innings[0].totalRuns}/${match.innings[0].totalWickets} (${Math.floor(match.innings[0].ballsBowled / 6)}.${match.innings[0].ballsBowled % 6})`;
  }

  document.getElementById("inningsStatus").innerText = `Innings ${match.currentInnings || 1} of 2`;

  document.getElementById("battersOnField").innerHTML = `
    <h3>Batters on Field:</h3>
    <p><b>${strikerName}</b> (Strike) - ${strikerStats.runs} runs, ${strikerStats.balls} balls</p>
    <p>${nonStrikerName} - ${nonStrikerStats.runs} runs, ${nonStrikerStats.balls} balls</p>
  `;

  const bowlerName = bowlers[currentBowlerIndex] || "Waiting...";
  const bowlerStats = currentInningsData.bowlersStats?.[bowlerName] || {
    balls: 0,
    runs: 0,
    wickets: 0,
    maidens: 0,
  };
  const oversBowled = `${Math.floor(bowlerStats.balls / 6)}.${bowlerStats.balls % 6}`;
  const econ = bowlerStats.balls ? (bowlerStats.runs / (bowlerStats.balls / 6)).toFixed(2) : "0.00";

  document.getElementById("currentBowlerStats").innerHTML = `
    <h3>Current Bowler: ${bowlerName}</h3>
    <p>Overs: ${oversBowled} | Runs: ${bowlerStats.runs} | Wickets: ${bowlerStats.wickets} | Maidens: ${bowlerStats.maidens} | Economy: ${econ}</p>
  `;
}


function score_runs(runs) {
  //validating innings data
  const currentInningsData = match.innings[match.currentInnings - 1];
  if (!currentInningsData) {
    console.warn("No current innings data available.");
    return;
  }

  //initializing required variables
  const batters = currentInningsData.batters || [];
  const bowlers = currentInningsData.bowlers || [];
  const strikerIndex = currentInningsData.strikerIndex ?? 0;
  const nonStrikerIndex = currentInningsData.nonStrikerIndex ?? 1;
  const currentBowlerIndex = currentInningsData.currentBowlerIndex ?? 0;
  const currentBowlerName = bowlers[currentBowlerIndex] || { name: "Waiting..." };
  const strikerName = batters[strikerIndex] || "Waiting...";
  let ballsBowled = currentInningsData.ballsBowled ?? 0;  

  //updating display and match object variables
  currentInningsData.battersStats[strikerName].runs += runs;
  currentInningsData.battersStats[strikerName].balls++;
  currentInningsData.totalRuns = (currentInningsData.totalRuns || 0) + runs;

  if (typeof match.innings[match.currentInnings-1].ballsBowled !== "number") {
    match.innings[match.currentInnings-1].ballsBowled = 0;
  }

  match.innings[match.currentInnings-1].ballsBowled++;
  currentInningsData.bowlersStats[currentBowlerName].balls++;
  currentInningsData.bowlersStats[currentBowlerName].runs += runs;

  if (currentInningsData.bowlersStats[currentBowlerName].balls % 6 == 0 && currentInningsData.bowlersStats[currentBowlerName].runs == 0) {
    currentInningsData.bowlersStats[currentBowlerName].maidens++;
  }

  if (runs % 2 == 1) {
    currentInningsData.strikerIndex = nonStrikerIndex;
    currentInningsData.nonStrikerIndex = strikerIndex;
  }

  
  if (currentInningsData.ballsBowled % 6 == 0 && currentInningsData.ballsBowled < 12) {
    currentInningsData.strikerIndex = nonStrikerIndex;
    currentInningsData.nonStrikerIndex = strikerIndex;
    add_commentary("Over completed. " + currentBowlerName + " finishes the over with " + currentInningsData.bowlersStats[currentBowlerName].runs + " runs given and " + currentInningsData.bowlersStats[currentBowlerName].wickets+ " wickets taken.");
    change_bowler();
  }

  ballsBowled+=1;
  const overs = `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;  
  
  if (runs == 4){
    currentInningsData.battersStats[strikerName].fours++;
    add_commentary("( "+overs+" ) " + currentBowlerName + " to "+ strikerName+ " : FOUR! Nice shot by " + strikerName);
  }
  else if (runs == 6){
    currentInningsData.battersStats[strikerName].sixes++;
    add_commentary("( "+overs+" ) " + currentBowlerName + " to "+ strikerName+ " : SIX!! Brilliant shot by " + strikerName);
  }else{
   add_commentary("( "+overs+" ) " + currentBowlerName + " to "+ strikerName+ " : " + runs + " runs.");
  }

  save_match();
  console.log("Balls bowled:", match.innings[match.currentInnings-1].ballsBowled);
  update_display();

  //checking if innings or match is over
  if (innings_over()) {
    next_innings();
  }

  if (match.currentInnings == 2 && currentInningsData.totalRuns >= match.target) {
    alert("Target reached!");
    next_innings();
  }
}

function wicket() {
  //validating innings data
  const currentInningsData = match.innings[match.currentInnings - 1];
  if (!currentInningsData) {
    console.warn("No current innings data available.");
    return;
  }

  //initializing required variables
  const batters = currentInningsData.batters || [];
  const bowlers = currentInningsData.bowlers || [];
  const strikerIndex = currentInningsData.strikerIndex ?? 0;
  const nonStrikerIndex = currentInningsData.nonStrikerIndex ?? 1;
  const currentBowlerIndex = currentInningsData.currentBowlerIndex ?? 0;
  const currentBowlerName = bowlers[currentBowlerIndex] ;
  const strikerName = batters[strikerIndex] ;
  const ballsBowled = currentInningsData.ballsBowled ?? 0;   
  const totalWickets = currentInningsData.totalWickets ?? 0;

  //updating match object and display as required
  currentInningsData.battersStats[strikerName].out = true;
  currentInningsData.totalWickets = totalWickets + 1;
  currentInningsData.bowlersStats[currentBowlerName].balls++;
  currentInningsData.bowlersStats[currentBowlerName].wickets++;

  if (lastBallNoBall) {
    const overs = `${Math.floor((ballsBowled +1) / 6)}.${(ballsBowled+1) % 6}`; 
    add_commentary("( "+overs+" ) " + currentBowlerName + " to "+ strikerName+ " : Wicket falls... but it was a No Ball! Batter survives.");
    lastBallNoBall = false; 
    currentInningsData.ballsBowled = ballsBowled + 1;
    if ((ballsBowled + 1) % 6 == 0) {
      [currentInningsData.strikerIndex, currentInningsData.nonStrikerIndex] = [nonStrikerIndex, strikerIndex];
      change_bowler();
    } else {
      currentInningsData.strikerIndex = nonStrikerIndex;
      currentInningsData.nonStrikerIndex = strikerIndex;
    }
    save_match();
    update_display();
    return; 
  }

  const overs = `${Math.floor((ballsBowled +1) / 6)}.${(ballsBowled+1) % 6}`; 
  currentInningsData.ballsBowled = ballsBowled + 1;
  add_commentary("( "+overs+" ) " + currentBowlerName + " to "+ strikerName+ " : WICKET! "+ strikerName + " has been dismissed by "+ currentBowlerName )

  let newBatsmanName;
  do {
    newBatsmanName = prompt("Enter name of next batsman:");
  } while (!newBatsmanName || batters.includes(newBatsmanName));
  add_commentary(newBatsmanName + " comes onto the field.")
  batters[strikerIndex] = newBatsmanName; 
  currentInningsData.battersStats[newBatsmanName] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };

  if ((ballsBowled + 1) % 6 == 0) {
    [currentInningsData.strikerIndex, currentInningsData.nonStrikerIndex] = [nonStrikerIndex, strikerIndex];
    change_bowler();
  } else {
    currentInningsData.strikerIndex = nonStrikerIndex;
    currentInningsData.nonStrikerIndex = strikerIndex;
  }

  save_match();
  update_display();

  //checking if innings is over
  if (innings_over()) {
    next_innings();
  }
}

function change_bowler() {
  //intialising required variables
  const currentInningsData = match.innings[match.currentInnings - 1];
  const bowlers = currentInningsData.bowlers || [];  
  const bowlersStats = currentInningsData.bowlersStats || {};  
  let newBowlerName = "";

  //initialising new bowler
  while (!newBowlerName || bowlers.includes(newBowlerName)) {
    newBowlerName = prompt("Enter the name of the new bowler:");
    if (newBowlerName == null) {
      return;
    }
  }

  if (!bowlers.includes(newBowlerName)) {
    bowlers.push(newBowlerName);
  }

  if (!bowlersStats[newBowlerName]) {
    bowlersStats[newBowlerName] = { balls: 0, runs: 0, wickets: 0, maidens: 0 };
  }

  currentInningsData.currentBowlerIndex = bowlers.indexOf(newBowlerName);

  save_match();
  update_display();
}

function innings_over() {
  max_balls=(match.oversPerInnings)*6;
  return match.innings[match.currentInnings-1].ballsBowled >= max_balls || match.innings[match.currentInnings-1].totalWickets >= 10;
}

function calculate_CRR() {
  let overs = match.innings[match.currentInnings-1].ballsBowled / 6;
  return (match.innings[match.currentInnings-1].totalRuns / overs).toFixed(2);
}

function calculate_RRR() {
  let target = match.target;  
  let runsRemaining = target - match.innings[match.currentInnings-1].totalRuns;
  
  let totalBallsSecondInnings = match.oversPerInnings * 6;
  let ballsRemaining = totalBallsSecondInnings - match.innings[match.currentInnings-1].ballsBowled;

  if (ballsRemaining > 0) {
    let oversRemaining = ballsRemaining / 6;
    return (runsRemaining / oversRemaining).toFixed(2);
  } else {
    return 0;  
  }
}


function save_match() {
  localStorage.setItem("matchDetails", JSON.stringify(match));
}

function next_innings() {
  if (match.currentInnings == 1) {
    alert("Innings 1 over! Switching sides...");
    match.innings = match.innings || [];
    match.innings[0] = {
      battingTeam: match.battingFirst,
      batters: match.innings[0].batters,
      bowlers: match.innings[0].bowlers,
      battersStats: match.innings[0].battersStats,
      bowlersStats: match.innings[0].bowlersStats,
      totalRuns: match.innings[0].totalRuns,
      totalWickets: match.innings[0].totalWickets,
      ballsBowled: match.innings[0].ballsBowled,
    };
    
    match.innings[1] = {
      batters: [],
      bowlers: [],
      strikerIndex: 0,
      nonStrikerIndex: 1,
      currentBowlerIndex: 0,
      battersStats:{},
      bowlersStats:{}
    };

    match.target = match.innings[0].totalRuns + 1;

    match.battingFirst = match.battingFirst == match.team1 ? match.team2 : match.team1;
    match.bowlingFirst = match.bowlingFirst == match.team1 ? match.team2 : match.team1;
    match.currentInnings = 2;

    localStorage.setItem("matchDetails", JSON.stringify(match));
    collect_names();

    location.reload();  
  } else {
    alert("Match Over!");
    end_match();
  }
}

function end_match() {
  localStorage.setItem("matchDetails", JSON.stringify(match));
  window.location.href = "summary.html";
}

function collect_names() {
  //loading data from local storage
  const savedMatch = localStorage.getItem("matchDetails");
  localStorage.removeItem('commentary');
  match = JSON.parse(savedMatch);

  let inningsNum = match.currentInnings || 1;

  if (!match.innings) match.innings = [];
  if (!match.innings[inningsNum - 1]) match.innings[inningsNum - 1] = {};

  if (!match.innings[inningsNum - 1].batters || match.innings[inningsNum - 1].batters.length == 0) {
    let batsman1 = "";
    let batsman2 = "";
    let bowler = "";

    //prompting for names
    while (!batsman1 || batsman1.trim() == "") {
      batsman1 = prompt(`Enter the name of the first batsman for Innings ${inningsNum}`);
    }
    while (!batsman2 || batsman2.trim() == "" || batsman1 == batsman2) {
      batsman2 = prompt(`Enter the name of the second batsman for Innings ${inningsNum}`);
    }
    while (!bowler || bowler.trim() == "") {
      bowler = prompt(`Enter the name of the first bowler for Innings ${inningsNum}`);
    }

    //updating match object
    match.innings[inningsNum - 1].batters = [batsman1, batsman2];
    match.innings[inningsNum - 1].bowlers = [bowler];
    match.innings[inningsNum - 1].strikerIndex = 0;
    match.innings[inningsNum - 1].nonStrikerIndex = 1;
    match.innings[inningsNum - 1].currentBowlerIndex = 0;
    striker = batsman1;
    nonStriker = batsman2;
    currentBowler = bowler;

    batters = {
      [batsman1]: create_batsman(batsman1),
      [batsman2]: create_batsman(batsman2),
    };
    bowlers = {
      [bowler]: create_bowler(bowler)
    };
    match.innings[inningsNum - 1].battersStats = batters;
    match.innings[inningsNum - 1].bowlersStats = bowlers;
    localStorage.setItem("matchDetails", JSON.stringify(match));
  }
}

function initialize_match(){
  const savedMatch = localStorage.getItem("matchDetails");
  console.log("Saved match details from localStorage:", savedMatch);
  if (!savedMatch) {
    console.error("No match details found in localStorage");
    return;
  }

  const match = JSON.parse(savedMatch);

  if (
    !match.innings[1] ||
    !match.innings[1].batters ||
    !Array.isArray(match.innings[1].batters)
  ) {
    match.innings[1] = {
      batters: [],
      bowlers: [],
      strikerIndex: 0,
      nonStrikerIndex: 1,
      currentBowlerIndex: 0,
      battersStats: {},
      bowlersStats: {},
      totalRuns: 0,
      totalWickets: 0,
      ballsBowled: 0,
    };
  }

  if (!match.innings || !Array.isArray(match.innings) || match.innings.length < 1) {
    console.error("Invalid innings data in match object.");
    return;
  }

  let currentInnings = match.currentInnings !== undefined ? match.currentInnings : 0;
  let innings = match.innings[currentInnings];

  if (!innings.batters || !Array.isArray(innings.batters)) {
    console.error("Invalid batters data in current innings.");
    return;
  }
  if (!innings.bowlers || !Array.isArray(innings.bowlers)) {
    console.error("Invalid bowlers data in current innings.");
    return;
  }

  let strikerIndex = innings.strikerIndex ?? 0;
  let nonStrikerIndex = innings.nonStrikerIndex ?? 1;
  let currentBowlerIndex = innings.currentBowlerIndex ?? 0;

  if (innings.batters.length < 2) {
    console.warn("Not enough batters to initialize match view. Waiting for user input.");
    return;
  }
  if (innings.bowlers.length < 1) {
    console.warn("Not enough bowlers to initialize match view. Waiting for user input.");
    return;
  }

  match.strikerIndex = strikerIndex;
  match.nonStrikerIndex = nonStrikerIndex;
  match.currentBowlerIndex = currentBowlerIndex;

  console.log("Match Data Before Saving:", match);

  localStorage.setItem("matchDetails", JSON.stringify(match));

  update_display();
}

function add_commentary(message) {
  const commentaryBox = document.getElementById('commentary');
  const newComment = document.createElement('div');
  newComment.textContent = message;
  commentaryBox.prepend(newComment);
  let commentaryList = JSON.parse(localStorage.getItem('commentary')) || [];
  commentaryList.unshift(message); 

  // Keep only the latest 10 comments
  if (commentaryList.length > 10) {
    commentaryList = commentaryList.slice(0, 10); 
  }
  //save commentary
  localStorage.setItem('commentary', JSON.stringify(commentaryList));
  //remove old comments 
  if (commentaryBox.children.length > 10) {
    commentaryBox.removeChild(commentaryBox.lastChild);
  }
}

function load_commentary() {
  const commentaryBox = document.getElementById('commentary');
  const savedCommentary = JSON.parse(localStorage.getItem('commentary')) || [];
  commentaryBox.innerHTML = ''; 
  savedCommentary.forEach(comment => {
    const commentDiv = document.createElement('div');
    commentDiv.textContent = comment;
    commentaryBox.appendChild(commentDiv);
  });
  //reverse comment order to show the newest one first
  let comments = Array.from(commentaryBox.children);
  comments.reverse().forEach(comment => commentaryBox.appendChild(comment));
}

window.addEventListener('DOMContentLoaded', load_commentary);

function wide_ball() {
  //initialising variables
  const innings = match.innings[match.currentInnings - 1];
  const bowlerIndex = innings.currentBowlerIndex;
  const bowler = innings.bowlers[bowlerIndex];
  const ballsBowled = innings.ballsBowled ?? 0;  
  const overs = `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;  
  innings.totalRuns = innings.totalRuns || 0;
  innings.bowlersStats[bowler] = innings.bowlersStats[bowler] || { runsConceded: 0 };
  let runs;

  //logic
  do {
    runs = parseInt(prompt("Enter number of runs scored on the wide-ball (excluding the extra given due to wide):"), 10);
    if (isNaN(runs) || runs < 0) {
      alert("Invalid input. Please enter a non-negative number.");
    }
  } while (isNaN(runs) || runs < 0);
  innings.totalRuns += runs+1;
  innings.bowlersStats[bowler].runsConceded += runs+1;

  add_commentary("( "+overs+" ) " + bowler + " to "+ innings.batters[innings.strikerIndex] + " : "+ runs + " runs :Wide ball! Extra run added.");
  save_match();
  update_display();

  //checking if innings/match ended
  if (innings_over()) {
    next_innings();
  }

  if (match.currentInnings == 2 && innings.totalRuns >= match.target) {
    alert("Target reached!");
    next_innings();
  }
}


function no_ball() {
  //initialising variables
  const innings = match.innings[match.currentInnings-1];
  const bowler = innings.bowlers[innings.currentBowlerIndex];
  const ballsBowled = innings.ballsBowled ?? 0;  
  const overs = `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;
  innings.totalRuns = innings.totalRuns ?? 0;  
  let runs;

  //logic
  do {
    runs = parseInt(prompt("Enter number of runs scored on the no-ball: (excluding extra run given due to no ball"), 10);
    if (isNaN(runs) || runs < 0) {
      alert("Invalid input. Please enter a non-negative number.");
    }
  } while (isNaN(runs) || runs < 0);
  innings.totalRuns += runs+1;
  innings.bowlersStats[bowler].runsConceded += runs+1;
  innings.battersStats[innings.batters[innings.strikerIndex]].runs+=runs;
  lastBallNoBall=true;
  add_commentary("( "+overs+" ) " + bowler + " to "+ innings.batters[innings.strikerIndex] + " : "+ runs +" runs : No ball! Extra run to the team and Free hit coming up!");
  
  save_match();
  update_display();

  //checking if innings/match ended
  if (innings_over()) {
    next_innings();
  }

  if (match.currentInnings == 2 && innings.totalRuns >= match.target) {
    alert("Target reached!");
    next_innings();
  }
}

function run_out() {
  //validating innings data
  const currentInningsData = match.innings[match.currentInnings - 1];
  if (!currentInningsData) {
    console.warn("No current innings data available.");
    return;
  }

  //initialising variables
  const batters = currentInningsData.batters || [];
  const bowlers = currentInningsData.bowlers || [];
  const strikerIndex = currentInningsData.strikerIndex ?? 0;
  const nonStrikerIndex = currentInningsData.nonStrikerIndex ?? 1;
  const strikerName = batters[strikerIndex] || "Waiting...";
  const ballsBowled = currentInningsData.ballsBowled ?? 0;  
  const totalRuns = currentInningsData.totalRuns ?? 0;
  const totalWickets = currentInningsData.totalWickets ?? 0;
  const currentBowlerName = bowlers[currentInningsData.currentBowlerIndex];
  let whoOut;

  //logic
  do {
    whoOut = prompt("Who got run out? Enter 'striker' or 'non-striker':").toLowerCase();
  } while (whoOut !== "striker" && whoOut !== "non-striker");

  let outBatsmanIndex = (whoOut == "striker") ? strikerIndex : nonStrikerIndex;
  let outBatsmanName = batters[outBatsmanIndex];
  let runsBeforeOut;
  do {
    runsBeforeOut = parseInt(prompt(`How many runs did ${strikerName} score before the run-out?`), 10);
  } while (isNaN(runsBeforeOut) || runsBeforeOut < 0);
  currentInningsData.battersStats[strikerName].runs += runsBeforeOut;
  currentInningsData.totalRuns = totalRuns + runsBeforeOut;
  currentInningsData.battersStats[outBatsmanName].out = true;
  currentInningsData.totalWickets = totalWickets + 1;
  match.innings[match.currentInnings - 1].bowlersStats[currentBowlerName].balls++;
  const overs = `${Math.floor((ballsBowled+1) / 6)}.${(ballsBowled+1) % 6}`;  
  add_commentary(`( ${overs} ) ${currentBowlerName} to ${strikerName} : RUN OUT! ${outBatsmanName} has been run out after ${runsBeforeOut} runs!`);
  let newBatsmanName;
  do {
    newBatsmanName = prompt("Enter name of next batsman:");
  } while (!newBatsmanName || batters.includes(newBatsmanName));

  add_commentary(`${newBatsmanName} comes onto the field.`);
  currentInningsData.ballsBowled = ballsBowled + 1;
  batters[outBatsmanIndex] = newBatsmanName;
  currentInningsData.battersStats[newBatsmanName] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
  if (runsBeforeOut % 2 == 1) {
    [currentInningsData.strikerIndex, currentInningsData.nonStrikerIndex] = [nonStrikerIndex, strikerIndex];
  }
  if ((ballsBowled + 1) % 6 == 0) {
    change_bowler(); 
  }

  save_match();
  update_display();

  //checking if innings/match completed
  if (innings_over()) {
    next_innings();
  }

  if (match.currentInnings == 2 && currentInningsData.totalRuns >= match.target) {
    alert("Target reached!");
    next_innings();
  }
}

function Byes() {
  let runs;

  do {
    runs = parseInt(prompt("Enter number of byes taken:"), 10);
    if (isNaN(runs) || runs < 0) {
      alert("Invalid input. Please enter a non-negative number.");
    }
  } while (isNaN(runs) || runs < 0);

  const currentInningsData = match.innings[match.currentInnings - 1];
  if (!currentInningsData) return;
  const currentBowlerName = currentInningsData.bowlers[currentInningsData.currentBowlerIndex];

  currentInningsData.totalRuns += runs;
  currentInningsData.extras = (currentInningsData.extras || 0) + runs;
  currentInningsData.byes = (currentInningsData.byes || 0) + runs;
  match.innings[match.currentInnings - 1].bowlersStats[currentBowlerName].balls++;
  currentInningsData.ballsBowled = (currentInningsData.ballsBowled ?? 0) + 1;

  const overs = `${Math.floor(currentInningsData.ballsBowled / 6)}.${currentInningsData.ballsBowled % 6}`;

  add_commentary(`( ${overs} ) ${currentBowlerName} to batter: ${runs} bye(s) taken.`);

   //checking if over/innings/match completed
  if ((currentInningsData.ballsBowled) % 6 == 0) {
    change_bowler(); 
  }
  if (innings_over()) {
    next_innings();
  }

  if (match.currentInnings == 2 && currentInningsData.totalRuns >= match.target) {
    alert("Target reached!");
    next_innings();
  }
  save_match();
  update_display();
}

function LegByes() {
  let runs;
  do {
    runs = parseInt(prompt("Enter number of Leg-byes taken:"), 10);
    if (isNaN(runs) || runs < 0) {
      alert("Invalid input. Please enter a non-negative number.");
    }
  } while (isNaN(runs) || runs < 0);

  const currentInningsData = match.innings[match.currentInnings - 1];
  if (!currentInningsData) return;
  const currentBowlerName = currentInningsData.bowlers[currentInningsData.currentBowlerIndex];

  currentInningsData.totalRuns += runs;
  currentInningsData.extras = (currentInningsData.extras || 0) + runs;
  currentInningsData.legByes = (currentInningsData.legByes || 0) + runs;
  currentInningsData.ballsBowled = (currentInningsData.ballsBowled ?? 0) + 1;
  match.innings[match.currentInnings - 1].bowlersStats[currentBowlerName].balls++;

  const overs = `${Math.floor(currentInningsData.ballsBowled / 6)}.${currentInningsData.ballsBowled % 6}`;

  add_commentary(`( ${overs} ) ${currentBowlerName} to batter: ${runs} leg bye(s) taken.`);

  //checking if over/innings/match completed
  if ((currentInningsData.ballsBowled) % 6 == 0) {
    change_bowler(); 

  if (innings_over()) {
    next_innings();
  }

  if (match.currentInnings == 2 && currentInningsData.totalRuns >= match.target) {
    alert("Target reached!");
    next_innings();
  }
  save_match();
  update_display();
}
}
