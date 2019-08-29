const fs = require("fs");

function logObject(object, path = null) {
  message = JSON.stringify({ time: Date.now(), ...object });
  path = path || `./travel_logs.txt`;
  fs.appendFile(path, `\n${message}`, function(err) {
    if (err) throw err;
    console.log("Saved!");
  });
}

function saveMap(islandMap) {
  console.log("Saving Data");
  let mapData = { ...islandMap };
  mapData = JSON.stringify(mapData);
  fs.writeFileSync("./map.txt", mapData);
}

function saveLocations({ shop, pirateRy, currentRoom }) {
  locations = { shop, pirateRy, currentRoom };
  locations = JSON.stringify(locations);
  fs.writeFileSync("./locations.txt", locations);
  console.log("Done Saving");
}

module.exports = { logObject, saveMap, saveLocations };
