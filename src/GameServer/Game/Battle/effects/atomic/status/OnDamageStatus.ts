import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

/**
 * 攻击附带状态效果参数接口
 */
export interface IOnDamageStatusParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'on_damage_status';
  /** 施加的状态ID */
  status: number;
  /** 触发概率（0-100） */
  probability: number;
  /** 状态持续回合数（可选） */
  duration?: number;
  /** 是否仅在造成伤害时触发（可选，默认true） */
  onlyOnDamage?: boolean;
  /** 最小伤害阈值（可选，低于此伤害不触发） */
  minDamageThreshold?: number;
  /** 是否仅对特定技能类别生效（可选：physical/special/status） */
  skillCategory?: 'physical' | 'special' | 'status';
}

/**
 * 攻击附带状态效果
 * 
 * 功能：
 * - 攻击对手时有概率施加异常状态
 * - 可以设置触发概率和状态持续时间
 * - 支持最小伤害阈值（低于阈值不触发）
 * - 可以限制特定技能类别才能触发
 * 
 * 使用场景：
 * - 火焰拳（攻击时10%概率灼伤）
 * - 雷电拳（攻击时10%概率麻痹）
 * - 冰冻拳（攻击时10%概率冰冻）
 * - 毒针（攻击时30%概率中毒）
 * - 舌舔（攻击时30%概率麻痹）
 * 
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "on_damage_status",
 *   "status": 4,
 *   "probability": 10,
 *   "duration": 3,
 *   "onlyOnDamage": true,
 *   "minDamageThreshold": 1,
 *   "skillCategory": "physical"
 * }
 * ```
 * 
 * 与StatusInflictor的区别：
 * - StatusInflictor: 必定施加状态（或固定概率）
 * - OnDamageStatus: 攻击附带状态，通常概率较低，需要造成伤害
 * 
 * 与OnHitStatus的区别：
 * - OnHitStatus: 被动触发（受击时）
 * - OnDamageStatus: 主动触发（攻击时）
 */
export class OnDamageStatus extends BaseAtomicEffect {
  private status: number;
  private probability: number;
  private duration?: number;
  private onlyOnDamage: boolean;
  private minDamageThreshold: number;
  private skillCategory?: 'physical' | 'special' | 'status';

  constructor(params: IOnDamageStatusParams) {
    super(
      AtomicEffectType.SPECIAL,
      'OnDamageStatus',
      [EffectTiming.AFTER_DAMAGE_APPLY, EffectTiming.ON_ATTACKED]
    );

    this.status = params.status;
    this.probability = params.probability;
    this.duration = params.duration;
    this.onlyOnDamage = params.onlyOnDamage ?? true;
    this.minDamageThreshold = params.minDamageThreshold ?? 1;
    this.skillCategory = params.skillCategory;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];

    // 检查技能类别
    if (this.skillCategory && context.skillCategory) {
      if (context.skillCategory !== this.getSkillCategoryValue(this.skillCategory)) {
        results.push(
          this.createResult(
            false,
            'both',
            'on_damage_status',
            `技能类别不匹配，未触发状态`,
            0
          )
        );
        return results;
      }
    }

    // 检查是否需要伤害触发
    if (this.onlyOnDamage) {
      const damage = context.damage ?? 0;
      if (damage < this.minDamageThreshold) {
        results.push(
          this.createResult(
            false,
            'both',
            'on_damage_status',
            `伤害不足，未触发状态`,
            0
          )
        );
        return results;
      }
    }

    // 概率判断
    if (!this.checkProbability(this.probability)) {
      results.push(
        this.createResult(
          false,
          'both',
          'on_damage_status',
          `攻击附带状态未触发`,
          0
        )
      );
      return results;
    }

    // 目标是防御方
    const target = this.getDefender(context);

    // 检查目标是否已有该状态
    if (this.hasStatus(target, this.status)) {
      results.push(
        this.createResult(
          false,
          'defender',
          'on_damage_status',
          `对手已经处于该状态`,
          0
        )
      );
      return results;
    }

    // 施加状态
    this.applyStatus(target, this.status, this.duration);

    results.push(
      this.createResult(
        true,
        'defender',
        'on_damage_status',
        `对手陷入了${this.getStatusName(this.status)}状态！`,
        this.status,
        {
          status: this.status,
          duration: this.duration,
          probability: this.probability,
          damage: context.damage
        }
      )
    );

    this.log(
      `攻击附带状态: 对手陷入${this.getStatusName(this.status)}` +
      `(概率${this.probability}%, 伤害${context.damage ?? 0}, 持续${this.duration ?? '永久'}回合)`
    );

    return results;
  }

  public validate(params: any): boolean {
    if (params.status === undefined || params.status < 0) {
      this.log('status必须是有效的状态ID', 'error');
      return false;
    }
    if (params.probability === undefined || params.probability < 0 || params.probability > 100) {
      this.log('probability必须在0-100之间', 'error');
      return false;
    }
    if (params.skillCategory && !['physical', 'special', 'status'].includes(params.skillCategory)) {
      this.log('skillCategory必须是physical、special或status', 'error');
      return false;
    }
    return true;
  }

  /**
   * 检查目标是否已有指定状态
   */
  private hasStatus(pet: any, status: number): boolean {
    if (!pet.status && !pet.battleStatus) return false;
    const currentStatus = pet.status ?? pet.battleStatus;
    return currentStatus === status;
  }

  /**
   * 施加状态
   */
  private applyStatus(pet: any, status: number, duration?: number): void {
    // 转换状态编号为 BattleStatusType 索引
    const convertedStatus = this.convertStatusIndex(status);
    
    if (pet.status !== undefined) {
      pet.status = convertedStatus;
    }
    if (pet.battleStatus !== undefined) {
      pet.battleStatus = convertedStatus;
    }

    // 设置状态持续时间（使用转换后的索引）
    if (duration !== undefined) {
      if (!pet.statusDurations) {
        pet.statusDurations = {};
      }
      pet.statusDurations[convertedStatus] = duration;
    }
  }

  /**
   * 获取状态名称
   */
  private getStatusName(status: number): string {
    const statusNames: { [key: number]: string } = {
      1: '中毒', 2: '麻痹', 3: '冰冻', 4: '灼伤', 5: '睡眠', 6: '混乱', 7: '害怕', 8: '封印'
    };
    return statusNames[status] ?? `状态${status}`;
  }

  /**
   * 将 OnDamageStatus 的状态编号转换为 BattleStatusType 索引
   */
  private convertStatusIndex(status: number): number {
    const mapping: { [key: number]: number } = {
      1: 1, 2: 0, 3: 5, 4: 2, 5: 8, 6: 10, 7: 6, 8: 9
    };
    return mapping[status] ?? status;
  }

  /**
   * 获取技能类别数值
   */
  private getSkillCategoryValue(category: 'physical' | 'special' | 'status'): number {
    const categoryMap: { [key: string]: number } = {
      'physical': 1,
      'special': 2,
      'status': 3
    };
    return categoryMap[category] ?? 1;
  }
}
