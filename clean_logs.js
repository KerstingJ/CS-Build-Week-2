const fs = require("fs");

let data = fs.readFileSync("_.room_logs.txt");
data = data.toString().split(/\r?\n/);

let cache = {};

for (let i = 1; i < data.length; i++) {
  let raw = data[i];
  let room = JSON.parse(raw);
  cache[room.room_id] = raw;
}

let room_data = Object.values(cache).join("\n");

fs.writeFile("_.room_logs.txt", room_data, err => {
  if (err) {
    console.error(err);
  } else {
    console.log("success");
  }
});
