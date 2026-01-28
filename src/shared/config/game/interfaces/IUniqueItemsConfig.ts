/**
 * 唯一物品配置接口
 */
export interface IUniqueItemsConfig {
  description: string;
  comment: string;
  uniqueItemIds: number[];
  uniqueRanges: Array<{
    start: number;
    end: number;
    category: string;
    description: string;
  }>;
}
