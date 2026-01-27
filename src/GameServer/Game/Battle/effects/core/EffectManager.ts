import { BaseEffect } from './BaseEffect';
import { EffectRegistry } from './EffectRegistry';
import { EffectFactory } from './EffectFactory';
import { IEffectContext, IEffectResult, EffectTiming, createEffectContext } from './EffectContext';
import { IBattlePet } from '../../../../../shared/models/BattleModel';
import { SkillEffectConfig } from '../../../../../shared/config/game/SkillEffectConfig';
import { parseEffectArgs } from '../../../../../shared/models/SkillEffectModel';
import { Logger } from '../../../../../shared/utils';

/**
 * 效果管理器
 * 负责效果的注册、查找和执行
 * 采用单例模式，全局唯一
 */
export class EffectManager {
  private static instance: EffectManager;
  private registry: EffectRegistry;
  private initialized: boolean = false;

  private constructor() {
    this.registry = EffectRegistry.getInstance();
  }

  /**
   * 获取单例
   */
  public static getInstance(): EffectManager {
    if (!EffectManager.instance) {
      EffectManager.instance = new EffectManager();
      // 不在这里初始化，等待所有效果类加载后再初始化
    }
    return EffectManager.instance;
  }

  /**
   * 初始化效果系统
   * 使用工厂自动创建和注册所有效果实现
   * 
   * 注意：这个方法应该在所有效果类被导入后调用
   */
  public initialize(): void {
    if (this.initialized) return;

    Logger.Info('[EffectManager] 初始化效果系统...');

    try {
      // 使用工厂自动创建所有效果
      const effects = EffectFactory.createAllEffects();
      
      // 验证效果
      const isValid = EffectFactory.validateEffects(effects);
      
      if (!isValid) {
        Logger.Warn('[EffectManager] 效果验证失败，但继续注册');
      }
      
      // 批量注册效果
      this.registry.registerBatch(effects);
      
      this.initialized = true;
      Logger.Info(`[EffectManager] 效果系统初始化完成，共注册 ${this.registry.getEffectCount()} 个效果`);
      
    } catch (error) {
      Logger.Error(`[EffectManager] 初始化效果系统失败: ${error}`);
      this.initialized = true; // 标记为已初始化，避免重复尝试
    }
  }

  /**
   * 执行效果
   * @param effectId 效果ID（从配置文件中的 Idx）
   * @param context 效果上下文
   * @param customArgs 自定义参数（覆盖配置中的参数）
   */
  public executeEffect(
    effectId: number,
    context: IEffectContext,
    customArgs?: string
  ): IEffectResult[] {
    // 获取效果配置
    const effectConfig = SkillEffectConfig.GetEffect(effectId);
    
    if (!effectConfig || effectConfig.eid === 0) {
      Logger.Debug(`[EffectManager] 效果不存在或无效: EffectId=${effectId}`);
      return [];
    }

    // 获取效果实现
    const effect = this.registry.getEffect(effectConfig.eid);
    
    if (!effect) {
      Logger.Warn(`[EffectManager] 未找到效果实现: Eid=${effectConfig.eid}, EffectId=${effectId}`);
      return [];
    }

    // 检查是否在正确的时机触发
    if (!effect.canTrigger(context.timing)) {
      Logger.Debug(`[EffectManager] 效果不在当前时机触发: Effect=${effect.getEffectName()}, Timing=${context.timing}`);
      return [];
    }

    // 解析效果参数
    const argsStr = customArgs || effectConfig.args;
    context.effectId = effectId;
    context.effectArgs = parseEffectArgs(argsStr);

    try {
      // 执行效果
      const results = effect.execute(context);
      
      // 记录结果
      context.results.push(...results);
      
      Logger.Debug(`[EffectManager] 执行效果: Effect=${effect.getEffectName()}, Results=${results.length}`);
      
      return results;
      
    } catch (error) {
      Logger.Error(`[EffectManager] 执行效果失败: Effect=${effect.getEffectName()}, Error=${error}`);
      return [];
    }
  }

  /**
   * 批量执行效果
   * @param effectIds 效果ID列表
   * @param context 效果上下文
   */
  public executeEffects(
    effectIds: number[],
    context: IEffectContext
  ): IEffectResult[] {
    const allResults: IEffectResult[] = [];
    
    for (const effectId of effectIds) {
      const results = this.executeEffect(effectId, context);
      allResults.push(...results);
    }
    
    return allResults;
  }

  /**
   * 在指定时机执行所有相关效果
   * @param timing 触发时机
   * @param attacker 攻击方
   * @param defender 防御方
   * @param skillId 技能ID
   * @param damage 伤害值
   */
  public executeEffectsAtTiming(
    timing: EffectTiming,
    attacker: IBattlePet,
    defender: IBattlePet,
    skillId: number,
    damage: number = 0
  ): IEffectResult[] {
    // 创建上下文
    const context = createEffectContext(attacker, defender, skillId, damage, timing);
    
    // 收集需要执行的效果
    const effectIds: number[] = [];
    
    // TODO: 从精灵的特性、状态、装备等收集效果ID
    // 这里需要根据实际的精灵数据结构来实现
    
    // 执行效果
    return this.executeEffects(effectIds, context);
  }

  /**
   * 获取效果注册表
   */
  public getRegistry(): EffectRegistry {
    return this.registry;
  }

  /**
   * 重新初始化
   */
  public reinitialize(): void {
    this.registry.clear();
    this.initialized = false;
    this.initialize();
  }
}

// 导出单例访问方法
export const effectManager = EffectManager.getInstance();
