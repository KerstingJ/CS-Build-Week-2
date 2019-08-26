const fs = require("fs");
const axios = require("axios");

// Most of this stuff up top is just configuration and handling data storage in text files
// axios config
config = {
  headers: {
    Authorization: "Token 85623dd9e0c087914458b5a31b0a1a06c8d7d1c2"
  }
};
BASE_URL = `https://lambda-treasure-hunt.herokuapp.com/api`;

// Read Data from our text files and bring into game state
// use map data from map.txt to store map data
const mapData = fs.readFileSync("./map.txt");
const islandMap = JSON.parse(mapData);

// locations of player, shop, and pirate ry
const locationData = fs.readFileSync("./locations.txt");
const locations = JSON.parse(locationData);
let { shop, pirateRy, currentRoom } = locations;

// Set up an Exit handler so that the current state is saved on exit
process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, exitCode) {
  // save our current map
  mapData = { ...islandMap };
  mapData = JSON.stringify(mapData);
  fs.writeFileSync("./map.txt", mapData);
  // save our current locations
  locations = { shop, pirateRy, currentRoom };
  locations = JSON.stringify(locations);
  fs.writeFileSync("./locations.txt", locations);
}

//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));
//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));
// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

// Initialize the game
const initializeMap = () => {
  axios
    .get(`${BASE_URL}/adv/init`, config)
    .then(res => {
      console.log(res.data);
      const {data} = res
      // Get our data from server
      let { room_id, exits } = data;

      // if the current room doesn't exist in our map add it
      if (islandMap[room_id] === undefined) {
        islandMap[room_id] = {};
        for (let d of exits) {
          islandMap[data.room_id][d] = "?";
        }
      }

      // set current room
      cooldown = data.cooldown;

      if (currentRoom !== room_id) {
        console.log("Something weird is going on");
      }
    })
    .catch(console.log);
};

// currentGoal is a value that determines what the loop should be trying to accomplish
// exploring - doing a depth first search down
// findingItems - looking for unexplored rooms
// sellingItems - traveling to shop to sell items
// traveling - traveling to a specific room ID
// mining - trying to mine a coin

initializeMap();
// initializePlayer();
// TODO: write some logic to determine the state of the
let currentGoal = "exploring";

// This is used to help fill in our map as we explore
const opposites = {
  n: "s",
  s: "n",
  e: "w",
  w: "e"
};
// nextMove is a cardinal direction
let nextMove = null;
// lastRoom is the id of the last room
let lastRoom = null;
let errors = null;
let cooldown = 0;

// variables from above for reference
// islandMap,     shop, pirateRy, currentRoom
// adjacencyList, int,  int,      int

function exploreDeep() {
  move = nextMove;

  // if we have a command to move
  if (move) {
    // configure our data for the request
    data = {
      direction: move
    };
    // if we're moving to a room we've been before lets get the bonus
    if (islandMap[currentRoom] && islandMap[currentRoom][move]) {
      if (islandMap[currentRoom][move] !== "?") {
        data.next_room_id = islandMap[currentRoom][move];
      }
    }

    // make our reequest
    axios
      .post(`${BASE_URL}/adv/move/`, data, config)
      .then(res => {
        const {data} = res
        console.log({ data });
        // Update our Room ID
        lastRoom = currentRoom;
        currentRoom = data.room_id;

        // update our map to show the rooms are connected
        islandMap[lastRoom][move] = currentRoom;

        // get directions for current room and add to map
        for (d in data.exits) {
          if (d !== opposites[move]) {
            // any direction that isnt the direction we came from is a '?'
            islandMap[currentRoom][d] = "?";
          } else if (d === move) {
            islandMap[currentRoom][d] = lastRoom;
          }
        }

        // set next move, will be a random move from exits
        let unopened = data.exits.filter(
          d => islandMap[currentRoom][d] === "?"
        );
        if()
        nextMove = unopened[Math.floor(Math.random() * unopened.length)];
      })
      .catch(console.log);
  }
  // send request to move to the next room
}

// Main game loop
// for (;;) {
//   let start = new Date.getTime();
//   let resolved = false;

//   switch (currentGoal) {
//     case "exploring":
//       console.log("exploring");
//       break;
//     default:
//       break;
//   }
//   // we need to make sure we cant continue to the next request until
//   // the last request has resolved and our cooldown is over
//   let end = new Date.getTime();
//   while (!resolved && end - start > cooldown * 1000) {
//     //wait
//     setTimeout(() => {
//       console.log("Waiting");
//     }, 1000);
//     end = new Date.getTime();
//   }
// }

console.log("Did this work")
