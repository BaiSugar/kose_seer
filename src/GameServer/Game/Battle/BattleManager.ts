import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { PlayerInstance } from '../Player/PlayerInstance';
import { IBattleInfo } from '../../../shared/models/BattleModel';
import { BattleInitService, BattleTurnService, BattleRewardService } from './services';
import { BattleConverter } from './BattleConverter';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { CommandID } from '../../../shared/protocol/CommandID';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { MapSpawnManager } from '../Map/MapSpawnManager';
import { 
  PacketNoteReadyToFight, 
  PacketNoteStartFight, 
  PacketNoteUseSkill, 
  PacketFightOver,
  PacketUsePetItem,
  PacketCatchMonster,
  PacketEscapeFight
} from '../../Server/Packet/Send/Battle';

/**
 * 战斗管理器
 * 处理战斗相关的所有逻辑：挑战BOSS、准备战斗、使用技能、捕捉精灵等
 * 
 * 架构说明：
 * - Manager 负责协调各个 Service
 * - Service 负责具体的业务逻辑和数据库操作
 * - Manager 只处理请求转发和响应发送
 * - 使用 BattleConverter 简化 Proto 构建
 */
export class BattleManager extends BaseManager {
  // 服务实例
  private _initService: BattleInitService;
  private _turnService: BattleTurnService;
  private _rewardService: BattleRewardService;

  // 当前战斗实例（会话级别）
  private _currentBattle: IBattleInfo | null = null;
  
  // 当前战斗的野怪槽位（用于战斗结束后刷新）
  private _currentBattleSlot: number = -1;

  constructor(player: PlayerInstance) {
    super(player);
    
    // 初始化服务
    this._initService = new BattleInitService(player);
    this._turnService = new BattleTurnService();
    this._rewardService = new BattleRewardService(player);
  }

  /**
   * 处理挑战野外精灵
   * CMD 2408: FIGHT_NPC_MONSTER
   * 发送 2408 确认 + NOTE_READY_TO_FIGHT (2503)
   */
  public async HandleFightNpcMonster(monsterIndex: number): Promise<void> {
    try {
      // 验证索引范围
      if (monsterIndex < 0 || monsterIndex > 8) {
        await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5001));
        Logger.Warn(`[BattleManager] 无效的怪物索引: ${monsterIndex}`);
        return;
      }

      // 使用 MapSpawnManager 获取玩家的野怪列表
      const mapId = this.Player.Data.mapID || 1;
      const ogres = MapSpawnManager.Instance.GetMapOgres(this.UserID, mapId);

      // 检查索引位置是否有怪物
      if (!ogres[monsterIndex] || ogres[monsterIndex].petId <= 0) {
        await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5001));
        Logger.Warn(`[BattleManager] 索引 ${monsterIndex} 位置没有怪物`);
        return;
      }

      const monsterId = ogres[monsterIndex].petId;
      
      // 野怪等级：默认5级，可以根据地图ID调整
      // 简单规则：地图ID越大，等级越高（每10个地图+1级）
      const baseLevel = 5;
      const levelBonus = Math.floor(mapId / 10);
      const monsterLevel = Math.min(baseLevel + levelBonus, 100); // 最高100级

      // 创建战斗实例
      const battle = await this._initService.CreatePVEBattle(this.UserID, monsterId, monsterLevel);
      
      if (!battle) {
        await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5001));
        return;
      }

      // 保存战斗槽位信息（用于战斗结束后刷新）
      this._currentBattle = battle;
      this._currentBattleSlot = monsterIndex;

      // 1. 先发送 2408 确认（空响应）
      await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER));

      // 获取玩家昵称
      const playerNick = this.Player.Data.nick || `Player${this.UserID}`;

      // 使用转换器构建精灵信息（链式调用）
      const playerPets = [BattleConverter.ToSimplePetInfo(battle.player)];
      const enemyPets = [BattleConverter.ToSimplePetInfo(battle.enemy)];

      // 2. 然后发送 NOTE_READY_TO_FIGHT (2503)
      await this.Player.SendPacket(new PacketNoteReadyToFight(
        this.UserID,
        playerNick,
        playerPets,
        0,
        '野生精灵',  // 敌人昵称
        enemyPets
      ));
      
      Logger.Info(`[BattleManager] 挑战野外精灵: UserID=${this.UserID}, Index=${monsterIndex}, PetId=${monsterId}, Level=${monsterLevel}`);
    } catch (error) {
      Logger.Error(`[BattleManager] HandleFightNpcMonster failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5000));
    }
  }

  /**
   * 处理挑战BOSS
   * CMD 2411: CHALLENGE_BOSS
   * 发送 NOTE_READY_TO_FIGHT (2503)
   */
  public async HandleChallengeBoss(bossId: number): Promise<void> {
    const bossLevel = 1;

    const battle = await this._initService.CreatePVEBattle(this.UserID, bossId, bossLevel);
    
    if (!battle) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(5001));
      return;
    }

    this._currentBattle = battle;

    // 获取玩家昵称
    const playerNick = this.Player.Data.nick || `Player${this.UserID}`;

    // 使用转换器构建精灵信息（链式调用）
    const playerPets = [BattleConverter.ToSimplePetInfo(battle.player)];
    const enemyPets = [BattleConverter.ToSimplePetInfo(battle.enemy)];

    // 发送 NOTE_READY_TO_FIGHT (2503)
    await this.Player.SendPacket(new PacketNoteReadyToFight(
      this.UserID,
      playerNick,
      playerPets,
      0,
      '',
      enemyPets
    ));
    
    Logger.Info(`[BattleManager] 挑战BOSS: UserID=${this.UserID}, BossId=${bossId}`);
  }

  /**
   * 处理准备战斗
   * CMD 2404: READY_TO_FIGHT
   * 发送 NOTE_START_FIGHT (2504)
   */
  public async HandleReadyToFight(): Promise<void> {
    if (!this._currentBattle) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.READY_TO_FIGHT).setResult(5001));
      return;
    }

    if (!this._initService.ValidateBattle(this._currentBattle)) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.READY_TO_FIGHT).setResult(5002));
      return;
    }

    // 使用转换器构建战斗精灵信息（链式调用）
    const playerPet = BattleConverter.ToFightPetInfo(this._currentBattle.player, this.UserID, 0);
    const enemyPet = BattleConverter.ToFightPetInfo(this._currentBattle.enemy, 0, 1);

    // 发送 NOTE_START_FIGHT (2504)
    await this.Player.SendPacket(new PacketNoteStartFight(0, playerPet, enemyPet));
    
    Logger.Info(`[BattleManager] 准备战斗: UserID=${this.UserID}`);
  }

  /**
   * 处理使用技能
   * CMD 2405: USE_SKILL
   * 发送确认 + NOTE_USE_SKILL (2505) + FIGHT_OVER (2506)
   */
  public async HandleUseSkill(skillId: number): Promise<void> {
    // 1. 发送确认
    await this.Player.SendPacket(new PacketEmpty(CommandID.USE_SKILL));

    if (!this._currentBattle || this._currentBattle.isOver) {
      Logger.Warn(`[BattleManager] 没有进行中的战斗: UserID=${this.UserID}`);
      return;
    }

    // 保存当前回合数（因为战斗结束后会清理 _currentBattle）
    const currentTurn = this._currentBattle.turn;

    // 2. 执行回合
    const result = this._turnService.ExecuteTurn(this._currentBattle, skillId);

    // 3. 使用转换器构建攻击结果（链式调用）
    const firstAttack = BattleConverter.ToAttackValue(
      result.firstAttack,
      this.UserID,
      this._currentBattle.player.hp,
      this._currentBattle.player.maxHp,
      this._currentBattle.player.status,
      this._currentBattle.player.battleLv,
      this._currentBattle.player.type
    );

    const secondAttack = BattleConverter.ToAttackValue(
      result.secondAttack,
      0,
      this._currentBattle.enemy.hp,
      this._currentBattle.enemy.maxHp,
      this._currentBattle.enemy.status,
      this._currentBattle.enemy.battleLv,
      this._currentBattle.enemy.type
    );

    // 发送 NOTE_USE_SKILL (2505)
    await this.Player.SendPacket(new PacketNoteUseSkill(firstAttack, secondAttack));

    // 4. 如果战斗结束，发送 FIGHT_OVER (2506)
    if (result.isOver) {
      await this.HandleFightOver(result.winner || 0, result.reason || 0);
    }

    Logger.Info(`[BattleManager] 使用技能: UserID=${this.UserID}, SkillId=${skillId}, Turn=${currentTurn}`);
  }

  /**
   * 处理战斗结束
   * 发送 FIGHT_OVER (2506)
   */
  private async HandleFightOver(winnerId: number, reason: number): Promise<void> {
    if (!this._currentBattle) return;

    // 如果玩家胜利，处理奖励
    if (winnerId === this.UserID) {
      const reward = await this._rewardService.ProcessVictoryReward(this.UserID, this._currentBattle);
      Logger.Info(`[BattleManager] 战斗胜利奖励: Exp=${reward.expGained}, Coins=${reward.coinsGained}, LevelUp=${reward.levelUp}`);
    }

    // 发送 FIGHT_OVER (2506)
    await this.Player.SendPacket(new PacketFightOver(reason, winnerId));

    // 战斗结束后移除野怪
    if (this._currentBattleSlot >= 0) {
      MapSpawnManager.Instance.OnBattleEnd(this.UserID, this._currentBattleSlot);
      Logger.Info(`[BattleManager] 战斗结束，移除野怪: userId=${this.UserID}, slot=${this._currentBattleSlot}`);
    }

    // 清理战斗实例
    this._currentBattle = null;
    this._currentBattleSlot = -1;

    Logger.Info(`[BattleManager] 战斗结束: Winner=${winnerId}, Reason=${reason}`);
  }

  /**
   * 处理使用精灵道具
   * CMD 2406: USE_PET_ITEM
   */
  public async HandleUsePetItem(itemId: number): Promise<void> {
    if (!this._currentBattle || this._currentBattle.isOver) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5001));
      return;
    }

    // 简化：恢复50HP
    const healAmount = 50;
    const oldHp = this._currentBattle.player.hp;
    this._currentBattle.player.hp = Math.min(
      this._currentBattle.player.maxHp,
      this._currentBattle.player.hp + healAmount
    );
    const actualHeal = this._currentBattle.player.hp - oldHp;

    // 发送响应
    await this.Player.SendPacket(new PacketUsePetItem(
      this.UserID,
      itemId,
      this._currentBattle.player.hp,
      actualHeal
    ));

    Logger.Info(`[BattleManager] 使用道具: UserID=${this.UserID}, ItemId=${itemId}, Heal=${actualHeal}`);
  }

  /**
   * 处理更换精灵
   * CMD 2407: CHANGE_PET
   */
  public async HandleChangePet(catchTime: number): Promise<void> {
    if (!this._currentBattle || this._currentBattle.isOver) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5001));
      return;
    }

    // 简化：暂不支持更换精灵
    await this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5002));

    Logger.Info(`[BattleManager] 更换精灵: UserID=${this.UserID}, CatchTime=${catchTime}`);
  }

  /**
   * 处理捕捉精灵
   * CMD 2409: CATCH_MONSTER
   */
  public async HandleCatchMonster(): Promise<void> {
    if (!this._currentBattle || this._currentBattle.isOver) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.CATCH_MONSTER).setResult(5001));
      return;
    }

    // 尝试捕获（使用普通精灵球）
    const catchResult = this._turnService.Catch(this._currentBattle);

    if (catchResult.success) {
      // 处理捕获
      const success = await this._rewardService.ProcessCatch(
        this.UserID,
        this._currentBattle,
        catchResult.catchTime
      );

      if (success) {
        const enemyId = this._currentBattle.enemy.id;
        await this.Player.SendPacket(new PacketCatchMonster(catchResult.catchTime, enemyId));
        
        // 战斗结束后移除野怪
        if (this._currentBattleSlot >= 0) {
          MapSpawnManager.Instance.OnBattleEnd(this.UserID, this._currentBattleSlot);
          Logger.Info(`[BattleManager] 捕获成功，移除野怪: userId=${this.UserID}, slot=${this._currentBattleSlot}`);
        }
        
        // 战斗结束
        this._currentBattle = null;
        this._currentBattleSlot = -1;
        
        Logger.Info(
          `[BattleManager] 捕获成功: UserID=${this.UserID}, PetId=${enemyId}, ` +
          `捕获率=${catchResult.catchRate.toFixed(2)}%, 摇晃次数=${catchResult.shakeCount}`
        );
      } else {
        await this.Player.SendPacket(new PacketEmpty(CommandID.CATCH_MONSTER).setResult(5003));
      }
    } else {
      // 捕获失败
      await this.Player.SendPacket(new PacketEmpty(CommandID.CATCH_MONSTER).setResult(5002));
      Logger.Info(
        `[BattleManager] 捕获失败: UserID=${this.UserID}, ` +
        `捕获率=${catchResult.catchRate.toFixed(2)}%, 摇晃次数=${catchResult.shakeCount}`
      );
    }
  }

  /**
   * 处理逃跑
   * CMD 2410: ESCAPE_FIGHT
   */
  public async HandleEscapeFight(): Promise<void> {
    if (!this._currentBattle || this._currentBattle.isOver) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.ESCAPE_FIGHT).setResult(5001));
      return;
    }

    // 尝试逃跑
    const success = this._turnService.Escape(this._currentBattle);

    if (success) {
      await this.Player.SendPacket(new PacketEscapeFight(1));
      
      // 逃跑成功不移除野怪（野怪还在）
      // 只有战斗胜利或捕获成功才移除野怪
      
      // 清理战斗实例
      this._currentBattle = null;
      this._currentBattleSlot = -1;
      
      Logger.Info(`[BattleManager] 逃跑成功: UserID=${this.UserID}`);
    } else {
      await this.Player.SendPacket(new PacketEscapeFight(0));
    }
  }

  /**
   * 获取当前战斗状态
   */
  public GetCurrentBattle(): IBattleInfo | null {
    return this._currentBattle;
  }

  /**
   * 玩家登出时清理战斗
   */
  public async OnLogout(): Promise<void> {
    if (this._currentBattle) {
      Logger.Info(`[BattleManager] 玩家登出，清理战斗: UserID=${this.UserID}`);
      this._currentBattle = null;
      this._currentBattleSlot = -1;
    }
  }
}
