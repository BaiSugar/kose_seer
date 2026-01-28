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
 * 地图怪物槽位配置
 */
export interface IMapOgreSlot {
  slot: number;                    // 槽位索引 (0-8)
  petId: number;                   // 精灵ID
  shiny: number;                   // 是否固定闪光 (0=随机, 1=固定)
  weight: number;                  // 刷新权重
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
