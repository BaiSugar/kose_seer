import { ConfigRegistry } from '../../../shared/config/ConfigRegistry';
import { ConfigKeys } from '../../../shared/config/ConfigDefinitions';
import { Logger } from '../../../shared/utils';
import {
  IPetXmlConfig,
  IPetMonster,
  ISkillXmlConfig,
  ISkillMove,
  IItemXmlConfig,
  IItemCategory,
  IItem,
  ISkillEffectsXmlConfig,
  ISptXmlConfig
} from '../../../shared/config/XmlConfigInterfaces';

/**
 * 地图怪物配置接口
 */
export interface IMapOgreConfig {
  description: string;
  maps: {
    [mapId: string]: {
      name: string;
      ogres: Array<{
        slot: number;
        petId: number;
        shiny: number;
      }>;
    };
  };
  shinyRate: number;
  comment: string;
}

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

/**
 * 游戏配置管理器
 * 提供类型安全的配置访问接口
 */
export class GameConfig {
  /**
   * 获取地图怪物配置
   */
  public static GetMapOgreConfig(): IMapOgreConfig | null {
    return ConfigRegistry.Instance.Get<IMapOgreConfig>(ConfigKeys.MAP_OGRES);
  }

  /**
   * 获取指定地图的怪物列表
   * @param mapId 地图ID
   * @returns 怪物列表，固定9个槽位
   */
  public static GetMapOgres(mapId: number): Array<{ petId: number; shiny: number }> {
    const config = this.GetMapOgreConfig();
    if (!config) {
      Logger.Warn('[GameConfig] 地图怪物配置未加载，返回空列表');
      return Array(9).fill({ petId: 0, shiny: 0 });
    }

    const mapConfig = config.maps[mapId.toString()];
    if (!mapConfig) {
      return Array(9).fill({ petId: 0, shiny: 0 });
    }

    // 初始化9个空槽位
    const result: Array<{ petId: number; shiny: number }> = Array(9)
      .fill(null)
      .map(() => ({ petId: 0, shiny: 0 }));

    // 填充配置的怪物
    for (const ogre of mapConfig.ogres) {
      if (ogre.slot >= 0 && ogre.slot < 9) {
        let shiny = ogre.shiny;
        // 如果配置为0，则按概率随机闪光
        if (shiny === 0 && Math.random() < config.shinyRate) {
          shiny = 1;
        }
        result[ogre.slot] = { petId: ogre.petId, shiny };
      }
    }

    return result;
  }

  /**
   * 获取精灵配置
   */
  public static GetPetConfig(): IPetXmlConfig | null {
    return ConfigRegistry.Instance.Get<IPetXmlConfig>(ConfigKeys.PET_CONFIG);
  }

  /**
   * 获取指定精灵的配置
   * @param petId 精灵ID
   */
  public static GetPetById(petId: number): IPetMonster | null {
    const config = this.GetPetConfig();
    if (!config || !config.Monsters) {
      return null;
    }

    const monsters = config.Monsters.Monster;
    if (!monsters) {
      return null;
    }

    // 处理单个或数组
    const monsterArray = Array.isArray(monsters) ? monsters : [monsters];
    return monsterArray.find(m => m.ID === petId) || null;
  }

  /**
   * 获取技能配置
   */
  public static GetSkillConfig(): ISkillXmlConfig | null {
    return ConfigRegistry.Instance.Get<ISkillXmlConfig>(ConfigKeys.SKILL_CONFIG);
  }

  /**
   * 获取指定技能的配置
   * @param skillId 技能ID
   */
  public static GetSkillById(skillId: number): ISkillMove | null {
    const config = this.GetSkillConfig();
    if (!config || !config.MovesTbl || !config.MovesTbl.Moves) {
      return null;
    }

    const moves = config.MovesTbl.Moves.Move;
    if (!moves) {
      return null;
    }

    // 处理单个或数组
    const moveArray = Array.isArray(moves) ? moves : [moves];
    return moveArray.find(m => m.ID === skillId) || null;
  }

  /**
   * 获取物品配置
   */
  public static GetItemConfig(): IItemXmlConfig | null {
    return ConfigRegistry.Instance.Get<IItemXmlConfig>(ConfigKeys.ITEM_CONFIG);
  }

  /**
   * 获取指定物品的配置
   * @param itemId 物品ID
   */
  public static GetItemById(itemId: number): IItem | null {
    const config = this.GetItemConfig();
    if (!config || !config.Items) {
      return null;
    }

    const categories = config.Items.Cat;
    if (!categories) {
      return null;
    }

    // 处理单个或数组
    const catArray = Array.isArray(categories) ? categories : [categories];

    for (const cat of catArray) {
      if (!cat.Item) continue;

      const items = Array.isArray(cat.Item) ? cat.Item : [cat.Item];
      const item = items.find((i: any) => i.ID === itemId);
      if (item) {
        return item;
      }
    }

    return null;
  }

  /**
   * 获取技能效果配置
   */
  public static GetSkillEffectsConfig(): ISkillEffectsXmlConfig | null {
    return ConfigRegistry.Instance.Get<ISkillEffectsXmlConfig>(ConfigKeys.SKILL_EFFECTS_CONFIG);
  }

  /**
   * 获取SPT配置
   */
  public static GetSptConfig(): ISptXmlConfig | null {
    return ConfigRegistry.Instance.Get<ISptXmlConfig>(ConfigKeys.SPT_CONFIG);
  }

  /**
   * 获取性格配置
   */
  public static GetNatureConfig(): INatureConfig | null {
    return ConfigRegistry.Instance.Get<INatureConfig>(ConfigKeys.NATURES_CONFIG);
  }

  /**
   * 获取属性配置
   */
  public static GetElementConfig(): IElementConfig | null {
    return ConfigRegistry.Instance.Get<IElementConfig>(ConfigKeys.ELEMENTS_CONFIG);
  }

  /**
   * 获取唯一物品配置
   */
  public static GetUniqueItemsConfig(): IUniqueItemsConfig | null {
    return ConfigRegistry.Instance.Get<IUniqueItemsConfig>(ConfigKeys.UNIQUE_ITEMS_CONFIG);
  }

  /**
   * 重新加载地图怪物配置
   */
  public static async ReloadMapOgres(): Promise<boolean> {
    return await ConfigRegistry.Instance.Reload(ConfigKeys.MAP_OGRES);
  }

  /**
   * 重新加载所有配置
   */
  public static async ReloadAll(): Promise<void> {
    await ConfigRegistry.Instance.ReloadAll();
  }

  /**
   * 获取所有精灵配置
   */
  public static GetAllPets(): IPetMonster[] {
    const config = this.GetPetConfig();
    if (!config || !config.Monsters) {
      return [];
    }

    const monsters = config.Monsters.Monster;
    if (!monsters) {
      return [];
    }

    return Array.isArray(monsters) ? monsters : [monsters];
  }

  /**
   * 按属性类型获取精灵
   * @param type 属性类型
   */
  public static GetPetsByType(type: number): IPetMonster[] {
    return this.GetAllPets().filter(p => p.Type === type);
  }

  /**
   * 获取精灵进化链
   * @param petId 精灵ID
   */
  public static GetEvolutionChain(petId: number): IPetMonster[] {
    const chain: IPetMonster[] = [];
    let current = this.GetPetById(petId);

    // 向前查找起始形态
    while (current && current.EvolvesFrom && current.EvolvesFrom > 0) {
      current = this.GetPetById(current.EvolvesFrom);
    }

    // 从起始形态向后遍历
    while (current) {
      chain.push(current);
      if (current.EvolvesTo && current.EvolvesTo > 0) {
        current = this.GetPetById(current.EvolvesTo);
      } else {
        break;
      }
    }

    return chain;
  }

  /**
   * 获取所有技能配置
   */
  public static GetAllSkills(): ISkillMove[] {
    const config = this.GetSkillConfig();
    if (!config || !config.MovesTbl || !config.MovesTbl.Moves) {
      return [];
    }

    const moves = config.MovesTbl.Moves.Move;
    if (!moves) {
      return [];
    }

    return Array.isArray(moves) ? moves : [moves];
  }

  /**
   * 按属性类型获取技能
   * @param type 属性类型
   */
  public static GetSkillsByType(type: number): ISkillMove[] {
    return this.GetAllSkills().filter(s => s.Type === type);
  }

  /**
   * 按类别获取技能 (物理/特殊/状态)
   * @param category 类别 (1=物理, 2=特殊, 4=状态)
   */
  public static GetSkillsByCategory(category: number): ISkillMove[] {
    return this.GetAllSkills().filter(s => s.Category === category);
  }

  /**
   * 获取所有物品配置
   */
  public static GetAllItems(): IItem[] {
    const config = this.GetItemConfig();
    if (!config || !config.Items) {
      return [];
    }

    const categories = config.Items.Cat;
    if (!categories) {
      return [];
    }

    const catArray = Array.isArray(categories) ? categories : [categories];
    const allItems: IItem[] = [];

    for (const cat of catArray) {
      if (!cat.Item) continue;
      const items = Array.isArray(cat.Item) ? cat.Item : [cat.Item];
      allItems.push(...items);
    }

    return allItems;
  }

  /**
   * 按分类获取物品
   * @param catId 分类ID
   */
  public static GetItemsByCategory(catId: number): IItem[] {
    const config = this.GetItemConfig();
    if (!config || !config.Items) {
      return [];
    }

    const categories = config.Items.Cat;
    if (!categories) {
      return [];
    }

    const catArray = Array.isArray(categories) ? categories : [categories];
    const targetCat = catArray.find(c => c.ID === catId);

    if (!targetCat || !targetCat.Item) {
      return [];
    }

    return Array.isArray(targetCat.Item) ? targetCat.Item : [targetCat.Item];
  }

  /**
   * 获取物品分类配置
   * @param catId 分类ID
   */
  public static GetItemCategory(catId: number): IItemCategory | null {
    const config = this.GetItemConfig();
    if (!config || !config.Items) {
      return null;
    }

    const categories = config.Items.Cat;
    if (!categories) {
      return null;
    }

    const catArray = Array.isArray(categories) ? categories : [categories];
    return catArray.find(c => c.ID === catId) || null;
  }

  /**
   * 获取所有物品分类
   */
  public static GetAllItemCategories(): IItemCategory[] {
    const config = this.GetItemConfig();
    if (!config || !config.Items) {
      return [];
    }

    const categories = config.Items.Cat;
    if (!categories) {
      return [];
    }

    return Array.isArray(categories) ? categories : [categories];
  }

  /**
   * 获取配置统计信息
   */
  public static GetStats() {
    return ConfigRegistry.Instance.GetStats();
  }
}
