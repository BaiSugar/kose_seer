/**
 * 脚本：为 map-ogres.json 添加 shinyPetId 字段
 * 默认值为 -1（表示没有闪光版本）
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config/data/json/map-ogres.json');

console.log('读取配置文件:', configPath);

// 读取配置
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

let updateCount = 0;

// 遍历所有地图
for (const mapId in config.maps) {
  const mapConfig = config.maps[mapId];
  
  // 遍历所有野怪
  for (const ogre of mapConfig.ogres) {
    // 如果没有 shinyPetId 字段，添加默认值 -1
    if (!ogre.refreshConfig.hasOwnProperty('shinyPetId')) {
      ogre.refreshConfig.shinyPetId = -1;
      updateCount++;
    }
  }
}

console.log(`更新了 ${updateCount} 个野怪配置`);

// 写回文件
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

console.log('配置文件已更新！');
console.log('');
console.log('说明：');
console.log('- shinyPetId = -1: 表示该精灵没有闪光版本');
console.log('- shinyPetId > 0: 表示闪光精灵的ID');
console.log('');
console.log('示例：如果要设置精灵10的闪光版本为10010，修改配置：');
console.log('  "shinyPetId": 10010');
