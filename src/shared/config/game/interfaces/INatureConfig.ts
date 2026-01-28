/**
 * 性格配置接口
 */
export interface INatureConfig {
  natures: Array<{
    id: number;
    name: string;
    upStat?: number;
    downStat?: number;
    category: string;
  }>;
}
