import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

/**
 * 受击状态效果参数接口
 */
export interface IOnHitStatusParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'on_hit_status';
  /** 施加的状态ID */
  status: number;
  /** 触发概率（0-100） */
  probability: number;
  /** 状态持续回合数（可选） */
  duration?: number;
  /** 是否对攻击者施加（true=攻击者，false=自己） */
  toAttacker?: boolean;
  /** 是否仅在受到伤害时触发（可选，默认true） */
  onlyOnDamage?: boolean;
  /** 最小伤害阈值（可选，低于此伤害不触发） */
  minDamageThreshold?: number;
}

/**
 * 受击状态效果
 * 
 * 功能：
 * - 受到攻击时有概率对攻击者或自己施加异常状态
 * - 可以设置触发概率和状态持续时间
 * - 支持最小伤害阈值（低于阈值不触发）
 * - 可选择是否仅在受到伤害时触发
 * 
 * 使用场景：
 * - 静电（受到接触攻击时30%概率麻痹对手）
 * - 火焰之躯（受到接触攻击时30%概率灼伤对手）
 * - 毒刺（受到接触攻击时30%概率中毒对手）
 * - 诅咒之躯（受到攻击时有概率封印对手技能）
 * 
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "on_hit_status",
 *   "status": 2,
 *   "probability": 30,
 *   "duration": 3,
 *   "toAttacker": true,
 *   "onlyOnDamage": true,
 *   "minDamageThreshold": 1
 * }
 * ```
 * 
 * 与StatusInflictor的区别：
 * - StatusInflictor: 主动施加状态（攻击时）
 * - OnHitStatus: 被动触发状态（受击时）
 */
export class OnHitStatus extends BaseAtomicEffect {
  private status: number;
  private probability: number;
  private duration?: number;
  private toAttacker: boolean;
  private onlyOnDamage: boolean;
  private minDamageThreshold: number;

  constructor(params: IOnHitStatusParams) {
    super(
      AtomicEffectType.SPECIAL,
      'OnHitStatus',
      [EffectTiming.AFTER_DAMAGE_APPLY, EffectTiming.ON_ATTACKED]
    );

    this.status = params.status;
    this.probability = params.probability;
    this.duration = params.duration;
    this.toAttacker = params.toAttacker ?? true;
    this.onlyOnDamage = params.onlyOnDamage ?? true;
    this.minDamageThreshold = params.minDamageThreshold ?? 1;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];

    // 检查是否需要伤害触发
    if (this.onlyOnDamage) {
      const damage = context.damage ?? 0;
      if (damage < this.minDamageThreshold) {
        results.push(
          this.createResult(
            false,
            'both',
            'on_hit_status',
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
          'on_hit_status',
          `受击状态未触发`,
          0
        )
      );
      return results;
    }

    // 确定目标
    const target = this.toAttacker ? this.getAttacker(context) : this.getDefender(context);
    const targetName = this.toAttacker ? '攻击方' : '防御方';

    // 检查目标是否已有该状态
    if (this.hasStatus(target, this.status)) {
      results.push(
        this.createResult(
          false,
          this.toAttacker ? 'attacker' : 'defender',
          'on_hit_status',
          `${targetName}已经处于该状态`,
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
        this.toAttacker ? 'attacker' : 'defender',
        'on_hit_status',
        `${targetName}陷入了${this.getStatusName(this.status)}状态！`,
        this.status,
        {
          status: this.status,
          duration: this.duration,
          probability: this.probability
        }
      )
    );

    this.log(
      `受击触发状态: ${targetName}陷入${this.getStatusName(this.status)}` +
      `(概率${this.probability}%, 持续${this.duration ?? '永久'}回合)`
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
   * 将 OnHitStatus 的状态编号转换为 BattleStatusType 索引
   * OnHitStatus: 1=中毒 2=麻痹 3=冰冻 4=灼伤 5=睡眠 6=混乱 7=害怕 8=封印
   * BattleStatusType: 0=麻痹 1=中毒 2=烧伤 5=冻伤 6=害怕 8=睡眠 10=混乱
   */
  private convertStatusIndex(status: number): number {
    const mapping: { [key: number]: number } = {
      1: 1,   // 中毒 -> 1
      2: 0,   // 麻痹 -> 0
      3: 5,   // 冰冻 -> 5 (冻伤)
      4: 2,   // 灼伤 -> 2 (烧伤)
      5: 8,   // 睡眠 -> 8
      6: 10,  // 混乱 -> 10
      7: 6,   // 害怕 -> 6
      8: 9    // 封印 -> 9 (石化)
    };
    return mapping[status] ?? status;
  }
}
