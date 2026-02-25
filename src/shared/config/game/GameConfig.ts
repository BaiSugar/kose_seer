import { ConfigRegistry } from '../../../shared/config/ConfigRegistry';
import { ConfigKeys } from '../../../shared/config/ConfigDefinitions';
import { Logger } from '../../../shared/utils';
import { SkillEffectsConfig } from './SkillEffectsConfig';
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
import {
  IMapOgreConfig,
  IOgreRefreshConfig,
  IMapOgreSlot,
  INatureConfig,
  IElementConfig,
  IUniqueItemsConfig,
  IDefaultPlayerConfig
} from './interfaces';
import { BossAbilityConfig } from '../../../GameServer/Game/Battle/BossAbility/BossAbilityConfig';

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
   * 获取指定地图的配置
   * @param mapId 地图ID
   * @returns 地图配置，如果不存在返回 null
   */
  public static GetMapConfigById(mapId: number): any {
    const config = this.GetMapOgreConfig();
    if (!config) {
      return null;
    }
    return config.maps[mapId.toString()] || null;
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
   * 获取默认玩家配置
   */
  public static GetDefaultPlayerConfig(): IDefaultPlayerConfig | null {
    return ConfigRegistry.Instance.Get<IDefaultPlayerConfig>(ConfigKeys.DEFAULT_PLAYER);
  }

  /**
   * 获取已实现的效果（从V2配置）
   * 注意：此方法已废弃，请使用 SkillEffectsConfig.Instance.GetImplementedEffects()
   */
  public static GetImplementedEffects(): any[] {
    return SkillEffectsConfig.Instance.GetImplementedEffects();
  }

  /**
   * 获取未实现的效果（从V2配置）
   */
  public static GetUnimplementedEffects(): any[] {
    return SkillEffectsConfig.Instance.GetUnimplementedEffects();
  }

  /**
   * 按分类获取效果（从V2配置）
   * @param category 效果分类
   */
  public static GetEffectsByCategory(category: string): any[] {
    return SkillEffectsConfig.Instance.GetAllEffects().filter((e: any) => e.category === category);
  }

  // ============ 向后兼容的方法（已废弃，使用V2配置） ============

  /**
   * @deprecated 使用 GetEffectById 代替
   * 获取基础效果配置
   * @param eid 基础效果ID (1-41)
   */
  public static GetBaseEffect(eid: number): any | null {
    return this.GetEffectById(eid);
  }

  /**
   * @deprecated 使用 GetAllEffectsV2 代替
   * 获取所有基础效果
   */
  public static GetAllBaseEffects(): any[] {
    const { SkillEffectsConfig } = require('./SkillEffectsConfig');
    return SkillEffectsConfig.Instance.GetAllEffects().filter((e: any) => e.effectId >= 1 && e.effectId <= 41);
  }

  /**
   * @deprecated 使用 GetEffectById 代替
   * 获取扩展效果配置
   * @param effectId 扩展效果ID (1-1901)
   */
  public static GetExtendedEffect(effectId: number): any | null {
    return this.GetEffectById(effectId);
  }

  /**
   * @deprecated 使用 GetAllEffectsV2 代替
   * 获取所有扩展效果
   */
  public static GetAllExtendedEffects(): any[] {
    return this.GetAllEffectsV2();
  }

  /**
   * @deprecated 使用 GetImplementedEffects 代替
   * 获取已实现的扩展效果
   */
  public static GetImplementedExtendedEffects(): any[] {
    return this.GetImplementedEffects();
  }

  /**
   * @deprecated 使用 GetUnimplementedEffects 代替
   * 获取未实现的扩展效果
   */
  public static GetUnimplementedExtendedEffects(): any[] {
    return this.GetUnimplementedEffects();
  }

  /**
   * @deprecated 使用 GetEffectsByCategory 或自行过滤
   * 按映射类型获取扩展效果
   * @param mappingType 映射类型 ('new' | 'base' | 'ignore')
   */
  public static GetExtendedEffectsByMappingType(mappingType: string): any[] {
    const { SkillEffectsConfig } = require('./SkillEffectsConfig');
    return SkillEffectsConfig.Instance.GetAllEffects().filter((e: any) => e.mappingType === mappingType);
  }

  /**
   * 获取任务配置
   */
  public static GetTaskConfig(): any | null {
    return ConfigRegistry.Instance.Get<any>(ConfigKeys.TASK_CONFIG);
  }

  /**
   * 获取指定任务的配置
   * @param taskId 任务ID
   */
  public static GetTaskById(taskId: number): any | null {
    const config = this.GetTaskConfig();
    if (!config || !config.tasks) {
      return null;
    }
    return config.tasks[taskId.toString()] || null;
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

  /**
   * 获取技能效果V2配置（通过SkillEffectsConfig）
   * @param effectId 效果ID
   */
  public static GetEffectById(effectId: number): any | null {
    // 动态导入SkillEffectsConfig以避免循环依赖
    const { SkillEffectsConfig } = require('./SkillEffectsConfig');
    return SkillEffectsConfig.Instance.GetEffectById(effectId);
  }

  /**
   * 获取所有技能效果V2配置
   */
  public static GetAllEffectsV2(): any[] {
    const { SkillEffectsConfig } = require('./SkillEffectsConfig');
    return SkillEffectsConfig.Instance.GetAllEffects();
  }

  /**
   * 重新加载技能效果V2配置
   */
  public static async ReloadSkillEffectsV2(): Promise<void> {
    const { SkillEffectsConfig } = require('./SkillEffectsConfig');
    await SkillEffectsConfig.Instance.Reload();
  }

  /**
   * 获取商品配置
   */
  public static GetShopConfig(): any | null {
    return ConfigRegistry.Instance.Get<any>(ConfigKeys.SHOP_CONFIG);
  }

  /**
   * 获取精灵特性配置
   */
  public static GetPetAbilitiesConfig(): any | null {
    return ConfigRegistry.Instance.Get<any>(ConfigKeys.PET_ABILITIES);
  }

  /**
   * 获取所有精灵可拥有的特性列表
   */
  public static GetAllPetAbilities(): any[] {
    const config = this.GetPetAbilitiesConfig();
    if (!config || !config.abilities) {
      return [];
    }
    return config.abilities;
  }

  /**
   * 获取指定特性配置
   * @param abilityId 特性ID（客户端ID，如1006-1045）
   */
  public static GetPetAbilityById(abilityId: number): any | null {
    const abilities = this.GetAllPetAbilities();
    return abilities.find((a: any) => a.abilityId === abilityId) || null;
  }

  /**
   * 获取BOSS特性配置
   */
  public static GetBossAbilitiesConfig(): any | null {
    return ConfigRegistry.Instance.Get<any>(ConfigKeys.BOSS_ABILITIES);
  }

  /**
   * 获取所有BOSS配置
   */
  public static GetAllBosses(): any[] {
    const config = this.GetBossAbilitiesConfig();
    if (!config || !config.bossConfigs) {
      return [];
    }
    return config.bossConfigs;
  }

  /**
   * 根据地图ID和param2获取BOSS配置
   * @param mapId 地图ID
   * @param param2 参数2
   */
  public static GetBossByMapAndParam(mapId: number, param2: number): any | null {
    return BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2) || null;
  }

  /**
   * 根据petId获取BOSS配置
   * @param petId 精灵ID
   */
  public static GetBossByPetId(petId: number): any | null {
    return BossAbilityConfig.Instance.GetBossConfigByPetId(petId) || null;
  }

  /**
   * 获取所有SPT BOSS配置
   */
  public static GetAllSPTBosses(): any[] {
    return BossAbilityConfig.Instance.GetAllSPTBosses();
  }

  /**
   * 根据SPT任务ID获取BOSS配置
   * @param sptId SPT任务ID (1-20)
   */
  public static GetBossBySPTId(sptId: number): any | null {
    return BossAbilityConfig.Instance.GetBossBySPTId(sptId) || null;
  }

  /**
   * 获取指定商品的配置
   * @param productId 商品ID
   */
  public static GetProductById(productId: number): any | null {
    const config = this.GetShopConfig();
    if (!config || !config.products) {
      return null;
    }
    return config.products.find((p: any) => p.productID === productId) || null;
  }

  /**
   * 获取所有商品配置
   */
  public static GetAllProducts(): any[] {
    const config = this.GetShopConfig();
    if (!config || !config.products) {
      return [];
    }
    return config.products;
  }
}
