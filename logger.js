const fs = require("fs");

function logObject(object, path = null) {
  message = JSON.stringify({ time: Date.now(), ...object });
  path = path || `./travel_logs.txt`;
  fs.appendFile(path, `\n${message}`, function(err) {
    if (err) throw err;
    console.log("Saved!");
  });
}

module.exports = { logObject };
