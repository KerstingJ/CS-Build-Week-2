const c = require("./config.js");
const axios = require("axios");
const logger = require("./logger.js");
let { config, BASE_URL } = c;

// This is used to help fill in our map as we explore
const opposites = {
  n: "s",
  s: "n",
  e: "w",
  w: "e"
};

function exploreDeep(islandMap, { currentRoom, nextMove: move }) {
  console.log("\n\n\nExploring");
  /*
   * @param islandMap is an adjacency matrix in the form of
   * {id: {'n': '?', 's': to_id}}
   * where each id represents a room id that's value is an object
   * with keys matching cardinal directions, and
   * a value of '?' if that part of the map has not been seen
   * otherwise the value is the id of the room immediately in that direction
   *
   *
   * @Param is state object
   *  grabs nextMove as move, a 1 char rep of a cardinal direction
   *   ex. 'n', 's', 'e', 'w'
   *
   *  grabs currentRoom, the id of the room we are in when starting this action
   *
   *
   */

  // if we have a command to move
  return new Promise((resolve, reject) => {
    if (move) {
      console.log(`Moving ${move}`);
      // configure our data for the request
      data = {
        direction: move
      };

      // console.log(`${BASE_URL}/adv/move/`, data, config);
      axios
        .post(`${BASE_URL}/adv/move/`, data, config)
        .then(res => {
          logger.logObject(res.data);
          const { data } = res;
          // console.log({ data });
          // Update our Room ID
          // if we got a res we've moved
          // so update our data
          lastRoom = currentRoom;
          currentRoom = data.room_id;
          cooldown = data.cooldown;

          console.log("TESTING", { lastRoom, currentRoom, move });

          // initialize current room
          if (islandMap[currentRoom] === undefined) {
            islandMap[currentRoom] = {};
          }

          // set last room info
          islandMap[currentRoom][opposites[move]] = lastRoom;
          // update our map to show the rooms are connected
          islandMap[lastRoom][move] = currentRoom;

          for (d of data.exits) {
            if (d !== opposites[move]) {
              // any direction that isnt the direction we came from is a '?'
              islandMap[currentRoom][d] = "?";
            }
          }

          console.log("Check Map is correct: ", {
            [lastRoom]: islandMap[lastRoom],
            [currentRoom]: islandMap[currentRoom]
          });

          if (data.room_id === 250) {
            console.log("FOUND THE MINE");
            process.exit();
          }

          logger.saveMap(islandMap);
          // data.items.forEach(item => {
          //   if (item.includes("treasure")) {
          //     console.log("Found a treasure");
          //     process.exit();
          //   }
          // });

          // initialize the next move
          let nextMove = null;

          let unopened = data.exits.filter(
            d => islandMap[currentRoom][d] === "?"
          );
          if (unopened.length > 0 && currentRoom <= 250) {
            // if we have any unopened doors
            nextMove = unopened[0];
          } else {
            // return
            // TODO: here we need to do something to change
            console.log("Found a dead end, switching goal");
            resolve({ goal: "findDoor", currentRoom });
          }

          resolve({ cooldown, nextMove, currentRoom, errors: [null] });
        })
        .catch(err => {
          reject(err.response.data);
        });
    } else {
      // if we dont have a move queued
      console.log("No move queued");
      console.log({ islandMap, currentRoom });
      let unopened = Object.keys(islandMap[currentRoom]).filter(
        k => islandMap[currentRoom][k] === "?"
      );
      if (unopened.length > 0) {
        console.log("found unopened doors");
        nextMove = unopened[Math.floor(Math.random() * unopened.length)];
        resolve({ nextMove, cooldown: 1 });
      } else {
        // return
        // TODO: here we need to switch our goal and do a BFS to the nearest unopened door
        console.log("could not find unopened doors searching map");
        resolve({ goal: "findDoor", currentRoom });
        // process.exit();
      }
    }
  });
  // send request to move to the next room
}

module.exports = exploreDeep;
