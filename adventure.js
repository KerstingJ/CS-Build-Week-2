const fs = require("fs");
const axios = require("axios");

const logger = require("./logger.js");
const doOnExit = require("./doOnExit.js");
const c = require("./config.js");
const exploreDeep = require("./explore.js");

// Read Data from our text files and bring into game state
// use map data from map.txt to store map data
let mapData = fs.readFileSync("./map.txt");
let islandMap = JSON.parse(mapData);
// locations of player, shop, and pirate ry
let locationData = fs.readFileSync("./locations.txt");
let locations = JSON.parse(locationData);
let { shop, pirateRy, currentRoom } = locations;

// // Set up an Exit handler so that the current state is saved on exit
doOnExit(() => {
  // save our current map
  // reuse the temp variable from above because the names are semantically appropriate
  console.log("Saving Data");
  mapData = { ...islandMap };
  mapData = JSON.stringify(mapData);
  fs.writeFileSync("./map.txt", mapData);
  // save our current locations
  locations = { shop, pirateRy, currentRoom };
  locations = JSON.stringify(locations);
  fs.writeFileSync("./locations.txt", locations);
  console.log("Done Saving");

  process.exit(0);
});

// Initialize the game
// TODO this could probably be in an other function
const initializeMap = () => {
  return new Promise((resolve, reject) => {
    axios
      .get(`${BASE_URL}/adv/init`, config)
      .then(res => {
        console.log("Initializing");
        let { config, BASE_URL } = c;
        logger.logObject(res.data);
        const { data } = res;
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
          currentRoom = room_id;
        }

        resolve();
      })
      .catch(reject);
  });
};

// currentGoal is a value that determines what the loop should be trying to accomplish
// exploring - doing a depth first search down
// findingItems - looking for unexplored rooms
// sellingItems - traveling to shop to sell items
// traveling - traveling to a specific room ID
// mining - trying to mine a coin

function main() {
  currentGoal = "exploring";

  // Main game loop
  let state = {};

  function mainLoop(currentGoal, state) {
    if (state.pirateRy) {
      pirateRy = state.pirateRy;
    }
    console.log("STATE", state);
    switch (currentGoal) {
      case "exploring":
        exploreDeep(islandMap, currentRoom, state.nextMove)
          .then(data => {
            state = {
              ...state,
              ...data
            };
            console.log(state);
            return state;
          })
          .then(state =>
            setTimeout(
              () => mainLoop(currentGoal, state),
              state.cooldown * 1000
            )
          )
          .catch(err => console.log("Error", err.message));
        break;
      case "traveling":
        console.log("Traveling");
        break;
      default:
        console.log("doing default case");
        break;
    }
  }

  mainLoop(currentGoal, state);
  // main loop
  // logic inside main loop
  // call setTimeout wit mainLoop
}

// initializePlayer();
// TODO: write some logic to determine the state of the
initializeMap().then(main);
