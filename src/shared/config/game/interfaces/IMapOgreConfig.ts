/**
 * 单个精灵的刷新配置
 */
export interface IOgreRefreshConfig {
  enabled: boolean;                // 是否启用刷新
  refreshInterval: number;         // 刷新间隔（秒）
  refreshOnEmpty: boolean;         // 是否在无玩家时刷新
  refreshAtNight: boolean;         // 是否夜间刷新
  refreshAtDay: boolean;           // 是否白天刷新
  startTime: string;               // 刷新起始时间 (HH:mm)
  endTime: string;                 // 刷新结束时间 (HH:mm)
  useInterval: boolean;            // 是否按间隔刷新
  useSchedule: boolean;            // 是否按指定时间刷新
  scheduleTime: string[];          // 指定刷新时间点 (HH:mm)
  shinyRate: number;               // 闪光刷新概率
  shinyPetId: number;              // 闪光精灵ID（-1表示没有闪光版本）
}

/**
 * 野怪掉落物品配置
 */
export interface IOgreDropItem {
  itemId: number;                  // 物品ID
  dropRate: number;                // 掉落概率 (0-1)
  minCount: number;                // 最小掉落数量
  maxCount: number;                // 最大掉落数量
}

/**
 * 地图怪物槽位配置
 */
export interface IMapOgreSlot {
  slot: number;                    // 槽位索引 (0-8)
  petId: number;                   // 精灵ID
  shiny: number;                   // 是否固定闪光 (0=随机, 1=固定)
  weight: number;                  // 刷新权重
  
  // BOSS标识
  isBoss?: boolean;                // 是否为BOSS（默认false）
  
  // 野怪属性
  level?: number;                  // 野怪等级（默认从配置读取或随机）
  minLevel?: number;               // 最小等级（用于随机等级）
  maxLevel?: number;               // 最大等级（用于随机等级）
  
  // 战斗奖励
  expReward?: number;              // 击败后获得的经验值（默认从精灵配置的YieldingExp读取）
  expMultiplier?: number;          // 经验倍率（默认1.0）
  
  // 捕捉配置
  catchable?: boolean;             // 是否可以捕捉（默认true，BOSS通常为false）
  catchRate?: number;              // 捕捉概率（0-1，默认从精灵配置的CatchRate读取）
  
  // 掉落配置
  dropItems?: IOgreDropItem[];     // 掉落物品列表
  
  refreshConfig: IOgreRefreshConfig; // 该精灵的刷新配置
}

/**
 * 地图怪物配置接口
 */
export interface IMapOgreConfig {
  description: string;
  globalSettings: {
    defaultShinyRate: number;
    defaultRefreshInterval: number;
    comment: string;
  };
  maps: {
    [mapId: string]: {
      name: string;
      spawnCount: number;              // 每次刷新数量
      randomCount: boolean;            // 是否随机刷新数量
      minCount: number;                // 最小刷新数量
      maxCount: number;                // 最大刷新数量
      ogres: IMapOgreSlot[];
    };
  };
  comment: string;
}
