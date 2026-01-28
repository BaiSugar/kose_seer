const Database = require('better-sqlite3');
const db = new Database('./data/seer.db');

// 更新所有在地图1的玩家到新手地图515
const result = db.prepare('UPDATE players SET map_id = 515 WHERE map_id = 1').run();
console.log(`已更新 ${result.changes} 个玩家到新手地图 515`);

db.close();
