const c = require("./config.js");
const axios = require("axios");
const logger = require("./logger.js");
let { config, BASE_URL, treasure } = c;

// This is used to help fill in our map as we explore
const opposites = {
  n: "s",
  s: "n",
  e: "w",
  w: "e"
};

function exploreDeep(islandMap, { currentRoom, nextMove: move, cooldown }) {
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
      // configure our data for the request
      data = {
        direction: move
      };

      // console.log(`${BASE_URL}/adv/move/`, data, config);
      axios
        .post(`${BASE_URL}/adv/fly/`, data, config)
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

          // console.log("TESTING", { lastRoom, currentRoom, move });
          console.log(`Moved ${move} from room ${lastRoom} to ${currentRoom}`);

          // initialize current room
          if (islandMap[currentRoom] === undefined) {
            islandMap[currentRoom] = {};
          }

          // update our map to show the rooms are connected
          islandMap[currentRoom][opposites[move]] = lastRoom;
          islandMap[lastRoom][move] = currentRoom;

          for (d of data.exits) {
            if (
              d !== opposites[move] &&
              islandMap[currentRoom][d] === undefined
            ) {
              // any direction that isnt the direction we came from is a '?'
              islandMap[currentRoom][d] = "?";
            }
          }

          console.log("In this room I see: ", {
            [currentRoom]: islandMap[currentRoom]
          });

          logger.saveMap(islandMap);

          // initialize the next move
          let nextMove = null;

          // get unopened doors
          let unopened = data.exits.filter(
            d => islandMap[currentRoom][d] === "?"
          );

          // if we have any unopened doors
          if (unopened.length > 0) {
            // Go s then e, then whatever
            if (unopened.includes("s")) {
              nextMove = "s";
            } else if (unopened.includes("e")) {
              nextMove = "e";
            } else {
              nextMove = unopened[0];
            }

            // if we have no closed doors
          } else {
            console.log("Found a dead end, switching goal");
            // update our goal to do bfs of map and traverse to next room
            resolve({ goal: "findDoor", currentRoom });
          }

          // These are helper functions to pick up items while traveling
          const has_items = () => {
            let eggs = data.items.filter(item => item.includes(treasure));
            if (eggs.length > 0) {
              return eggs[0];
            }
            return false;
          };

          const pick_up_Item = name => {
            return new Promise((resolve, reject) => {
              let req_data = { name: name };
              axios
                .post(`${BASE_URL}/adv/take/`, req_data, config)
                .then(res => {
                  console.log(`\n\nFound a ${name} and picked it up\n\n`);
                  cooldown = res.data.cooldown;
                  resolve({ cooldown, nextMove, currentRoom, errors: [null] });
                })
                .catch(err => {
                  console.log(`couldnt pick up a ${name}`);
                  console.log(err);
                  reject(err);
                });
            });
          };

          if (has_items()) {
            console.log(`waiting ${cooldown} seconds before moving`);
            setTimeout(() => {
              pick_up_Item(has_items())
                .then(res => resolve(res))
                .catch(err => reject(err));
            }, cooldown * 1000);
          } else {
            resolve({ cooldown, nextMove, currentRoom, errors: [null] });
          }
        })
        .catch(err => {
          console.log(err);
          reject(err.response.data);
        });
    } else {
      // if we dont have a move queued
      console.log("No move queued");
      // console.log({ islandMap, currentRoom });
      let unopened = Object.keys(islandMap[currentRoom]).filter(
        k => islandMap[currentRoom][k] === "?"
      );
      if (unopened.length > 0) {
        console.log("found unopened doors");
        nextMove = unopened[Math.floor(Math.random() * unopened.length)];
        resolve({ nextMove, cooldown: 1 });
      } else {
        console.log("could not find unopened doors searching map");
        resolve({ goal: "findDoor", currentRoom, cooldown });
        // process.exit();
      }
    }
  });
  // send request to move to the next room
}

module.exports = exploreDeep;
