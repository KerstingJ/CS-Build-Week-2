const fs = require("fs");

let data = fs.readFileSync("_.room_logs.txt");
data = data.toString().split(/\r?\n/);

let cache = {};
let cooldown = 0;

for (let i = 1; i < data.length; i++) {
  let raw = data[i];
  let room = JSON.parse(raw);
  cooldown += room.cooldown;
  cache[room.room_id] = raw;
}

console.log("avg cooldown: ", Math.floor(cooldown / data.length));

let room_data = Object.values(cache).join("\n");

fs.writeFile("_.room_logs.txt", room_data, err => {
  if (err) {
    console.error(err);
  } else {
    console.log("success");
  }
});
