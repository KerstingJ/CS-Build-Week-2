const c = require("./config.js");
let { config, BASE_URL } = c;

// This is used to help fill in our map as we explore
const opposites = {
  n: "s",
  s: "n",
  e: "w",
  w: "e"
};

function exploreDeep(islandMap, move = null, currentRoom = null) {
  /*
   * @param islandMap is an adjacency matrix in the form of
   * {id: {'n': '?', 's': to_id}}
   * where each id represents a room id that's value is an object
   * with keys matching cardinal directions, and
   * a value of '?' if that part of the map has not been seen
   * otherwise the value is the id of the room immediately in that direction
   *
   * @param move is a 1 char rep of a cardinal direction
   *   ex. 'n', 's', 'e', 'w'
   *
   * @param currentRoom is the id of the room we are in when starting this action
   *
   *
   */

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
        logger.logObject(res.data);
        const { data } = res;
        console.log({ data });
        // Update our Room ID
        // if we got a res we've moved
        // so update our data
        lastRoom = currentRoom;
        currentRoom = data.room_id;
        cooldown = data.cooldown;

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

        // initialize the next move
        let nextMove = null;

        if (unopened.length > 0) {
          // if we have any unopened doors
          nextMove = unopened[Math.floor(Math.random() * unopened.length)];
        } else {
          // return
          // TODO: here we need to do something to change
          console.log("Found a dead end, Exiting");
          process.exit();
        }
        return { cooldown, nextMove, currentRoom };
      })
      .catch(console.log);
  } else {
    // if we dont have a move queued
    let unopened = islandMap[currentRoom]
      .keys()
      .filter(k => islandMap[currentRoom][k] === "?");
    if (unopened.length > 0) {
      nextMove = unopened[Math.floor(Math.random() * unopened.length)];
    } else {
      // return
      // TODO: here we need to switch our goal and do a BFS to the nearest unopened door
      console.log("Found a dead end, Exiting");
      process.exit();
    }
  }
  // send request to move to the next room
}

module.exports = exploreDeep;
