/**
 * BOSS特殊规则系统
 * 从配置文件读取并应用BOSS特殊规则
 * 包括：顺序破防、特殊击杀条件、周几出现规则等
 */

import { Logger } from '../../../shared/utils';
import { BossAbilityConfig } from './BossAbility/BossAbilityConfig';
import { IBattlePet } from '../../../shared/models/BattleModel';
import { ISkillConfig } from '../../../shared/models/SkillModel';

/**
 * BOSS特殊规则管理器
 */
export class BossSpecialRules {
  // 顺序破防状态跟踪 (petId -> 当前阶段)
  private static sequentialBreakPhases: Map<number, number> = new Map();

  // 特殊击杀条件状态跟踪 (petId -> 是否已破防)
  private static specialKillBroken: Map<number, boolean> = new Map();

  /**
   * 重置战斗状态（战斗开始时调用）
   */
  public static ResetBattleState(petId: number): void {
    this.sequentialBreakPhases.delete(petId);
    this.specialKillBroken.delete(petId);
  }

  /**
   * 应用顺序破防规则（在伤害计算后调用）
   * @param defenderId 防御方精灵ID
   * @param skillType 技能属性类型
   * @param damage 原始伤害
   * @returns 修正后的伤害
   */
  public static ApplySequentialTypeBreak(
    defenderId: number,
    skillType: number,
    damage: number
  ): { damage: number; phaseAdvanced: boolean; requiredType?: number } {
    // 检查是否为顺序破防BOSS
    if (!BossAbilityConfig.Instance.IsSequentialTypeBreakBoss(defenderId)) {
      return { damage, phaseAdvanced: false };
    }

    // 获取当前阶段
    const currentPhase = this.sequentialBreakPhases.get(defenderId) || 0;

    // 获取当前阶段所需的属性类型
    const requiredType = BossAbilityConfig.Instance.GetSequentialTypeBreakRequiredType(defenderId, currentPhase);

    if (requiredType === undefined) {
      Logger.Warn(`[BossSpecialRules] 顺序破防BOSS ${defenderId} 配置错误`);
      return { damage, phaseAdvanced: false };
    }

    // 检查技能属性是否匹配
    if (skillType === requiredType) {
      // 属性匹配，进入下一阶段
      const rule = BossAbilityConfig.Instance.GetSequentialTypeBreakRule(defenderId);
      const nextPhase = (currentPhase + 1) % (rule?.typeSequence.length || 3);
      this.sequentialBreakPhases.set(defenderId, nextPhase);

      Logger.Info(
        `[BossSpecialRules] 顺序破防成功: BOSS=${defenderId}, ` +
        `当前阶段=${currentPhase}, 所需属性=${requiredType}, ` +
        `技能属性=${skillType}, 下一阶段=${nextPhase}`
      );

      return { damage, phaseAdvanced: true, requiredType };
    } else {
      // 属性不匹配，伤害为0
      Logger.Info(
        `[BossSpecialRules] 顺序破防失败: BOSS=${defenderId}, ` +
        `当前阶段=${currentPhase}, 所需属性=${requiredType}, ` +
        `技能属性=${skillType}, 伤害归零`
      );

      return { damage: 0, phaseAdvanced: false, requiredType };
    }
  }

  /**
   * 应用特殊击杀条件规则（在伤害计算后调用）
   * @param defenderId 防御方精灵ID
   * @param attackerId 攻击方精灵ID
   * @param skillId 技能ID
   * @param damage 原始伤害
   * @param defenderCurrentHP 防御方当前HP
   * @returns 修正后的伤害
   */
  public static ApplySpecialKillCondition(
    defenderId: number,
    attackerId: number,
    skillId: number,
    damage: number,
    defenderCurrentHP: number
  ): { damage: number; broken: boolean; protected: boolean } {
    // 检查是否为特殊击杀条件BOSS
    if (!BossAbilityConfig.Instance.IsSpecialKillConditionBoss(defenderId)) {
      return { damage, broken: false, protected: false };
    }

    const rule = BossAbilityConfig.Instance.GetSpecialKillConditionRule(defenderId);
    if (!rule) {
      return { damage, broken: false, protected: false };
    }

    const isBroken = this.specialKillBroken.get(defenderId) || false;

    // 如果使用破防技能
    if (skillId === rule.breakSkillId) {
      // 标记为已破防
      this.specialKillBroken.set(defenderId, true);

      // 如果伤害会击杀，保留1血
      if (damage >= defenderCurrentHP) {
        Logger.Info(
          `[BossSpecialRules] 特殊击杀条件-破防: BOSS=${defenderId}, ` +
          `技能=${skillId}(${rule.breakSkillName}), 保留1血`
        );
        return { damage: defenderCurrentHP - 1, broken: true, protected: true };
      }

      Logger.Info(
        `[BossSpecialRules] 特殊击杀条件-破防: BOSS=${defenderId}, ` +
        `技能=${skillId}(${rule.breakSkillName})`
      );
      return { damage, broken: true, protected: false };
    }

    // 如果已破防且当前HP为1
    if (isBroken && defenderCurrentHP === 1) {
      // 检查是否为击杀技能且使用正确的精灵
      if (skillId === rule.killSkillId && attackerId === rule.requiredPetId) {
        Logger.Info(
          `[BossSpecialRules] 特殊击杀条件-击杀: BOSS=${defenderId}, ` +
          `技能=${skillId}(${rule.killSkillName}), ` +
          `精灵=${attackerId}(${rule.requiredPetName})`
        );
        return { damage, broken: true, protected: false };
      } else {
        // 其他技能无法击杀
        Logger.Info(
          `[BossSpecialRules] 特殊击杀条件-保护: BOSS=${defenderId}, ` +
          `当前HP=1, 需要${rule.requiredPetName}的${rule.killSkillName}, ` +
          `实际技能=${skillId}, 实际精灵=${attackerId}`
        );
        return { damage: 0, broken: true, protected: true };
      }
    }

    return { damage, broken: isBroken, protected: false };
  }

  /**
   * 验证周几出现规则的挑战条件（在战斗结束时调用）
   * @param defenderId 防御方精灵ID
   * @param mapId 当前地图ID
   * @param roundCount 战斗回合数
   * @param isCriticalHit 是否致命一击击败
   * @returns 是否满足挑战条件
   */
  public static ValidateWeekdayScheduleCondition(
    defenderId: number,
    mapId: number,
    roundCount: number,
    isCriticalHit: boolean
  ): { valid: boolean; condition?: string; conditionDesc?: string } {
    // 检查是否为周几出现规则BOSS
    if (!BossAbilityConfig.Instance.IsWeekdayScheduleBoss(defenderId)) {
      return { valid: true }; // 不是周几规则BOSS，默认通过
    }

    // 获取当前周几
    const now = new Date();
    const weekday = now.getDay(); // 0=周日, 1=周一, ..., 6=周六

    // 获取当前周几的规则
    const schedule = BossAbilityConfig.Instance.GetWeekdayScheduleByWeekday(defenderId, weekday);
    if (!schedule) {
      Logger.Warn(
        `[BossSpecialRules] 周几出现规则: BOSS=${defenderId}, ` +
        `周几=${weekday}, 未找到对应规则`
      );
      return { valid: false };
    }

    // 检查地图是否匹配
    if (schedule.mapId !== mapId) {
      Logger.Info(
        `[BossSpecialRules] 周几出现规则-地图不匹配: BOSS=${defenderId}, ` +
        `周几=${weekday}, 期望地图=${schedule.mapId}(${schedule.mapName}), ` +
        `实际地图=${mapId}`
      );
      return { valid: false, condition: schedule.condition, conditionDesc: schedule.conditionDesc };
    }

    // 验证挑战条件
    let conditionMet = false;
    switch (schedule.condition) {
      case 'criticalHit':
        // 致命一击击败
        conditionMet = isCriticalHit;
        break;

      case 'withinRounds':
        // N回合内击败
        conditionMet = roundCount <= (schedule.conditionValue || 2);
        break;

      case 'afterRounds':
        // N回合后击败
        conditionMet = roundCount > (schedule.conditionValue || 10);
        break;

      default:
        Logger.Warn(
          `[BossSpecialRules] 周几出现规则-未知条件类型: ${schedule.condition}`
        );
        conditionMet = false;
    }

    Logger.Info(
      `[BossSpecialRules] 周几出现规则验证: BOSS=${defenderId}, ` +
      `周几=${weekday}, 地图=${schedule.mapName}, ` +
      `条件=${schedule.conditionDesc}, 回合数=${roundCount}, ` +
      `致命一击=${isCriticalHit}, 结果=${conditionMet ? '通过' : '失败'}`
    );

    return {
      valid: conditionMet,
      condition: schedule.condition,
      conditionDesc: schedule.conditionDesc
    };
  }

  /**
   * 获取顺序破防BOSS的当前阶段信息（用于客户端显示）
   * @param petId 精灵ID
   * @returns 当前阶段和所需属性类型
   */
  public static GetSequentialBreakPhaseInfo(petId: number): {
    currentPhase: number;
    requiredType?: number;
    typeName?: string;
  } | undefined {
    if (!BossAbilityConfig.Instance.IsSequentialTypeBreakBoss(petId)) {
      return undefined;
    }

    const currentPhase = this.sequentialBreakPhases.get(petId) || 0;
    const requiredType = BossAbilityConfig.Instance.GetSequentialTypeBreakRequiredType(petId, currentPhase);
    const rule = BossAbilityConfig.Instance.GetSequentialTypeBreakRule(petId);

    return {
      currentPhase,
      requiredType,
      typeName: rule?.typeNames[currentPhase % (rule.typeNames.length || 3)]
    };
  }

  /**
   * 获取特殊击杀条件BOSS的状态（用于客户端显示）
   * @param petId 精灵ID
   * @returns 是否已破防
   */
  public static GetSpecialKillConditionStatus(petId: number): {
    isBroken: boolean;
    rule?: any;
  } | undefined {
    if (!BossAbilityConfig.Instance.IsSpecialKillConditionBoss(petId)) {
      return undefined;
    }

    const isBroken = this.specialKillBroken.get(petId) || false;
    const rule = BossAbilityConfig.Instance.GetSpecialKillConditionRule(petId);

    return { isBroken, rule };
  }
}
