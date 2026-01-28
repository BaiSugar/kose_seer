import { Logger } from '../../../../shared/utils';
import { IBattleInfo, ITurnResult } from '../../../../shared/models/BattleModel';
import { ISkillConfig } from '../../../../shared/models/SkillModel';
import { BattleTurnExecutor } from '../BattleTurnExecutor';
import { BattleCaptureSystem, PokeBallType } from '../BattleCaptureSystem';
import { BattleEscapeSystem } from '../BattleEscapeSystem';
import { GameConfig } from '../../../../shared/config/game/GameConfig';

/**
 * 战斗回合服务
 * 负责处理战斗回合逻辑、伤害计算、技能效果、捕获、逃跑等
 * 
 * 移植自: luvit/luvit_version/game/seer_battle.lua
 */
export class BattleTurnService {
  // 逃跑尝试次数记录（按战斗ID存储）
  private escapeAttempts: Map<number, number> = new Map();

  /**
   * 执行一个战斗回合
   */
  public ExecuteTurn(battle: IBattleInfo, playerSkillId: number): ITurnResult {
    Logger.Info(`[BattleTurnService] 回合 ${battle.turn + 1}: 玩家使用技能 ${playerSkillId}`);

    // 获取技能配置
    const skillConfigs = new Map<number, ISkillConfig>();
    
    // 加载玩家技能
    for (const skillId of battle.player.skills) {
      const skillMove = GameConfig.GetSkillById(skillId);
      if (skillMove) {
        // 转换 ISkillMove 到 ISkillConfig
        const skillConfig: ISkillConfig = {
          id: skillMove.ID,
          name: skillMove.Name,
          category: skillMove.Category,
          type: skillMove.Type,
          power: skillMove.Power,
          maxPP: skillMove.MaxPP,
          accuracy: skillMove.Accuracy,
          critRate: skillMove.CritRate || 1,
          priority: skillMove.Priority || 0,
          mustHit: skillMove.MustHit === 1
        };
        skillConfigs.set(skillId, skillConfig);
        Logger.Debug(`[BattleTurnService] 加载玩家技能: ${skillId} - ${skillConfig.name}`);
      }
    }
    
    // 加载敌人技能
    for (const skillId of battle.enemy.skills) {
      const skillMove = GameConfig.GetSkillById(skillId);
      if (skillMove) {
        // 转换 ISkillMove 到 ISkillConfig
        const skillConfig: ISkillConfig = {
          id: skillMove.ID,
          name: skillMove.Name,
          category: skillMove.Category,
          type: skillMove.Type,
          power: skillMove.Power,
          maxPP: skillMove.MaxPP,
          accuracy: skillMove.Accuracy,
          critRate: skillMove.CritRate || 1,
          priority: skillMove.Priority || 0,
          mustHit: skillMove.MustHit === 1
        };
        skillConfigs.set(skillId, skillConfig);
        Logger.Debug(`[BattleTurnService] 加载敌人技能: ${skillId} - ${skillConfig.name}`);
      }
    }

    // 使用 BattleTurnExecutor 执行回合
    return BattleTurnExecutor.ExecuteTurn(battle, playerSkillId, skillConfigs);
  }

  /**
   * 处理逃跑
   * 
   * 逃跑成功率计算：
   * - 基于玩家和敌人的速度差
   * - 每次失败后成功率提升
   * - BOSS战斗无法逃跑
   * - 被束缚状态无法逃跑
   */
  public Escape(battle: IBattleInfo): boolean {
    const battleId = battle.startTime; // 使用开始时间作为战斗ID
    const attempts = this.escapeAttempts.get(battleId) || 0;

    // 检查是否可以逃跑
    const canEscape = BattleEscapeSystem.CanEscape(battle, attempts);
    if (!canEscape.canEscape) {
      Logger.Warn(`[BattleTurnService] 无法逃跑: ${canEscape.reason}`);
      return false;
    }

    // 尝试逃跑
    const result = BattleEscapeSystem.AttemptEscape(battle, attempts);
    
    // 更新尝试次数
    this.escapeAttempts.set(battleId, result.attempts);

    if (result.success) {
      battle.isOver = true;
      Logger.Info(`[BattleTurnService] 逃跑成功: 成功率=${result.escapeRate.toFixed(2)}%, 尝试次数=${result.attempts}`);
      
      // 清理尝试次数记录
      this.escapeAttempts.delete(battleId);
    } else {
      Logger.Info(`[BattleTurnService] 逃跑失败: 成功率=${result.escapeRate.toFixed(2)}%, 尝试次数=${result.attempts}`);
    }

    return result.success;
  }

  /**
   * 处理捕获
   * 
   * 捕获成功率计算：
   * - 基于目标HP比例
   * - 异常状态增加捕获率
   * - 精灵球类型影响捕获率
   * - 等级越高越难捕获
   */
  public Catch(battle: IBattleInfo, ballType: PokeBallType = PokeBallType.NORMAL): { 
    success: boolean; 
    catchTime: number;
    catchRate: number;
    shakeCount: number;
  } {
    // 检查是否可以捕获
    const isBoss = battle.aiType?.includes('boss') || false;
    const canCapture = BattleCaptureSystem.CanCapture(battle.enemy, isBoss);
    
    if (!canCapture.canCapture) {
      Logger.Warn(`[BattleTurnService] 无法捕获: ${canCapture.reason}`);
      return { 
        success: false, 
        catchTime: 0,
        catchRate: 0,
        shakeCount: 0
      };
    }

    // 计算基础捕获率（可以根据精灵ID从配置中获取）
    const baseCatchRate = 50; // 默认50%

    // 尝试捕获
    const result = BattleCaptureSystem.AttemptCapture(battle.enemy, ballType, baseCatchRate);

    if (result.success) {
      battle.isOver = true;
      Logger.Info(
        `[BattleTurnService] 捕获成功: Boss=${battle.enemy.id}, ` +
        `捕获率=${result.catchRate.toFixed(2)}%, ` +
        `摇晃次数=${result.shakeCount}, ` +
        `暴击捕获=${result.isCriticalCapture}`
      );
    } else {
      Logger.Info(
        `[BattleTurnService] 捕获失败: ` +
        `捕获率=${result.catchRate.toFixed(2)}%, ` +
        `摇晃次数=${result.shakeCount}`
      );
    }

    return { 
      success: result.success, 
      catchTime: result.catchTime,
      catchRate: result.catchRate,
      shakeCount: result.shakeCount
    };
  }

  /**
   * 获取逃跑建议
   * 返回当前是否适合逃跑
   */
  public GetEscapeAdvice(battle: IBattleInfo): {
    isGood: boolean;
    reason: string;
    escapeRate: number;
  } {
    return BattleEscapeSystem.IsGoodTimeToEscape(battle);
  }

  /**
   * 获取推荐精灵球
   * 根据目标状态推荐最合适的精灵球
   */
  public GetRecommendedBall(battle: IBattleInfo): PokeBallType {
    const baseCatchRate = 50; // 可以从配置中获取
    return BattleCaptureSystem.RecommendBall(battle.enemy, baseCatchRate);
  }

  /**
   * 清理战斗数据
   * 战斗结束后清理临时数据
   */
  public CleanupBattle(battleId: number): void {
    this.escapeAttempts.delete(battleId);
  }
}

