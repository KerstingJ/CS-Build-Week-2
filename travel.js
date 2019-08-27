const c = require("./config.js");
const logger = require("./logger");
let { config, BASE_URL } = c;

// This is used to help fill in our map as we explore
const opposites = {
  n: "s",
  s: "n",
  e: "w",
  w: "e"
};

function findPath(islandMap, currentRoom, compare) {
  /*
   *
   *    performs a breadth first search on islandMap starting in the currentRoom
   *    and returning the path when compare returns true or null if it cannot find result
   *
   *
   *    @param islandMap is an adjacency matrix in the form of
   *        {id: {'n': '?', 's': to_id}}
   *        where each id represents a room id that's value is an object
   *        with keys matching cardinal directions, and
   *        a value of '?' if that part of the map has not been seen
   *        otherwise the value is the id of the room immediately in that direction
   *
   *    @param currentRoom is the id of the room we are in when starting this action
   *
   *    @param compare is a callback function that takes a room_id as an argument
   *        and returns a boolean value
   *
   *    TODO: implement caching to get a better map
   */

  let visited = new Set();
  let q = [[currentRoom]];

  while (queue.length > 0) {
    path = q.shift();
    room = path[path.length - 1];

    if (!visited.has(room)) {
      visited.add(room);

      if (compare(room)) {
        return path;
      }

      doors = islandMap[room].keys();
      for (let d of doors) {
        q.push([...path, islandMap[room][d]]);
      }
    }
  }

  return null;
}

function travel(islandMap, currentRoom, path, start = 0) {
  /*
   *
   *   Recursive function that travels one step of a path each call
   *   removing the last piece of the path
   *
   *
   * */
  if (path.length === start) {
    return;
  }

  let directions = islandMap[currentRoom].keys();
  nextRoom = path[start];

  for (let d of directions) {
    if (islandMap[currentRoom][d] === nextRoom) {
      let data = { direction: d, next_room_id: nextRoom };
      axios
        .post(`${BASE_URL}/adv/move/`, data, config)
        .then(res => {
          let { data } = res;
          logger.logObject({ time: Date.now(), ...data });
          lastRoom = currentRoom;
          currentRoom = data.room_id;
          cooldown = data.cooldownl;

          return { path, currentRoom, cooldown };
        })
        .then(res => {
          // wait for timeout and do it again
          setTimeout(
            () => travel(islandMap, res.currentRoom, res.path, start + 1),
            res.cooldown * 1000
          );
        })
        .catch(console.log);
    }
  }
}
