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
  // console.log(islandMap, currentRoom);

  while (q.length > 0) {
    path = q.shift();
    room = path[path.length - 1];

    if (!visited.has(room)) {
      visited.add(room);

      if (compare(room)) {
        return path;
      }

      Object.keys(islandMap[room]).forEach(d => {
        if (islandMap[room][d] !== "?") {
          q.push([...path, islandMap[room][d]]);
        }
      });
    }
  }

  return null;
}

function travel(islandMap, path, cooldown, exploring = false, start = 0) {
  // console.log("traveling down", path.slice(start, path.length));
  /*
   *
   *   Recursive function that travels one step of a path each call
   *   removing the last piece of the path
   *
   *
   * */
  currentRoom = path[start];

  return new Promise((resolve, reject) => {
    let directions = Object.keys(islandMap[currentRoom]);
    nextRoom = path[start + 1];

    foundPath = false;

    for (let d of directions) {
      if (islandMap[currentRoom][d] === nextRoom) {
        console.log(`Moving ${start + 1} of ${path.length} steps down path`);
        console.log(`From ${currentRoom} move ${d} to room ${nextRoom}`);
        foundPath = true;
        let req_data = { direction: `${d}`, next_room_id: `${nextRoom}` };

        // console.log(`${BASE_URL}/adv/move/`, req_data, config);
        axios
          .post(`${BASE_URL}/adv/fly/`, req_data, config)
          .then(res => {
            // console.log(req_data);
            // console.log(res.data);
            // process.exit();
            let { data } = res;
            logger.logObject(data);
            lastRoom = currentRoom;
            currentRoom = data.room_id;
            cooldown = data.cooldown;

            // data.items.forEach(item => {
            //   if (item.includes("treasure")) {
            //     console.log("Found a treasure");
            //     process.exit();
            //   }
            // });

            if (path.length - 1 === start) {
              resolve({
                goal: "explore",
                currentRoom,
                cooldown,
                nextMove: null
              });
            }

            return { path, currentRoom, cooldown, items: data.items };
          })
          .then(res => {
            // wait for timeout and do it again

            const has_items = () => {
              let eggs = res.items.filter(item => item.includes(treasure));
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
                    resolve({
                      currentRoom,
                      cooldown,
                      path
                    });
                  })
                  .catch(err => {
                    console.log(`couldnt pick up a ${name}`);
                    console.log(err);
                    reject(err);
                  });
              });
            };

            // if (has_items()) {
            //   console.log(`waiting ${cooldown} seconds before moving`);
            //   setTimeout(() => {
            //     pick_up_Item(has_items())
            //       .then(res => {
            //         if (!res.cooldown) {
            //           process.exit(1);
            //         }
            //         console.log(
            //           `waiting ${res.cooldown} seconds before moving`
            //         );
            //         setTimeout(() => {
            //           travel(
            //             islandMap,
            //             res.path,
            //             res.cooldown,
            //             exploring,
            //             start + 1
            //           )
            //             .then(data => resolve(data))
            //             .catch(err => console.log(err));
            //         }, res.cooldown * 1000);
            //       })
            //       .catch(err => reject(err, res.currentRoom));
            //   }, cooldown * 1000);
            // } else {
            console.log("calling next move");
            console.log(`waiting ${res.cooldown} seconds before moving`);

            setTimeout(() => {
              travel(islandMap, res.path, res.cooldown, exploring, start + 1)
                .then(data => resolve(data))
                .catch(err => console.log(err));
            }, res.cooldown * 1000);
            // }
          })
          .catch(err => {
            reject({ ...err.response.data, currentRoom });
          });

        break;
      }
    }

    if (!foundPath)
      resolve({ goal: "explore", currentRoom, cooldown, nextMove: null });
  });
}

module.exports = {
  findPath,
  travel
};
