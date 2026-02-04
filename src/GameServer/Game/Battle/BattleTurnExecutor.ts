/**
 * 战斗回合执行器
 * 负责执行完整的战斗回合逻辑
 * 
 * 移植自: luvit/luvit_version/game/seer_battle.lua (executeTurn)
 */

import { Logger } from '../../../shared/utils';
import { IBattleInfo, IBattlePet, IAttackResult, ITurnResult } from '../../../shared/models/BattleModel';
import { ISkillConfig } from '../../../shared/models/SkillModel';
import { BattleCore } from './BattleCore';
import { EffectTrigger } from './EffectTrigger';
import { EffectTiming } from './effects/core/EffectContext';
import { BattleEffectIntegration } from './BattleEffectIntegration';

/**
 * 战斗回合执行器类
 */
export class BattleTurnExecutor {

  /**
   * 执行一个完整的战斗回合
   * 
   * @param battle 战斗实例
   * @param playerSkillId 玩家选择的技能ID
   * @param skillConfigs 技能配置Map
   * @returns 回合结果
   */
  public static ExecuteTurn(
    battle: IBattleInfo,
    playerSkillId: number,
    skillConfigs: Map<number, ISkillConfig>
  ): ITurnResult {
    Logger.Info(`[BattleTurnExecutor] 回合 ${battle.turn}: 玩家使用技能 ${playerSkillId}`);
    Logger.Debug(`[BattleTurnExecutor] 玩家: HP=${battle.player.hp}/${battle.player.maxHp}, Speed=${battle.player.speed}`);
    Logger.Debug(`[BattleTurnExecutor] 敌人: HP=${battle.enemy.hp}/${battle.enemy.maxHp}, Speed=${battle.enemy.speed}`);

    // ==================== 回合开始效果 ====================
    const turnStartResults = BattleEffectIntegration.OnTurnStart(battle);
    Logger.Debug(`[BattleTurnExecutor] 回合开始效果: ${turnStartResults.length}个结果`);
    
    // 检查回合开始效果是否导致死亡
    if (battle.player.hp <= 0) {
      battle.isOver = true;
      return {
        isOver: true,
        winner: 0,
        reason: 0
      };
    }
    if (battle.enemy.hp <= 0) {
      battle.isOver = true;
      return {
        isOver: true,
        winner: battle.userId,
        reason: 0
      };
    }

    // 1. 获取技能配置
    const playerSkill = skillConfigs.get(playerSkillId) || this.GetDefaultSkill();
    Logger.Debug(`[BattleTurnExecutor] 玩家技能: ${playerSkill.name} (ID=${playerSkill.id})`);
    
    // 2. AI选择技能
    const enemySkillId = BattleCore.AISelectSkill(
      battle.enemy,
      battle.player,
      battle.enemy.skills,
      skillConfigs
    );
    const enemySkill = skillConfigs.get(enemySkillId) || this.GetDefaultSkill();
    Logger.Debug(`[BattleTurnExecutor] 敌人技能: ${enemySkill.name} (ID=${enemySkill.id})`);

    // 3. 处理回合开始时的状态效果
    const playerStatusDamage = BattleCore.ProcessStatusEffects(battle.player);
    const enemyStatusDamage = BattleCore.ProcessStatusEffects(battle.enemy);

    // 应用状态伤害
    if (playerStatusDamage > 0) {
      battle.player.hp = Math.max(0, battle.player.hp - playerStatusDamage);
      Logger.Info(`[状态伤害] 玩家受到 ${playerStatusDamage} 点状态伤害`);
    }
    if (enemyStatusDamage > 0) {
      battle.enemy.hp = Math.max(0, battle.enemy.hp - enemyStatusDamage);
      Logger.Info(`[状态伤害] 敌人受到 ${enemyStatusDamage} 点状态伤害`);
    }

    // 4. 触发回合开始时的技能效果（如果有持续性技能效果）
    // 注意：这里主要是状态效果，技能附加效果在攻击时触发
    // 但某些特殊效果可能需要在回合开始时检查
    this.ProcessTurnStartEffects(battle, playerSkill, enemySkill);

    // 检查状态伤害是否导致死亡
    if (battle.player.hp <= 0) {
      battle.isOver = true;
      return {
        isOver: true,
        winner: 0,
        reason: 0
      };
    }

    if (battle.enemy.hp <= 0) {
      battle.isOver = true;
      return {
        isOver: true,
        winner: battle.userId,
        reason: 0
      };
    }

    // 4. 检查是否可以行动
    const playerCanAct = BattleCore.CanAct(battle.player);
    const enemyCanAct = BattleCore.CanAct(battle.enemy);

    // ==================== 速度判定前效果 ====================
    const speedCheckResults = BattleEffectIntegration.OnBeforeSpeedCheck(
      battle.player,
      battle.enemy,
      playerSkill,
      enemySkill
    );
    Logger.Debug(`[BattleTurnExecutor] 速度判定前效果: ${speedCheckResults.length}个结果`);

    // 5. 决定先后攻
    const playerFirst = BattleCore.CompareSpeed(
      battle.player,
      battle.enemy,
      playerSkill,
      enemySkill
    );

    // 6. 执行攻击
    const result: ITurnResult = {
      isOver: false
    };

    if (playerFirst) {
      // 玩家先攻
      result.firstAttack = this.ExecuteAttack(
        battle,
        battle.player,
        battle.enemy,
        playerSkill,
        battle.userId,
        playerCanAct,
        true
      );

      // 检查敌人是否被击败
      if (battle.enemy.hp <= 0) {
        battle.isOver = true;
        result.isOver = true;
        result.winner = battle.userId;
        result.reason = 0;
      } else {
        // 敌人反击
        result.secondAttack = this.ExecuteAttack(
          battle,
          battle.enemy,
          battle.player,
          enemySkill,
          0,
          enemyCanAct,
          false
        );

        if (battle.player.hp <= 0) {
          battle.isOver = true;
          result.isOver = true;
          result.winner = 0;
          result.reason = 0;
        }
      }
    } else {
      // 敌人先攻
      result.firstAttack = this.ExecuteAttack(
        battle,
        battle.enemy,
        battle.player,
        enemySkill,
        0,
        enemyCanAct,
        true
      );

      // 检查玩家是否被击败
      if (battle.player.hp <= 0) {
        battle.isOver = true;
        result.isOver = true;
        result.winner = 0;
        result.reason = 0;
      } else {
        // 玩家反击
        result.secondAttack = this.ExecuteAttack(
          battle,
          battle.player,
          battle.enemy,
          playerSkill,
          battle.userId,
          playerCanAct,
          false
        );

        if (battle.enemy.hp <= 0) {
          battle.isOver = true;
          result.isOver = true;
          result.winner = battle.userId;
          result.reason = 0;
        }
      }
    }

    // ==================== 回合结束效果 ====================
    if (!result.isOver) {
      const turnEndResults = BattleEffectIntegration.OnTurnEnd(battle);
      Logger.Debug(`[BattleTurnExecutor] 回合结束效果: ${turnEndResults.length}个结果`);
      
      // 检查回合结束效果是否导致死亡
      if (battle.player.hp <= 0) {
        battle.isOver = true;
        result.isOver = true;
        result.winner = 0;
        result.reason = 0;
      } else if (battle.enemy.hp <= 0) {
        battle.isOver = true;
        result.isOver = true;
        result.winner = battle.userId;
        result.reason = 0;
      }
    }

    return result;
  }


  /**
   * 执行单次攻击
   */
  private static ExecuteAttack(
    battle: IBattleInfo,
    attacker: IBattlePet,
    defender: IBattlePet,
    skill: ISkillConfig,
    attackerUserId: number,
    canAct: { canAct: boolean; reason?: string },
    isFirst: boolean
  ): IAttackResult {
    // 如果无法行动，返回空攻击
    if (!canAct.canAct) {
      Logger.Info(`[攻击] ${attackerUserId === 0 ? '敌人' : '玩家'} 无法行动: ${canAct.reason}`);
      return {
        userId: attackerUserId,
        skillId: 0,
        atkTimes: 0,
        damage: 0,
        gainHp: 0,
        attackerRemainHp: attacker.hp,
        attackerMaxHp: attacker.maxHp,
        defenderRemainHp: defender.hp,
        defenderMaxHp: defender.maxHp,
        missed: false,
        blocked: false,
        isCrit: false,
        attackerStatus: attacker.statusArray || [],
        attackerBattleLv: attacker.battleLv || []
      };
    }

    // ==================== 攻击时效果 ====================
    const attackResults = BattleEffectIntegration.OnAttack(attacker, defender, skill);
    Logger.Debug(`[ExecuteAttack] 攻击时效果: ${attackResults.length}个结果`);

    // ==================== 技能使用前效果 ====================
    const beforeSkillResults = BattleEffectIntegration.OnBeforeSkill(attacker, defender, skill);
    Logger.Debug(`[ExecuteAttack] 技能使用前效果: ${beforeSkillResults.length}个结果`);

    // ==================== 命中判定前效果 ====================
    const beforeHitCheckResults = BattleEffectIntegration.OnBeforeHitCheck(attacker, defender, skill);
    Logger.Debug(`[ExecuteAttack] 命中判定前效果: ${beforeHitCheckResults.length}个结果`);

    // ==================== 命中判定 ====================
    const hit = BattleCore.CheckHit(attacker, defender, skill);
    
    // ==================== 命中判定后效果 ====================
    const afterHitCheckResults = BattleEffectIntegration.OnAfterHitCheck(attacker, defender, skill, hit);
    Logger.Debug(`[ExecuteAttack] 命中判定后效果: ${afterHitCheckResults.length}个结果`);
    
    if (!hit) {
      Logger.Info(`[攻击] 技能 ${skill.name} 未命中`);
      
      // ==================== 闪避效果 ====================
      const evadeResults = BattleEffectIntegration.OnEvade(attacker, defender, skill);
      Logger.Debug(`[ExecuteAttack] 闪避效果: ${evadeResults.length}个结果`);
      
      // 触发未命中后的效果
      const missEffects = EffectTrigger.TriggerSkillEffect(
        skill,
        attacker,
        defender,
        0,
        EffectTiming.AFTER_SKILL
      );
      EffectTrigger.ApplyEffectResults(missEffects, attacker, defender);
      
      return {
        userId: attackerUserId,
        skillId: skill.id,
        atkTimes: 0,
        damage: 0,
        gainHp: 0,
        attackerRemainHp: attacker.hp,
        attackerMaxHp: attacker.maxHp,
        defenderRemainHp: defender.hp,
        defenderMaxHp: defender.maxHp,
        missed: true,
        blocked: false,
        isCrit: false,
        attackerStatus: attacker.statusArray || [],
        attackerBattleLv: attacker.battleLv || []
      };
    }

    // ==================== 受到攻击时效果 ====================
    const attackedResults = BattleEffectIntegration.OnAttacked(attacker, defender, skill);
    Logger.Debug(`[ExecuteAttack] 受到攻击时效果: ${attackedResults.length}个结果`);

    // ==================== 暴击判定前效果 ====================
    const beforeCritCheckResults = BattleEffectIntegration.OnBeforeCritCheck(attacker, defender, skill);
    Logger.Debug(`[ExecuteAttack] 暴击判定前效果: ${beforeCritCheckResults.length}个结果`);

    // ==================== 暴击判定 ====================
    const isCrit = BattleCore.CheckCrit(attacker, defender, skill, isFirst);

    // ==================== 伤害计算前效果 ====================
    const beforeCalcResults = BattleEffectIntegration.OnBeforeDamageCalc(attacker, defender, skill);
    Logger.Debug(`[ExecuteAttack] 伤害计算前效果: ${beforeCalcResults.length}个结果`);

    // 检查是否有固定伤害效果
    const fixedDamageResult = beforeCalcResults.find(r => r.type === 'fixed_damage' && r.success);
    
    let damage = 0;
    
    if (fixedDamageResult && fixedDamageResult.value) {
      // 如果有固定伤害效果，使用固定伤害值
      damage = fixedDamageResult.value;
      Logger.Debug(`[ExecuteAttack] 使用固定伤害: ${damage}`);
    } else {
      // ==================== 伤害计算 ====================
      const damageResult = BattleCore.CalculateDamage(attacker, defender, skill, isCrit);
      damage = damageResult.damage;

      // ==================== 伤害计算后效果（伤害上限/下限）====================
      const afterCalcResult = BattleEffectIntegration.OnAfterDamageCalc(attacker, defender, skill, damage);
      damage = afterCalcResult.damage;
      Logger.Debug(`[ExecuteAttack] 伤害计算后: ${damage} (原始: ${damageResult.damage})`);
    }

    // ==================== 伤害应用前效果（伤害减免）====================
    const beforeApplyResult = BattleEffectIntegration.OnBeforeDamageApply(attacker, defender, skill, damage);
    damage = beforeApplyResult.damage;
    Logger.Debug(`[ExecuteAttack] 伤害应用前: ${damage}`);

    // ==================== 应用伤害 ====================
    const actualDamage = damage;
    const oldDefenderHP = defender.hp;
    defender.hp = Math.max(0, defender.hp - actualDamage);

    // ==================== HP变化时效果 ====================
    if (oldDefenderHP !== defender.hp) {
      const hpChangeResults = BattleEffectIntegration.OnHPChange(
        defender,
        attacker,
        oldDefenderHP,
        defender.hp
      );
      Logger.Debug(`[ExecuteAttack] HP变化效果: ${hpChangeResults.length}个结果`);
    }

    Logger.Info(
      `[攻击] ${attackerUserId === 0 ? '敌人' : '玩家'} 使用 ${skill.name}, ` +
      `造成 ${actualDamage} 点伤害${isCrit ? ' (暴击!)' : ''}, ` +
      `对方剩余HP: ${defender.hp}/${defender.maxHp}`
    );

    // ==================== 伤害应用后效果（吸血、反伤等）====================
    const afterApplyResults = BattleEffectIntegration.OnAfterDamageApply(attacker, defender, skill, actualDamage);
    Logger.Debug(`[ExecuteAttack] 伤害应用后效果: ${afterApplyResults.length}个结果`);

    // ==================== 受到伤害时效果 ====================
    const receiveDamageResults = BattleEffectIntegration.OnReceiveDamage(attacker, defender, skill, actualDamage);
    Logger.Debug(`[ExecuteAttack] 受到伤害效果: ${receiveDamageResults.length}个结果`);

    // ==================== 技能使用后效果（能力变化、状态施加等）====================
    const afterSkillResults = BattleEffectIntegration.OnAfterSkill(attacker, defender, skill, actualDamage);
    Logger.Debug(`[ExecuteAttack] 技能使用后效果: ${afterSkillResults.length}个结果`);

    // ==================== 击败效果 ====================
    if (defender.hp <= 0) {
      const koResults = BattleEffectIntegration.OnKO(attacker, defender, skill);
      Logger.Debug(`[ExecuteAttack] 击败效果: ${koResults.length}个结果`);
      
      // ==================== 击败对方后效果 ====================
      const afterKoResults = BattleEffectIntegration.OnAfterKO(attacker, defender, skill);
      Logger.Debug(`[ExecuteAttack] 击败对方后效果: ${afterKoResults.length}个结果`);
    }

    // ==================== 统计效果结果（吸血等）====================
    let gainHp = 0;
    const allResults = [
      ...afterApplyResults,
      ...receiveDamageResults,
      ...afterSkillResults
    ];
    
    for (const result of allResults) {
      if (result.success && (result.type === 'absorb' || result.type === 'heal') && result.value) {
        gainHp += result.value;
      }
    }

    // ==================== 返回攻击结果 ====================
    // 注意：attackerStatus 应该在所有效果应用后获取，以包含新施加的状态
    return {
      userId: attackerUserId,
      skillId: skill.id,
      atkTimes: 1,
      damage: actualDamage,
      gainHp,
      attackerRemainHp: attacker.hp,
      attackerMaxHp: attacker.maxHp,
      defenderRemainHp: defender.hp,  // 被攻击者的HP
      defenderMaxHp: defender.maxHp,  // 被攻击者的最大HP
      missed: false,
      blocked: false,
      isCrit,
      attackerStatus: attacker.statusArray || [],  // 攻击者的状态（在所有效果后）
      attackerBattleLv: attacker.battleLv || []
    };
  }

  /**
   * 获取默认技能（撞击）
   */
  private static GetDefaultSkill(): ISkillConfig {
    return {
      id: 10001,
      name: '撞击',
      category: 1,
      type: 8,
      power: 40,
      maxPP: 35,
      accuracy: 100,
      critRate: 1,
      priority: 0,
      mustHit: false
    };
  }

  /**
   * 处理回合开始时的效果
   * 包括：克制效果、愤怒效果等需要在回合开始检查的效果
   */
  private static ProcessTurnStartEffects(
    battle: IBattleInfo,
    playerSkill: ISkillConfig,
    enemySkill: ISkillConfig
  ): void {
    // 1. 检查玩家是否被克制（必须使用上次技能）
    if (battle.player.encore && battle.player.encoreTurns && battle.player.encoreTurns > 0) {
      battle.player.encoreTurns--;
      if (battle.player.encoreTurns <= 0) {
        battle.player.encore = false;
      }
      Logger.Info(`[回合开始] 玩家被克制，必须使用上次技能 (剩余${battle.player.encoreTurns}回合)`);
    }

    // 2. 检查敌人是否被克制
    if (battle.enemy.encore && battle.enemy.encoreTurns && battle.enemy.encoreTurns > 0) {
      battle.enemy.encoreTurns--;
      if (battle.enemy.encoreTurns <= 0) {
        battle.enemy.encore = false;
      }
      Logger.Info(`[回合开始] 敌人被克制，必须使用上次技能 (剩余${battle.enemy.encoreTurns}回合)`);
    }

    // 3. 触发回合开始时机的效果
    // 注意：大部分效果在 AFTER_DAMAGE_APPLY 触发，这里主要处理特殊情况
    const playerTurnStartEffects = EffectTrigger.TriggerSkillEffect(
      playerSkill,
      battle.player,
      battle.enemy,
      0,
      EffectTiming.TURN_START
    );

    const enemyTurnStartEffects = EffectTrigger.TriggerSkillEffect(
      enemySkill,
      battle.enemy,
      battle.player,
      0,
      EffectTiming.TURN_START
    );

    // 应用效果
    if (playerTurnStartEffects.length > 0) {
      EffectTrigger.ApplyEffectResults(playerTurnStartEffects, battle.player, battle.enemy);
    }
    if (enemyTurnStartEffects.length > 0) {
      EffectTrigger.ApplyEffectResults(enemyTurnStartEffects, battle.enemy, battle.player);
    }
  }

  /**
   * 处理回合结束时的效果
   * 包括：持续伤害、状态恢复等
   */
  private static ProcessTurnEndEffects(
    battle: IBattleInfo,
    playerSkill: ISkillConfig,
    enemySkill: ISkillConfig
  ): void {
    // 1. 触发回合结束时机的效果
    const playerTurnEndEffects = EffectTrigger.TriggerSkillEffect(
      playerSkill,
      battle.player,
      battle.enemy,
      0,
      EffectTiming.TURN_END
    );

    const enemyTurnEndEffects = EffectTrigger.TriggerSkillEffect(
      enemySkill,
      battle.enemy,
      battle.player,
      0,
      EffectTiming.TURN_END
    );

    // 应用效果
    if (playerTurnEndEffects.length > 0) {
      EffectTrigger.ApplyEffectResults(playerTurnEndEffects, battle.player, battle.enemy);
    }
    if (enemyTurnEndEffects.length > 0) {
      EffectTrigger.ApplyEffectResults(enemyTurnEndEffects, battle.enemy, battle.player);
    }

    // 2. 减少状态持续时间（已在ProcessStatusEffects中处理）
    // 这里可以添加额外的回合结束逻辑
    Logger.Debug(`[回合结束] 回合 ${battle.turn} 结束效果处理完成`);
  }
}
