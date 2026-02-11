/**
 * 配置定义
 * 集中管理所有配置的键名和路径
 */

/**
 * 配置键名常量
 */
export const ConfigKeys = {
  // 服务器配置
  SERVER_CONFIG: 'server_config',
  CLIENT_CONFIG: 'client_config',
  
  // 游戏配置 (JSON)
  MAP_OGRES: 'map_ogres',
  BATTLE_CONFIG: 'battle_config',
  TASK_CONFIG: 'task_config',
  SHOP_CONFIG: 'shop_config',
  DEFAULT_PLAYER: 'default_player',
  
  // 游戏数据配置 (XML)
  PET_CONFIG: 'pet_config',
  SKILL_CONFIG: 'skill_config',
  ITEM_CONFIG: 'item_config',
  SKILL_EFFECTS_CONFIG: 'skill_effects_config',
  SPT_CONFIG: 'spt_config',
  
  // 游戏数据配置 (JSON)
  NATURES_CONFIG: 'natures_config',
  ELEMENTS_CONFIG: 'elements_config',
  UNIQUE_ITEMS_CONFIG: 'unique_items_config',
  SKILL_EFFECTS_V2: 'skill_effects_v2',
  PET_ABILITIES: 'pet_abilities',
} as const;

/**
 * 配置路径映射
 */
export const ConfigPaths: Record<string, string> = {
  // 服务器配置
  [ConfigKeys.SERVER_CONFIG]: 'server.json',
  [ConfigKeys.CLIENT_CONFIG]: 'client.json',
  
  // JSON配置
  [ConfigKeys.MAP_OGRES]: 'data/json/map-ogres.json',
  [ConfigKeys.BATTLE_CONFIG]: 'game/battle-config.json',
  [ConfigKeys.TASK_CONFIG]: 'data/json/tasks.json',
  [ConfigKeys.SHOP_CONFIG]: 'data/json/shop.json',
  [ConfigKeys.DEFAULT_PLAYER]: 'data/json/default-player.json',
  
  // XML配置
  [ConfigKeys.PET_CONFIG]: 'data/xml/pets.xml',
  [ConfigKeys.SKILL_CONFIG]: 'data/xml/skills.xml',
  [ConfigKeys.ITEM_CONFIG]: 'data/xml/items.xml',
  [ConfigKeys.SKILL_EFFECTS_CONFIG]: 'data/xml/skill_effects.xml',
  [ConfigKeys.SPT_CONFIG]: 'data/xml/spt.xml',
  
  // JSON数据配置
  [ConfigKeys.NATURES_CONFIG]: 'data/json/natures.json',
  [ConfigKeys.ELEMENTS_CONFIG]: 'data/json/elements.json',
  [ConfigKeys.UNIQUE_ITEMS_CONFIG]: 'data/json/unique-items.json',
  [ConfigKeys.SKILL_EFFECTS_V2]: 'data/json/skill_effects_v2.json',
  [ConfigKeys.PET_ABILITIES]: 'data/json/pet_abilities.json',
};

/**
 * 配置类型：JSON 或 XML
 */
export enum ConfigType {
  JSON = 'json',
  XML = 'xml'
}

/**
 * 配置类型映射
 */
export const ConfigTypes: Record<string, ConfigType> = {
  [ConfigKeys.SERVER_CONFIG]: ConfigType.JSON,
  [ConfigKeys.CLIENT_CONFIG]: ConfigType.JSON,
  
  [ConfigKeys.MAP_OGRES]: ConfigType.JSON,
  [ConfigKeys.BATTLE_CONFIG]: ConfigType.JSON,
  [ConfigKeys.TASK_CONFIG]: ConfigType.JSON,
  [ConfigKeys.SHOP_CONFIG]: ConfigType.JSON,
  [ConfigKeys.DEFAULT_PLAYER]: ConfigType.JSON,
  
  [ConfigKeys.PET_CONFIG]: ConfigType.XML,
  [ConfigKeys.SKILL_CONFIG]: ConfigType.XML,
  [ConfigKeys.ITEM_CONFIG]: ConfigType.XML,
  [ConfigKeys.SKILL_EFFECTS_CONFIG]: ConfigType.XML,
  [ConfigKeys.SPT_CONFIG]: ConfigType.XML,
  
  [ConfigKeys.NATURES_CONFIG]: ConfigType.JSON,
  [ConfigKeys.ELEMENTS_CONFIG]: ConfigType.JSON,
  [ConfigKeys.UNIQUE_ITEMS_CONFIG]: ConfigType.JSON,
  [ConfigKeys.SKILL_EFFECTS_V2]: ConfigType.JSON,
  [ConfigKeys.PET_ABILITIES]: ConfigType.JSON,
};

/**
 * 获取所有游戏配置的注册信息
 */
export function GetGameConfigRegistrations(): Array<{ key: string; path: string; type: ConfigType }> {
  return [
    { key: ConfigKeys.CLIENT_CONFIG, path: ConfigPaths[ConfigKeys.CLIENT_CONFIG], type: ConfigTypes[ConfigKeys.CLIENT_CONFIG] },
    { key: ConfigKeys.MAP_OGRES, path: ConfigPaths[ConfigKeys.MAP_OGRES], type: ConfigTypes[ConfigKeys.MAP_OGRES] },
    { key: ConfigKeys.DEFAULT_PLAYER, path: ConfigPaths[ConfigKeys.DEFAULT_PLAYER], type: ConfigTypes[ConfigKeys.DEFAULT_PLAYER] },
    { key: ConfigKeys.TASK_CONFIG, path: ConfigPaths[ConfigKeys.TASK_CONFIG], type: ConfigTypes[ConfigKeys.TASK_CONFIG] },
    { key: ConfigKeys.SHOP_CONFIG, path: ConfigPaths[ConfigKeys.SHOP_CONFIG], type: ConfigTypes[ConfigKeys.SHOP_CONFIG] },
    { key: ConfigKeys.PET_CONFIG, path: ConfigPaths[ConfigKeys.PET_CONFIG], type: ConfigTypes[ConfigKeys.PET_CONFIG] },
    { key: ConfigKeys.SKILL_CONFIG, path: ConfigPaths[ConfigKeys.SKILL_CONFIG], type: ConfigTypes[ConfigKeys.SKILL_CONFIG] },
    { key: ConfigKeys.ITEM_CONFIG, path: ConfigPaths[ConfigKeys.ITEM_CONFIG], type: ConfigTypes[ConfigKeys.ITEM_CONFIG] },
    { key: ConfigKeys.SKILL_EFFECTS_CONFIG, path: ConfigPaths[ConfigKeys.SKILL_EFFECTS_CONFIG], type: ConfigTypes[ConfigKeys.SKILL_EFFECTS_CONFIG] },
    { key: ConfigKeys.SPT_CONFIG, path: ConfigPaths[ConfigKeys.SPT_CONFIG], type: ConfigTypes[ConfigKeys.SPT_CONFIG] },
    { key: ConfigKeys.NATURES_CONFIG, path: ConfigPaths[ConfigKeys.NATURES_CONFIG], type: ConfigTypes[ConfigKeys.NATURES_CONFIG] },
    { key: ConfigKeys.ELEMENTS_CONFIG, path: ConfigPaths[ConfigKeys.ELEMENTS_CONFIG], type: ConfigTypes[ConfigKeys.ELEMENTS_CONFIG] },
    { key: ConfigKeys.UNIQUE_ITEMS_CONFIG, path: ConfigPaths[ConfigKeys.UNIQUE_ITEMS_CONFIG], type: ConfigTypes[ConfigKeys.UNIQUE_ITEMS_CONFIG] },
    { key: ConfigKeys.SKILL_EFFECTS_V2, path: ConfigPaths[ConfigKeys.SKILL_EFFECTS_V2], type: ConfigTypes[ConfigKeys.SKILL_EFFECTS_V2] },
    { key: ConfigKeys.PET_ABILITIES, path: ConfigPaths[ConfigKeys.PET_ABILITIES], type: ConfigTypes[ConfigKeys.PET_ABILITIES] }
    //{ key: ConfigKeys.BATTLE_CONFIG, path: ConfigPaths[ConfigKeys.BATTLE_CONFIG], type: ConfigTypes[ConfigKeys.BATTLE_CONFIG] },
  ];
}
