/**
 * 属性配置接口
 */
export interface IElementConfig {
  types: Array<{
    id: number;
    name: string;
    nameEn: string;
  }>;
  effectiveness: {
    [atkType: string]: {
      [defType: string]: number;
    };
  };
}
