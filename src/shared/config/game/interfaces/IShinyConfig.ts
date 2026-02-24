/**
 * 发光效果配置
 */
export interface IGlowConfig {
  color: string;      // 十六进制颜色字符串，如 "0xFFD700"
  alpha: number;      // 透明度 (0-1)
  blur: number;       // 模糊度
  strength: number;   // 强度
}

/**
 * 精灵特定覆盖配置
 */
export interface IPetOverride {
  comment?: string;
  colorMatrix?: number[];
  glow?: IGlowConfig;
}

/**
 * 单个异色方案配置
 */
export interface IShinyConfigItem {
  shinyId: number;
  name: string;
  description: string;
  enabled: boolean;
  colorMatrix: number[];      // 4x5 = 20 个数字
  glow: IGlowConfig;
  petOverrides: {
    [petId: string]: IPetOverride;
  };
}

/**
 * 异色配置文件结构
 */
export interface IShinyConfigFile {
  description: string;
  version: number;
  configs: IShinyConfigItem[];
  comment?: string;
}

/**
 * 异色配置响应（发送给 Mod）
 */
export interface IShinyConfigResponse {
  configs: IShinyConfigItem[];
  version: number;  // 配置版本号，用于客户端缓存
}
