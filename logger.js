const fs = require("fs");

function logObject(object, path = null) {
  message = JSON.stringify({ time: Date.now(), ...object });
  path = path || `./_.room_logs.txt`;
  fs.appendFile(path, `\n${message}`, function(err) {
    if (err) throw err;
    console.log("Saved!");
  });
}

function saveMap(islandMap) {
  console.log("Saving Data");
  let mapData = { ...islandMap };
  mapData = JSON.stringify(mapData);
  fs.writeFileSync("./_.map.txt", mapData);
}

module.exports = { logObject, saveMap };
