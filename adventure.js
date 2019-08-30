const fs = require("fs");
const axios = require("axios");

const logger = require("./logger.js");
const doOnExit = require("./doOnExit.js");
const c = require("./config.js");

const exploreDeep = require("./explore.js");
const travel = require("./travel.js");

// Read Data from our text files and bring into game state
// use map data from map.txt to store map data
let tempMapData = fs.readFileSync("./_.map.txt");
let islandMap = JSON.parse(tempMapData);

tempMapData = fs.readFileSync("./complete_map.txt");
let fullMap = JSON.parse(tempMapData);

// // Set up an Exit handler so that the current state is saved on exit
// doOnExit(() => {
//   logger.saveMap(islandMap);
//   process.exit(0);
// });

// Initialize the game
// TODO this could probably be in an other function
const initializeMap = islandMap => {
  let { config, BASE_URL } = c;
  return new Promise((resolve, reject) => {
    axios
      .get(`${BASE_URL}/adv/init`, config)
      .then(res => {
        console.log("Initializing");
        logger.logObject(res.data);
        const { data } = res;
        // Get our data from server
        let { room_id, exits, cooldown } = data;

        // if the current room doesn't exist in our map add it
        if (islandMap[room_id] === undefined) {
          islandMap[room_id] = {};
          for (let d of exits) {
            islandMap[room_id][d] = "?";
          }
        }

        resolve({ currentRoom: room_id, cooldown });
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

function main(state) {
  // main loop
  // logic inside main loop
  // call setTimeout wit mainLoop
  // Helper function for explore2
  function findUnopenedDoor(room_id) {
    let unopened = Object.keys(islandMap[room_id]).filter(
      d => islandMap[room_id][d] === "?"
    );
    return unopened.length > 0;
  }

  function mainLoop(state) {
    console.log(state.goal);
    // if (state.pirateRy) {
    //   pirateRy = state.pirateRy;
    // }
    switch (state.goal) {
      case "explore":
        // explore a room
        setTimeout(() => {
          exploreDeep(islandMap, state)
            .then(data => {
              // upadate state that we are in next room
              // data returned is updateCurrentRoom, cooldown tim
              state = {
                ...state,
                ...data
              };
              return state;
            })
            .then(state =>
              // trigger another call to this function
              mainLoop({ ...state })
            )
            .catch(err => console.log("Error", err.message));
        }, state.cooldown * 1000);

        break;

      case "travel":
        // gonna travel to the shop
        console.log("Finding Path");
        let path = travel.findPath(
          fullMap,
          state.currentRoom,
          room => room === state.shop
        );

        if (path) {
          console.log("Traveling Path");
          travel
            .travel(fullMap, path, state.cooldown)
            .then(data => {
              state = {
                ...state,
                ...data
              };
              process.exit();
            })
            .catch(console.log);
        } else {
          console.log("Could Not find a valid path");
        }

        break;
      case "findDoor":
        // gonna travel to the shop
        console.log("Finding an unexplored Room");
        let p = travel.findPath(islandMap, state.currentRoom, findUnopenedDoor);

        if (p) {
          console.log("Traveling Path");
          setTimeout(() => {
            travel
              .travel(islandMap, p, state.cooldown, true)
              .then(data => {
                state = {
                  ...state,
                  ...data
                };
                mainLoop(state);
              })
              .catch(res => {
                if (res.cooldown) {
                  state = {
                    ...state,
                    ...res
                  };
                  mainLoop(state);
                }
              });
          }, state.cooldown * 1000);
        } else {
          console.log("Could Not find a valid path");
        }
        break;

      default:
        console.log("doing default case");
        break;
    }
  }

  mainLoop(state);
}

// initializePlayer();
// TODO: write some logic to determine the state of the

if (process.argv.length > 2) {
  let goal = process.argv[2];

  if (goal === "map") {
    console.log(islandMap);
  }

  shop = goal === "travel" ? process.argv[3] - 0 : 250;

  initializeMap(islandMap)
    .then(initData => {
      console.log(initData);
      setTimeout(() => {
        main({ ...initData, goal, shop });
      }, initData.cooldown * 1000);
    })
    .catch(err => {
      console.log("something went wrong");
      console.error(err.message);
      console.error(err);
      process.exit(1);
    });
} else {
  console.log("Must include a goal");
}
