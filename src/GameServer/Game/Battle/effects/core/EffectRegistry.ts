import { BaseEffect } from './BaseEffect';
import { SkillEffectType } from '../../../../../shared/models/SkillEffectModel';
import { Logger } from '../../../../../shared/utils';

/**
 * 效果注册表
 * 管理所有效果实例，提供效果查找和注册功能
 */
export class EffectRegistry {
  private static instance: EffectRegistry;
  private effects: Map<number, BaseEffect>;

  private constructor() {
    this.effects = new Map();
  }

  /**
   * 获取单例
   */
  public static getInstance(): EffectRegistry {
    if (!EffectRegistry.instance) {
      EffectRegistry.instance = new EffectRegistry();
    }
    return EffectRegistry.instance;
  }

  /**
   * 注册效果
   */
  public register(effect: BaseEffect): void {
    const effectId = effect.getEffectId();
    
    if (this.effects.has(effectId)) {
      Logger.Warn(`[EffectRegistry] 效果ID ${effectId} 已存在，将被覆盖`);
    }
    
    this.effects.set(effectId, effect);
    Logger.Debug(`[EffectRegistry] 注册效果: ID=${effectId}, Name=${effect.getEffectName()}`);
  }

  /**
   * 批量注册效果
   */
  public registerBatch(effects: BaseEffect[]): void {
    for (const effect of effects) {
      this.register(effect);
    }
    Logger.Info(`[EffectRegistry] 批量注册 ${effects.length} 个效果`);
  }

  /**
   * 获取效果
   */
  public getEffect(effectId: number): BaseEffect | undefined {
    return this.effects.get(effectId);
  }

  /**
   * 检查效果是否存在
   */
  public hasEffect(effectId: number): boolean {
    return this.effects.has(effectId);
  }

  /**
   * 获取所有效果
   */
  public getAllEffects(): BaseEffect[] {
    return Array.from(this.effects.values());
  }

  /**
   * 获取效果数量
   */
  public getEffectCount(): number {
    return this.effects.size;
  }

  /**
   * 清空注册表
   */
  public clear(): void {
    this.effects.clear();
    Logger.Info('[EffectRegistry] 清空效果注册表');
  }

  /**
   * 获取效果类型名称
   */
  public static getEffectTypeName(eid: number): string {
    const names: { [key: number]: string } = {
      [SkillEffectType.NONE]: '无效果',
      [SkillEffectType.ABSORB]: '吸血',
      [SkillEffectType.STAT_DOWN]: '降低能力',
      [SkillEffectType.STAT_UP]: '提升能力',
      [SkillEffectType.STAT_UP_2]: '提升能力2',
      [SkillEffectType.STAT_DOWN_2]: '降低能力2',
      [SkillEffectType.RECOIL]: '反伤',
      [SkillEffectType.HP_EQUAL]: '同生共死',
      [SkillEffectType.MERCY]: '手下留情',
      [SkillEffectType.RAGE]: '愤怒',
      [SkillEffectType.PARALYSIS]: '麻痹',
      [SkillEffectType.BIND]: '束缚',
      [SkillEffectType.BURN]: '烧伤',
      [SkillEffectType.POISON]: '中毒',
      [SkillEffectType.BIND_2]: '束缚2',
      [SkillEffectType.FLINCH]: '畏缩',
      [SkillEffectType.FREEZE]: '冻伤',
      [SkillEffectType.SLEEP]: '睡眠',
      [SkillEffectType.FEAR]: '害怕',
      [SkillEffectType.CONFUSION]: '混乱',
      [SkillEffectType.FATIGUE]: '疲惫',
      [SkillEffectType.FLINCH_2]: '畏缩2',
      [SkillEffectType.MULTI_HIT]: '连续攻击',
      [SkillEffectType.PP_REDUCE]: '消化不良',
      [SkillEffectType.ENCORE]: '克制',
      [SkillEffectType.PUNISHMENT]: '惩罚'
    };
    
    return names[eid] || `未知效果(${eid})`;
  }
}
