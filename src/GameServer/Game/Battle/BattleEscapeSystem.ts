/**
 * 战斗逃跑系统
 * 实现逃跑逻辑，包括逃跑成功率计算、逃跑限制等
 * 
 * 移植自: luvit/luvit_version/game/seer_battle.lua (逃跑相关逻辑)
 * 参考: 前端 FightToolBar.as (逃跑按钮)
 */

import { Logger } from '../../../shared/utils';
import { IBattleInfo, IBattlePet } from '../../../shared/models/BattleModel';

/**
 * 逃跑结果
 */
export interface IEscapeResult {
  success: boolean;      // 是否成功
  escapeRate: number;    // 逃跑成功率
  attempts: number;      // 尝试次数
  message: string;       // 结果消息
  canRetry: boolean;     // 是否可以重试
}

/**
 * 逃跑限制类型
 */
export enum EscapeRestriction {
  NONE = 0,              // 无限制
  BOSS_BATTLE = 1,       // BOSS战斗
  TRAPPED = 2,           // 被束缚/困住
  SPECIAL_BATTLE = 3,    // 特殊战斗
  MAX_ATTEMPTS = 4       // 达到最大尝试次数
}

/**
 * 逃跑系统类
 */
export class BattleEscapeSystem {
  // 最大逃跑尝试次数
  private static readonly MAX_ESCAPE_ATTEMPTS = 3;

  /**
   * 尝试逃跑
   * 
   * 逃跑成功率公式 (参考宝可梦):
   * - 基础成功率 = (玩家速度 * 128) / (敌人速度 + 1) + 30 * 尝试次数
   * - 如果基础成功率 >= 256，则必定成功
   * - 否则，随机数 < (基础成功率 / 256) 则成功
   * 
   * @param battle 战斗实例
   * @param escapeAttempts 已尝试次数
   * @returns 逃跑结果
   */
  public static AttemptEscape(
    battle: IBattleInfo,
    escapeAttempts: number = 0
  ): IEscapeResult {
    // 检查逃跑限制
    const restriction = this.CheckEscapeRestriction(battle, escapeAttempts);
    if (restriction !== EscapeRestriction.NONE) {
      return {
        success: false,
        escapeRate: 0,
        attempts: escapeAttempts + 1,
        message: this.GetRestrictionMessage(restriction),
        canRetry: restriction !== EscapeRestriction.BOSS_BATTLE && 
                  restriction !== EscapeRestriction.SPECIAL_BATTLE
      };
    }

    // 计算逃跑成功率
    const playerSpeed = this.GetEffectiveSpeed(battle.player);
    const enemySpeed = this.GetEffectiveSpeed(battle.enemy);

    // 基础成功率计算
    let baseRate = Math.floor((playerSpeed * 128) / (enemySpeed + 1)) + 30 * escapeAttempts;
    
    // 限制在0-256之间
    baseRate = Math.max(0, Math.min(256, baseRate));

    // 计算百分比
    const escapeRate = (baseRate / 256) * 100;

    // 判定是否成功
    const success = baseRate >= 256 || Math.random() < (baseRate / 256);

    Logger.Info(
      `[逃跑系统] 逃跑${success ? '成功' : '失败'}: ` +
      `成功率=${escapeRate.toFixed(2)}%, ` +
      `玩家速度=${playerSpeed}, ` +
      `敌人速度=${enemySpeed}, ` +
      `尝试次数=${escapeAttempts + 1}`
    );

    return {
      success,
      escapeRate,
      attempts: escapeAttempts + 1,
      message: success ? '成功逃跑！' : '逃跑失败！',
      canRetry: !success && escapeAttempts + 1 < this.MAX_ESCAPE_ATTEMPTS
    };
  }

  /**
   * 检查逃跑限制
   */
  private static CheckEscapeRestriction(
    battle: IBattleInfo,
    escapeAttempts: number
  ): EscapeRestriction {
    // 检查是否是BOSS战斗
    if (battle.battleType === 'BOSS') {
      return EscapeRestriction.BOSS_BATTLE;
    }

    // 检查玩家是否被束缚
    if (battle.player.bound || battle.player.boundTurns && battle.player.boundTurns > 0) {
      return EscapeRestriction.TRAPPED;
    }

    // 检查是否达到最大尝试次数
    if (escapeAttempts >= this.MAX_ESCAPE_ATTEMPTS) {
      return EscapeRestriction.MAX_ATTEMPTS;
    }

    // 检查是否是特殊战斗（可以通过战斗标志判断）
    // 暂时没有特殊战斗标志，返回无限制
    
    return EscapeRestriction.NONE;
  }

  /**
   * 获取限制消息
   */
  private static GetRestrictionMessage(restriction: EscapeRestriction): string {
    const messages: { [key in EscapeRestriction]: string } = {
      [EscapeRestriction.NONE]: '',
      [EscapeRestriction.BOSS_BATTLE]: 'BOSS战斗无法逃跑！',
      [EscapeRestriction.TRAPPED]: '被束缚状态无法逃跑！',
      [EscapeRestriction.SPECIAL_BATTLE]: '特殊战斗无法逃跑！',
      [EscapeRestriction.MAX_ATTEMPTS]: '已达到最大逃跑尝试次数！'
    };
    return messages[restriction] || '无法逃跑！';
  }

  /**
   * 获取有效速度
   * 考虑能力等级和状态效果
   */
  private static GetEffectiveSpeed(pet: IBattlePet): number {
    let speed = pet.speed;

    // 应用能力等级修正
    if (pet.battleLv && pet.battleLv[4] !== undefined) {
      const speedStage = pet.battleLv[4];
      const multiplier = this.GetStageMultiplier(speedStage);
      speed = Math.floor(speed * multiplier);
    }

    // 麻痹状态速度减半
    if (pet.statusDurations && pet.statusDurations[0] > 0) { // 0 = 麻痹
      speed = Math.floor(speed / 2);
    }

    return Math.max(1, speed);
  }

  /**
   * 获取能力等级倍率
   */
  private static GetStageMultiplier(stage: number): number {
    const multipliers: { [key: number]: number } = {
      [-6]: 2/8, [-5]: 2/7, [-4]: 2/6, [-3]: 2/5, [-2]: 2/4, [-1]: 2/3,
      [0]: 1,
      [1]: 3/2, [2]: 4/2, [3]: 5/2, [4]: 6/2, [5]: 7/2, [6]: 8/2
    };
    return multipliers[stage] || 1;
  }

  /**
   * 计算推荐逃跑时机
   * 返回当前是否是逃跑的好时机
   */
  public static IsGoodTimeToEscape(battle: IBattleInfo): {
    isGood: boolean;
    reason: string;
    escapeRate: number;
  } {
    const playerSpeed = this.GetEffectiveSpeed(battle.player);
    const enemySpeed = this.GetEffectiveSpeed(battle.enemy);
    const baseRate = Math.floor((playerSpeed * 128) / (enemySpeed + 1));
    const escapeRate = (baseRate / 256) * 100;

    // 判断是否是好时机
    const isGood = escapeRate >= 50 || battle.player.hp < battle.player.maxHp * 0.3;

    let reason = '';
    if (escapeRate >= 80) {
      reason = '逃跑成功率很高！';
    } else if (escapeRate >= 50) {
      reason = '逃跑成功率较高';
    } else if (battle.player.hp < battle.player.maxHp * 0.3) {
      reason = 'HP过低，建议逃跑！';
    } else {
      reason = '逃跑成功率较低，建议继续战斗';
    }

    return {
      isGood,
      reason,
      escapeRate
    };
  }

  /**
   * 检查是否可以逃跑
   */
  public static CanEscape(battle: IBattleInfo, escapeAttempts: number = 0): {
    canEscape: boolean;
    reason?: string;
  } {
    const restriction = this.CheckEscapeRestriction(battle, escapeAttempts);
    
    if (restriction !== EscapeRestriction.NONE) {
      return {
        canEscape: false,
        reason: this.GetRestrictionMessage(restriction)
      };
    }

    return {
      canEscape: true
    };
  }

  /**
   * 获取逃跑惩罚
   * 逃跑可能会有一些惩罚，如失去经验、金币等
   */
  public static GetEscapePenalty(battle: IBattleInfo): {
    expLoss: number;
    coinLoss: number;
  } {
    // 简化：逃跑不扣除经验和金币
    // 实际游戏中可能会有惩罚
    return {
      expLoss: 0,
      coinLoss: 0
    };
  }

  /**
   * 计算逃跑冷却时间
   * 防止玩家频繁尝试逃跑
   */
  public static GetEscapeCooldown(escapeAttempts: number): number {
    // 每次失败后增加1秒冷却
    return escapeAttempts * 1000; // 毫秒
  }

  /**
   * 获取逃跑成功率描述
   */
  public static GetEscapeRateDescription(escapeRate: number): string {
    if (escapeRate >= 90) {
      return '非常容易';
    } else if (escapeRate >= 70) {
      return '容易';
    } else if (escapeRate >= 50) {
      return '普通';
    } else if (escapeRate >= 30) {
      return '困难';
    } else {
      return '非常困难';
    }
  }

  /**
   * 模拟逃跑动画时间
   */
  public static GetEscapeAnimationDuration(): number {
    return 2000; // 2秒
  }

  /**
   * 野生精灵逃跑判定
   * 某些野生精灵可能会主动逃跑
   */
  public static WildPetEscape(enemy: IBattlePet, turn: number): boolean {
    // 如果战斗持续太久，野生精灵可能逃跑
    if (turn > 20) {
      // 每回合5%几率逃跑
      return Math.random() < 0.05;
    }

    // HP过低时可能逃跑
    const hpRatio = enemy.hp / enemy.maxHp;
    if (hpRatio < 0.2) {
      // HP低于20%时，10%几率逃跑
      return Math.random() < 0.1;
    }

    return false;
  }
}
