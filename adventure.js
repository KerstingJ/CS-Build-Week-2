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

// Set up an Exit handler so that the current state is saved on exit
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

let cooldown = 0;

// Initialize the game
const initializeMap = () => {
  axios
    .get(`${BASE_URL}/adv/init`, config)
    .then(res => {
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

// Main game loop
for (;;) {
  switch (currentGoal) {
    case "exploring":
      console.log("exploring");
      let data = await exploreDeep(islandMap);
      break;
    default:
      break;
  }
  // we need to make sure we cant continue to the next request until
  // the last request has resolved and our cooldown is over
  let start = new Date.getTime();
  let end = new Date.getTime();
  while (end - start > cooldown * 1000) {
    //wait
    let wait = cooldown * 1000;
    setTimeout(() => {
      console.log("Waiting for ${wait // 1000} seconds");
    }, wait);
    end = new Date.getTime();
  }
}

console.log("Did this work");
