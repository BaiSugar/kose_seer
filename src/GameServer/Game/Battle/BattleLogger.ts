/**
 * 战斗日志系统
 * 记录战斗过程中的所有事件，用于调试和回放
 * 
 * 移植自: luvit/luvit_version/game/seer_battle.lua (battle.log)
 */

import { Logger } from '../../../shared/utils';
import { IBattleInfo, IBattlePet, IAttackResult } from '../../../shared/models/BattleModel';
import { ISkillConfig } from '../../../shared/models/SkillModel';

/**
 * 战斗日志条目类型
 */
export enum BattleLogType {
  BATTLE_START = 'battle_start',
  TURN_START = 'turn_start',
  STATUS_DAMAGE = 'status_damage',
  CANNOT_ACT = 'cannot_act',
  ATTACK = 'attack',
  DAMAGE = 'damage',
  HEAL = 'heal',
  STAT_CHANGE = 'stat_change',
  STATUS_APPLY = 'status_apply',
  EFFECT_TRIGGER = 'effect_trigger',
  TURN_END = 'turn_end',
  BATTLE_END = 'battle_end'
}

/**
 * 战斗日志条目
 */
export interface IBattleLogEntry {
  turn: number;
  timestamp: number;
  type: BattleLogType;
  data: any;
  message: string;
}

/**
 * 战斗日志管理器
 */
export class BattleLogger {
  private logs: IBattleLogEntry[] = [];
  private battleId: number;
  private userId: number;

  constructor(battleId: number, userId: number) {
    this.battleId = battleId;
    this.userId = userId;
  }

  /**
   * 记录战斗开始
   */
  public LogBattleStart(player: IBattlePet, enemy: IBattlePet): void {
    this.AddLog(0, BattleLogType.BATTLE_START, {
      player: {
        id: player.id,
        name: player.name,
        level: player.level,
        hp: player.hp,
        maxHp: player.maxHp
      },
      enemy: {
        id: enemy.id,
        name: enemy.name,
        level: enemy.level,
        hp: enemy.hp,
        maxHp: enemy.maxHp
      }
    }, `战斗开始: ${player.name}(Lv${player.level}) vs ${enemy.name}(Lv${enemy.level})`);
  }

  /**
   * 记录回合开始
   */
  public LogTurnStart(turn: number, playerSkillId: number, enemySkillId: number): void {
    this.AddLog(turn, BattleLogType.TURN_START, {
      playerSkillId,
      enemySkillId
    }, `回合 ${turn} 开始`);
  }

  /**
   * 记录状态伤害
   */
  public LogStatusDamage(turn: number, target: 'player' | 'enemy', damage: number, statusType: string): void {
    this.AddLog(turn, BattleLogType.STATUS_DAMAGE, {
      target,
      damage,
      statusType
    }, `${target === 'player' ? '玩家' : '敌人'} 受到 ${statusType} 状态伤害: ${damage}`);
  }

  /**
   * 记录无法行动
   */
  public LogCannotAct(turn: number, target: 'player' | 'enemy', reason: string): void {
    this.AddLog(turn, BattleLogType.CANNOT_ACT, {
      target,
      reason
    }, `${target === 'player' ? '玩家' : '敌人'} 无法行动: ${reason}`);
  }

  /**
   * 记录攻击
   */
  public LogAttack(turn: number, attacker: 'player' | 'enemy', skill: ISkillConfig, result: IAttackResult): void {
    const messages: string[] = [];
    
    if (result.missed) {
      messages.push(`${attacker === 'player' ? '玩家' : '敌人'} 使用 ${skill.name}，但未命中！`);
    } else if (result.blocked) {
      messages.push(`${attacker === 'player' ? '玩家' : '敌人'} 使用 ${skill.name}，但被格挡了！`);
    } else {
      messages.push(`${attacker === 'player' ? '玩家' : '敌人'} 使用 ${skill.name}`);
      
      if (result.damage > 0) {
        messages.push(`造成 ${result.damage} 点伤害${result.isCrit ? ' (暴击!)' : ''}`);
      }
      
      if (result.gainHp > 0) {
        messages.push(`回复 ${result.gainHp} HP`);
      }
    }

    this.AddLog(turn, BattleLogType.ATTACK, {
      attacker,
      skillId: skill.id,
      skillName: skill.name,
      result
    }, messages.join(', '));
  }

  /**
   * 记录伤害
   */
  public LogDamage(turn: number, target: 'player' | 'enemy', damage: number, isCrit: boolean): void {
    this.AddLog(turn, BattleLogType.DAMAGE, {
      target,
      damage,
      isCrit
    }, `${target === 'player' ? '玩家' : '敌人'} 受到 ${damage} 点伤害${isCrit ? ' (暴击!)' : ''}`);
  }

  /**
   * 记录回复
   */
  public LogHeal(turn: number, target: 'player' | 'enemy', amount: number): void {
    this.AddLog(turn, BattleLogType.HEAL, {
      target,
      amount
    }, `${target === 'player' ? '玩家' : '敌人'} 回复 ${amount} HP`);
  }

  /**
   * 记录能力等级变化
   */
  public LogStatChange(turn: number, target: 'player' | 'enemy', stat: number, stages: number): void {
    const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
    const change = stages > 0 ? '提升' : '降低';
    
    this.AddLog(turn, BattleLogType.STAT_CHANGE, {
      target,
      stat,
      stages
    }, `${target === 'player' ? '玩家' : '敌人'} ${statNames[stat]}${change} ${Math.abs(stages)} 级`);
  }

  /**
   * 记录状态效果应用
   */
  public LogStatusApply(turn: number, target: 'player' | 'enemy', statusType: string, duration: number): void {
    this.AddLog(turn, BattleLogType.STATUS_APPLY, {
      target,
      statusType,
      duration
    }, `${target === 'player' ? '玩家' : '敌人'} 进入 ${statusType} 状态 (持续${duration}回合)`);
  }

  /**
   * 记录效果触发
   */
  public LogEffectTrigger(turn: number, effectName: string, effectId: number, success: boolean): void {
    this.AddLog(turn, BattleLogType.EFFECT_TRIGGER, {
      effectName,
      effectId,
      success
    }, `效果触发: ${effectName} (Eid=${effectId}) - ${success ? '成功' : '失败'}`);
  }

  /**
   * 记录回合结束
   */
  public LogTurnEnd(turn: number, playerHp: number, enemyHp: number): void {
    this.AddLog(turn, BattleLogType.TURN_END, {
      playerHp,
      enemyHp
    }, `回合 ${turn} 结束 - 玩家HP: ${playerHp}, 敌人HP: ${enemyHp}`);
  }

  /**
   * 记录战斗结束
   */
  public LogBattleEnd(turn: number, winner: number, reason: number): void {
    const winnerText = winner === 0 ? '敌人' : winner === this.userId ? '玩家' : '平局';
    const reasonText = this.GetReasonText(reason);
    
    this.AddLog(turn, BattleLogType.BATTLE_END, {
      winner,
      reason
    }, `战斗结束: ${winnerText}胜利 (${reasonText})`);
  }

  /**
   * 添加日志条目
   */
  private AddLog(turn: number, type: BattleLogType, data: any, message: string): void {
    const entry: IBattleLogEntry = {
      turn,
      timestamp: Date.now(),
      type,
      data,
      message
    };

    this.logs.push(entry);
    
    // 同时输出到控制台
    Logger.Debug(`[BattleLog] ${message}`);
  }

  /**
   * 获取结束原因文本
   */
  private GetReasonText(reason: number): string {
    const reasons: { [key: number]: string } = {
      0: '正常结束',
      1: '对方退出',
      2: '超时',
      3: '平局',
      4: '系统错误',
      5: 'NPC逃跑',
      6: '捕获成功',
      7: '玩家逃跑'
    };
    return reasons[reason] || '未知原因';
  }

  /**
   * 获取所有日志
   */
  public GetLogs(): IBattleLogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取指定回合的日志
   */
  public GetLogsByTurn(turn: number): IBattleLogEntry[] {
    return this.logs.filter(log => log.turn === turn);
  }

  /**
   * 获取指定类型的日志
   */
  public GetLogsByType(type: BattleLogType): IBattleLogEntry[] {
    return this.logs.filter(log => log.type === type);
  }

  /**
   * 导出日志为JSON
   */
  public ExportToJSON(): string {
    return JSON.stringify({
      battleId: this.battleId,
      userId: this.userId,
      logs: this.logs,
      totalTurns: this.logs.filter(log => log.type === BattleLogType.TURN_START).length,
      exportTime: Date.now()
    }, null, 2);
  }

  /**
   * 清空日志
   */
  public Clear(): void {
    this.logs = [];
  }

  /**
   * 获取日志统计
   */
  public GetStatistics(): {
    totalTurns: number;
    totalDamageDealt: number;
    totalDamageReceived: number;
    totalHealing: number;
    criticalHits: number;
    missedAttacks: number;
  } {
    const stats = {
      totalTurns: 0,
      totalDamageDealt: 0,
      totalDamageReceived: 0,
      totalHealing: 0,
      criticalHits: 0,
      missedAttacks: 0
    };

    for (const log of this.logs) {
      if (log.type === BattleLogType.TURN_START) {
        stats.totalTurns++;
      } else if (log.type === BattleLogType.ATTACK) {
        const result = log.data.result as IAttackResult;
        if (log.data.attacker === 'player') {
          stats.totalDamageDealt += result.damage;
          if (result.isCrit) stats.criticalHits++;
          if (result.missed) stats.missedAttacks++;
        } else {
          stats.totalDamageReceived += result.damage;
        }
        stats.totalHealing += result.gainHp;
      }
    }

    return stats;
  }
}
