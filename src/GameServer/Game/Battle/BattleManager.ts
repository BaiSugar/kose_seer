import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { PlayerInstance } from '../Player/PlayerInstance';
import { OnlineTracker } from '../Player/OnlineTracker';
import { IBattleInfo, IBattlePet, IAttackResult, ITurnResult } from '../../../shared/models/BattleModel';
import { BattleInitService, BattleTurnService, BattleRewardService } from './services';
import { BattleConverter } from './BattleConverter';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { CommandID } from '../../../shared/protocol/CommandID';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { BattleEffectIntegration } from './BattleEffectIntegration';
import { BossSpecialRules } from './BossSpecialRules';
import { SimplePetInfoProto } from '../../../shared/proto/common/SimplePetInfoProto';
import { AttackValueProto } from '../../../shared/proto/common/AttackValueProto';
import {
  PacketNoteReadyToFight,
  PacketNoteStartFight,
  PacketNoteUseSkill,
  PacketFightOver,
  PacketUsePetItem,
  PacketCatchMonster,
  PacketEscapeFight,
  PacketBattleReward,
  PacketChangePet
} from '../../Server/Packet/Send/Battle';
import { PacketMapBoss, PacketMapOgreList } from '../../Server/Packet/Send/Map';
import { PvpBattleManager, IPvpAction } from './PvpBattleManager';
import { BossAbilityConfig } from './BossAbility';

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
  private _currentBattleMapId: number = -1;
  private _currentBattleOriginalPetId: number = -1; // 原始精灵ID（用于查找配置）

  // 记录战斗中所有参与过的精灵HP（用于战斗结束时同步）
  private _battlePetHPMap: Map<number, number> = new Map(); // catchTime -> HP

  constructor(player: PlayerInstance) {
    super(player);

    // 初始化服务
    this._initService = new BattleInitService(player);
    this._turnService = new BattleTurnService();
    this._rewardService = new BattleRewardService(player);
  }

  // ==================== 共享辅助方法 ====================

  /**
   * 扣除技能PP
   */
  private DeductSkillPP(pet: IBattlePet, skillId: number): void {
    const skillIndex = pet.skills.indexOf(skillId);
    if (skillIndex !== -1 && pet.skillPP && pet.skillPP[skillIndex] > 0) {
      pet.skillPP[skillIndex]--;
      Logger.Debug(`[BattleManager] 扣除技能PP: SkillId=${skillId}, 剩余PP=${pet.skillPP[skillIndex]}`);
    }
  }

  /**
   * 构建不攻击的回合结果（换精灵/使用道具时玩家不攻击）
   */
  private BuildNoActionAttackResult(): IAttackResult {
    if (!this._currentBattle) throw new Error('No current battle');
    const playerStatusArray = new Array(20).fill(0);
    if (this._currentBattle.player.status !== undefined) {
      playerStatusArray[this._currentBattle.player.status] = 1;
    }
    return {
      userId: this.UserID,
      skillId: 0,
      atkTimes: 0,
      damage: 0,
      gainHp: 0,
      attackerRemainHp: this._currentBattle.player.hp,
      attackerMaxHp: this._currentBattle.player.maxHp,
      defenderRemainHp: this._currentBattle.enemy.hp,
      defenderMaxHp: this._currentBattle.enemy.maxHp,
      missed: false,
      blocked: false,
      isCrit: false,
      attackerStatus: playerStatusArray,
      attackerBattleLv: this._currentBattle.player.battleLv || []
    };
  }

  /**
   * 统一构建攻击结果Proto对
   * 包含关键的 firstAttack.attackerRemainHp 修正
   */
  private BuildAttackValuePair(
    result: ITurnResult, pet1UserId: number, pet2UserId: number
  ): { firstAttack: AttackValueProto; secondAttack: AttackValueProto } {
    if (!this._currentBattle) throw new Error('No current battle');

    // 判断谁是先手攻击者
    const firstAttackIsP1 = result.firstAttack?.userId === this._currentBattle.userId;
    const firstAttacker = firstAttackIsP1 ? this._currentBattle.player : this._currentBattle.enemy;
    const secondAttacker = firstAttackIsP1 ? this._currentBattle.enemy : this._currentBattle.player;

    // 重要：修正 firstAttack 的 attackerRemainHp
    // firstAttack 执行时记录的是攻击者当时的HP，但后手攻击后攻击者HP可能变了
    // 客户端用 remainHp - currentHp 计算HP变化动画，如果不修正会显示错误的回血/扣血
    if (result.firstAttack && firstAttacker) {
      result.firstAttack.attackerRemainHp = firstAttacker.hp;
    }

    const firstAttackUserId = firstAttackIsP1 ? pet1UserId : pet2UserId;
    const secondAttackUserId = firstAttackIsP1 ? pet2UserId : pet1UserId;
    const firstPet = firstAttackIsP1 ? this._currentBattle.player : this._currentBattle.enemy;
    const secondPet = firstAttackIsP1 ? this._currentBattle.enemy : this._currentBattle.player;

    const firstAttack = BattleConverter.ToAttackValue(
      result.firstAttack,
      firstAttackUserId,
      firstPet.hp, firstPet.maxHp, firstPet.status, firstPet.battleLv, firstPet.type,
      firstAttacker
    );

    const secondAttack = BattleConverter.ToAttackValue(
      result.secondAttack,
      secondAttackUserId,
      secondPet.hp, secondPet.maxHp, secondPet.status, secondPet.battleLv, secondPet.type,
      secondAttacker
    );

    return { firstAttack, secondAttack };
  }

  /**
   * 更新玩家精灵HP记录
   */
  private UpdatePlayerHPRecord(): void {
    if (this._currentBattle && this._currentBattle.player) {
      this._battlePetHPMap.set(
        this._currentBattle.player.catchTime,
        this._currentBattle.player.hp
      );
    }
  }

  /**
   * PvE精灵阵亡检查
   * 检查玩家精灵是否阵亡，同步HP，检查是否还有健康精灵
   * @returns true 表示已处理（调用方应return），false 表示未阵亡
   */
  private async CheckPlayerPetDeath(): Promise<boolean> {
    if (!this._currentBattle || this._currentBattle.player.hp > 0) return false;

    // 同步当前精灵的HP（阵亡）
    const currentPet = this.Player.PetManager.PetData.GetPetsInBag()
      .find(p => p.catchTime === this._currentBattle!.player.catchTime);
    if (currentPet) {
      currentPet.hp = 0;
      Logger.Info(`[BattleManager] 同步阵亡精灵HP: PetId=${currentPet.petId}, CatchTime=${currentPet.catchTime}`);
    }

    // 检查是否还有其他健康精灵
    const playerPets = this.Player.PetManager.PetData.GetPetsInBag();
    const currentCatchTime = this._currentBattle.player.catchTime;
    const hasHealthyPet = playerPets.some(p => p.hp > 0 && p.catchTime !== currentCatchTime);

    if (!hasHealthyPet) {
      Logger.Info(`[BattleManager] 所有精灵阵亡，战斗失败: UserID=${this.UserID}`);
      this._currentBattle.isOver = true;
      await this.HandleFightOver(0, 0);
      return true;
    }

    Logger.Info(`[BattleManager] 当前精灵阵亡，等待切换精灵: UserID=${this.UserID}`);
    return true; // 阵亡但还有健康精灵，等待CHANGE_PET
  }

  /**
   * PvE敌方反击并发送结果（换精灵/捕捉失败后）
   */
  private async ExecuteEnemyCounterAndSend(): Promise<void> {
    if (!this._currentBattle) return;

    const enemyAttackResult = this._turnService.ExecuteEnemyTurn(this._currentBattle);

    // firstAttack: 玩家不攻击
    const noActionResult = this.BuildNoActionAttackResult();
    const firstAttack = BattleConverter.ToAttackValue(
      noActionResult, this.UserID,
      this._currentBattle.player.hp, this._currentBattle.player.maxHp,
      this._currentBattle.player.status, this._currentBattle.player.battleLv,
      this._currentBattle.player.type, this._currentBattle.player
    );

    // secondAttack: 敌人反击
    const secondAttack = BattleConverter.ToAttackValue(
      enemyAttackResult, 0,
      this._currentBattle.enemy.hp, this._currentBattle.enemy.maxHp,
      this._currentBattle.enemy.status, this._currentBattle.enemy.battleLv,
      this._currentBattle.enemy.type, this._currentBattle.enemy
    );

    await this.Player.SendPacket(new PacketNoteUseSkill(firstAttack, secondAttack));
    this.UpdatePlayerHPRecord();
  }

  /**
   * 换精灵验证
   * @returns 验证通过返回 { newPet, petConfig }，失败返回 null（已发送错误包）
   */
  private ValidateChangePet(catchTime: number, isPvp: boolean): { newPet: any; petConfig: any } | null {
    if (!this._currentBattle) return null;

    const playerPets = this.Player.PetManager.PetData.GetPetsInBag();
    const newPet = playerPets.find(p => p.catchTime === catchTime);

    if (!newPet) {
      Logger.Warn(`[BattleManager] 未找到精灵: CatchTime=${catchTime}`);
      this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5001));
      return null;
    }

    // 检查是否是当前精灵
    const isPlayer1 = this._currentBattle.userId === this.UserID;
    const myCurrentPet = (isPvp && !isPlayer1) ? this._currentBattle.enemy : this._currentBattle.player;
    if (myCurrentPet.catchTime === catchTime) {
      Logger.Warn(`[BattleManager] 尝试切换到当前精灵: CatchTime=${catchTime}`);
      this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5002));
      return null;
    }

    if (newPet.hp <= 0) {
      Logger.Warn(`[BattleManager] 精灵已阵亡: CatchTime=${catchTime}`);
      this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5003));
      return null;
    }

    const petConfig = GameConfig.GetPetById(newPet.petId);
    if (!petConfig) {
      Logger.Warn(`[BattleManager] 找不到精灵配置: PetId=${newPet.petId}`);
      this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5001));
      return null;
    }

    return { newPet, petConfig };
  }

  /**
   * 发送战斗结束包给指定玩家
   */
  private async SendFightOverPacket(player: PlayerInstance, reason: number, winnerId: number): Promise<void> {
    const playerData = player.Data;
    await player.SendPacket(new PacketFightOver(
      reason, winnerId,
      playerData.twoTimes || 0,
      playerData.threeTimes || 0,
      playerData.autoFightTimes || 0,
      playerData.energyTimes || 0,
      playerData.learnTimes || 0
    ));
  }

  /**
   * 通知PvP对手战斗结束
   */
  private async NotifyPvpOpponentFightOver(reason: number, winnerId: number): Promise<void> {
    if (!this._currentBattle?.player2Id) return;

    const actualOpponentId = this.UserID === this._currentBattle.userId
      ? this._currentBattle.player2Id
      : this._currentBattle.userId;
    const savedPlayer1Id = this._currentBattle.userId;
    const savedPlayer2Id = this._currentBattle.player2Id;

    const opponentSession = OnlineTracker.Instance.GetPlayerSession(actualOpponentId);
    if (opponentSession?.Player) {
      await this.SendFightOverPacket(opponentSession.Player, reason, winnerId);
      await opponentSession.Player.BattleManager.SyncBattlePetHP();
      opponentSession.Player.BattleManager.CleanupBattle();
    }

    const roomKey = PvpBattleManager.Instance['GetRoomKey'](savedPlayer1Id, savedPlayer2Id);
    PvpBattleManager.Instance.RemoveBattleRoom(roomKey);
  }

  /**
   * PvE战斗结束后清理地图（移除野怪、推送更新）
   */
  private async CleanupPveMap(): Promise<void> {
    if (this._currentBattleSlot < 0) return;

    this.Player.MapSpawnManager.OnBattleEnd(this._currentBattleSlot);
    Logger.Info(`[BattleManager] 战斗结束，移除野怪: userId=${this.UserID}, slot=${this._currentBattleSlot}`);

    await this.SendOgreListUpdate();

    if (this._currentBattleMapId >= 0 && await this.IsBossBattle(this._currentBattleMapId, this._currentBattleSlot)) {
      await this.SendBossRemovalNotification(this._currentBattleSlot);
    }
  }

  // ==================== 精灵数据更新 ====================

  /**
   * 更新战斗中的精灵数据
   * 用于更换精灵时更新战斗状态
   */
  private UpdateBattlePet(battlePet: any, newPet: any, petConfig: any): void {
    // 获取技能
    const playerSkills = newPet.skillArray.filter((s: number) => s > 0);
    const finalSkills = playerSkills.length > 0 ? playerSkills : [10001];

    // 获取技能PP
    const skillPPs = finalSkills.map((skillId: number) => {
      const skillConfig = GameConfig.GetSkillById(skillId);
      const maxPP = skillConfig?.MaxPP || 20;
      Logger.Debug(`[BattleManager] UpdateBattlePet: SkillId=${skillId}, MaxPP=${maxPP}, SkillName=${skillConfig?.Name || 'Unknown'}`);
      return maxPP;
    });

    Logger.Debug(`[BattleManager] UpdateBattlePet: Skills=${JSON.stringify(finalSkills)}, PPs=${JSON.stringify(skillPPs)}`);

    // 检查是否有战斗中的HP记录（切换回之前上过场的精灵）
    const battleHp = this._battlePetHPMap.get(newPet.catchTime);
    const actualHp = battleHp !== undefined ? battleHp : newPet.hp;

    Logger.Debug(`[BattleManager] UpdateBattlePet: CatchTime=${newPet.catchTime}, BattleHP=${battleHp}, DbHP=${newPet.hp}, ActualHP=${actualHp}`);

    // 更新基本属性
    battlePet.petId = newPet.petId;
    battlePet.id = newPet.petId;
    battlePet.name = newPet.nick || petConfig.DefName || 'Pet';
    battlePet.level = newPet.level;
    battlePet.hp = actualHp;  // 使用战斗中的HP（如果有记录）
    battlePet.maxHp = newPet.maxHp;
    battlePet.attack = newPet.atk;
    battlePet.defence = newPet.def;
    battlePet.spAtk = newPet.spAtk;
    battlePet.spDef = newPet.spDef;
    battlePet.speed = newPet.speed;
    battlePet.type = petConfig.Type || 0;
    battlePet.skills = finalSkills;
    battlePet.catchTime = newPet.catchTime;
    battlePet.skinID = 0;  // 皮肤ID（暂时使用默认皮肤0）
    battlePet.skillPP = skillPPs;

    // 重置战斗状态
    battlePet.statusArray = new Array(20).fill(0);
    battlePet.battleLv = new Array(6).fill(0);
    battlePet.status = undefined;
    battlePet.statusTurns = 0;
    battlePet.statusDurations = new Array(20).fill(0);
    battlePet.battleLevels = [0, 0, 0, 0, 0, 0];
    battlePet.effectCounters = {};
  }

  /**
   * 同步战斗精灵HP到玩家精灵数据
   * 战斗结束时调用，将战斗中的HP变化同步回数据库
   */
  private async SyncBattlePetHP(): Promise<void> {
    if (!this._currentBattle) return;

    // 1. 更新当前战斗精灵的HP
    const currentBattlePet = this._currentBattle.player;
    this._battlePetHPMap.set(currentBattlePet.catchTime, currentBattlePet.hp);

    // 2. 同步所有参与过战斗的精灵HP
    const playerPets = this.Player.PetManager.PetData.GetPetsInBag();

    for (const [catchTime, battleHP] of this._battlePetHPMap.entries()) {
      const playerPet = playerPets.find(p => p.catchTime === catchTime);

      if (!playerPet) {
        // 在PVP战斗中，可能是对手的精灵，跳过
        Logger.Debug(`[BattleManager] 跳过非己方精灵: catchTime=${catchTime}`);
        continue;
      }

      // 同步HP（确保不超过最大值，不低于0）
      const newHp = Math.max(0, Math.min(battleHP, playerPet.maxHp));
      playerPet.hp = newHp;

      Logger.Info(
        `[BattleManager] 同步精灵HP: PetId=${playerPet.petId}, ` +
        `CatchTime=${catchTime}, HP=${newHp}/${playerPet.maxHp}`
      );
    }

    // 3. 清空HP记录
    this._battlePetHPMap.clear();
  }

  // ==================== 战斗准备与清理 ====================

  /**
   * 初始化战斗前的准备工作
   * 清理旧战斗数据，初始化HP记录
   */
  private InitializeBattle(battle: IBattleInfo): void {
    this._currentBattle = battle;
    this._battlePetHPMap.clear();
    this._battlePetHPMap.set(battle.player.catchTime, battle.player.hp);

    Logger.Debug(
      `[BattleManager] 初始化战斗: UserID=${this.UserID}, ` +
      `PlayerPet(id=${battle.player.id}, hp=${battle.player.hp}), ` +
      `EnemyPet(id=${battle.enemy.id}, hp=${battle.enemy.hp})`
    );
  }

  /**
   * 清理战斗数据
   */
  private CleanupBattle(): void {
    this._currentBattle = null;
    this._currentBattleSlot = -1;
    this._currentBattleMapId = -1;
    this._currentBattleOriginalPetId = -1;
    this._battlePetHPMap.clear();

    Logger.Debug(`[BattleManager] 清理战斗数据: UserID=${this.UserID}`);
  }

  // ==================== 战斗入口 ====================

  /**
   * 处理挑战野外精灵
   * CMD 2408: FIGHT_NPC_MONSTER
   * 发送 2408 确认 + NOTE_READY_TO_FIGHT (2503)
   */
  public async HandleFightNpcMonster(monsterIndex: number): Promise<void> {
    try {
      // 清理旧战斗（如果存在）
      if (this._currentBattle) {
        this.CleanupBattle();
      }

      // 验证索引范围
      if (monsterIndex < 0 || monsterIndex > 8) {
        await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5001));
        Logger.Warn(`[BattleManager] 无效的怪物索引: ${monsterIndex}`);
        return;
      }

      // 使用 MapSpawnManager 获取玩家的野怪列表
      const mapId = this.Player.Data.mapID || 1;
      const ogres = this.Player.MapSpawnManager.GetMapOgres(mapId);

      // 检查索引位置是否有怪物
      if (!ogres[monsterIndex] || ogres[monsterIndex].petId <= 0) {
        await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5001));
        Logger.Warn(`[BattleManager] 索引 ${monsterIndex} 位置没有怪物`);
        return;
      }

      const monsterId = ogres[monsterIndex].petId;
      const originalPetId = ogres[monsterIndex].originalPetId; // 原始精灵ID（闪光时使用）

      // 从配置读取野怪等级
      const mapConfig = GameConfig.GetMapConfigById(mapId);
      let monsterLevel = 5; // 默认等级

      if (mapConfig) {
        // 根据精灵ID查找配置（优先用当前ID，找不到则用原始ID）
        let ogreConfig = mapConfig.ogres.find((o: any) => o.petId === monsterId);

        // 如果找不到（可能是闪光精灵），尝试用原始ID查找
        if (!ogreConfig && originalPetId > 0 && originalPetId !== monsterId) {
          ogreConfig = mapConfig.ogres.find((o: any) => o.petId === originalPetId);
          Logger.Debug(`[BattleManager] 闪光精灵，使用原始ID查找配置: petId=${monsterId}, originalPetId=${originalPetId}`);
        }

        if (ogreConfig) {
          Logger.Debug(
            `[BattleManager] 野怪配置: petId=${monsterId}, originalPetId=${originalPetId}, slot=${monsterIndex}, ` +
            `level=${ogreConfig.level}, minLevel=${ogreConfig.minLevel}, maxLevel=${ogreConfig.maxLevel}`
          );

          // 优先使用配置的等级（必须是有效数字）
          if (ogreConfig.level !== undefined && ogreConfig.level !== null && typeof ogreConfig.level === 'number') {
            monsterLevel = ogreConfig.level;
            Logger.Debug(`[BattleManager] 使用固定等级: ${monsterLevel}`);
          } else if (ogreConfig.minLevel !== undefined && ogreConfig.maxLevel !== undefined) {
            // 如果配置了等级范围，随机生成
            monsterLevel = Math.floor(
              Math.random() * (ogreConfig.maxLevel - ogreConfig.minLevel + 1) + ogreConfig.minLevel
            );
            Logger.Debug(`[BattleManager] 随机等级: ${monsterLevel} (范围: ${ogreConfig.minLevel}-${ogreConfig.maxLevel})`);
          }
        } else {
          Logger.Warn(`[BattleManager] 未找到精灵配置: mapId=${mapId}, petId=${monsterId}, originalPetId=${originalPetId}, slot=${monsterIndex}`);
        }
      }

      // 限制等级范围 1-100
      monsterLevel = Math.max(1, Math.min(monsterLevel, 100));

      // 创建战斗实例
      const battle = await this._initService.CreatePVEBattle(this.UserID, monsterId, monsterLevel);

      if (!battle) {
        // 检查是否是因为没有健康的精灵
        const healthyPets = this.Player.PetManager.PetData.GetPetsInBag().filter(p => p.hp > 0);
        if (healthyPets.length === 0) {
          await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(10017));
          Logger.Warn(`[BattleManager] 玩家所有精灵已阵亡: UserID=${this.UserID}`);
        } else {
          await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5001));
          Logger.Warn(`[BattleManager] 创建战斗失败: UserID=${this.UserID}`);
        }
        return;
      }

      // 保存战斗槽位信息（用于战斗结束后刷新）
      this._currentBattleSlot = monsterIndex;
      this._currentBattleMapId = mapId;
      this._currentBattleOriginalPetId = ogres[monsterIndex].originalPetId;

      // 初始化战斗
      this.InitializeBattle(battle);

      // 1. 先发送 2408 确认（空响应）
      await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER));

      // 2. 然后发送 NOTE_READY_TO_FIGHT (2503)
      await this.SendReadyToFight(battle, '野生精灵');

      Logger.Info(`[BattleManager] 挑战野外精灵: UserID=${this.UserID}, Index=${monsterIndex}, PetId=${monsterId}, Level=${monsterLevel}`);
    } catch (error) {
      Logger.Error(`[BattleManager] HandleFightNpcMonster failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5000));
    }
  }

  /**
   * 处理挑战BOSS
   * CMD 2411: CHALLENGE_BOSS
   * 发送 2411 确认 + NOTE_READY_TO_FIGHT (2503)
   * 
   * 1. 优先从 (mapId, param2) 查找BOSS配置
   * 2. 如果未找到且该地图有param2=0的配置，回退到param2=0
   * 3. 如果仍未找到，记录警告
   */
  public async HandleChallengeBoss(mapId: number, param2: number): Promise<void> {
    try {
      // 清理旧战斗（如果存在）
      if (this._currentBattle) {
        this.CleanupBattle();
      }

      // 1. 尝试从 (mapId, param2) 查找BOSS配置
      let bossConfig = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
      let actualParam2 = param2;

      if (bossConfig) {
        Logger.Info(
          `[BattleManager] 从配置获取BOSS: MapId=${mapId}, Param2=${param2} -> ` +
          `PetId=${bossConfig.petId}, Level=${bossConfig.level}`
        );
      } else {
        // 2. 该地图在配置中但param2不匹配：按单BOSS地图回退到param2=0
        bossConfig = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, 0);
        if (bossConfig) {
          actualParam2 = 0;
          Logger.Info(
            `[BattleManager] param2未命中，回退到 MapId=${mapId}, Param2=0 -> ` +
            `PetId=${bossConfig.petId}, Level=${bossConfig.level}`
          );
        } else {
          // 3. 配置未找到
          Logger.Warn(
            `[BattleManager] 配置未找到: MapId=${mapId}, Param2=${param2}`
          );
        }
      }

      // 使用CreateBossBattle方法
      const battle = await this._initService.CreateBossBattle(this.UserID, mapId, actualParam2);

      if (!battle) {
        const healthyPets = this.Player.PetManager.PetData.GetPetsInBag().filter(p => p.hp > 0);
        if (healthyPets.length === 0) {
          await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(10017));
          Logger.Warn(`[BattleManager] 玩家所有精灵已阵亡: UserID=${this.UserID}`);
        } else {
          await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(5001));
          Logger.Warn(`[BattleManager] 创建BOSS战斗失败: UserID=${this.UserID}, MapId=${mapId}, Param2=${param2}`);
        }
        return;
      }

      // 初始化战斗
      this.InitializeBattle(battle);

      await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS));
      await this.SendReadyToFight(battle, 'BOSS');

      Logger.Info(`[BattleManager] 挑战BOSS: UserID=${this.UserID}, MapId=${mapId}, Param2=${actualParam2}`);
    } catch (error) {
      Logger.Error(`[BattleManager] HandleChallengeBoss failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(5000));
    }
  }

  /**
   * 处理准备战斗
   * CMD 2404: READY_TO_FIGHT
   * 发送 NOTE_START_FIGHT (2504)
   */
  public async HandleReadyToFight(): Promise<void> {
    // 检查是否是PVP战斗
    const pvpRoom = PvpBattleManager.Instance.GetPlayerRoom(this.Player.Uid);

    if (pvpRoom) {
      await this.HandlePvpReadyToFight(pvpRoom);
      return;
    }

    // PVE战斗准备
    if (!this._currentBattle) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.READY_TO_FIGHT).setResult(5001));
      return;
    }

    if (!this._initService.ValidateBattle(this._currentBattle)) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.READY_TO_FIGHT).setResult(5002));
      return;
    }

    // 初始化HP记录（记录首发精灵）
    this._battlePetHPMap.clear();
    this._battlePetHPMap.set(this._currentBattle.player.catchTime, this._currentBattle.player.hp);

    // 重置BOSS特殊规则状态
    BossSpecialRules.ResetBattleState(this._currentBattle.enemy.id);

    // 战斗开始效果
    const battleStartResults = BattleEffectIntegration.OnBattleStart(this._currentBattle);
    Logger.Debug(`[BattleManager] 战斗开始效果: ${battleStartResults.length}个结果`);

    const playerPet = BattleConverter.ToFightPetInfo(this._currentBattle.player, this.Player.Uid, 0);
    const enemyPet = BattleConverter.ToFightPetInfo(this._currentBattle.enemy, 0, 1);

    await this.Player.SendPacket(new PacketNoteStartFight(0, playerPet, enemyPet));

    Logger.Info(`[BattleManager] 准备战斗(PVE): UserID=${this.Player.Uid}`);
  }

  /**
   * 处理PVP战斗准备
   */
  private async HandlePvpReadyToFight(pvpRoom: any): Promise<void> {
    const allReady = PvpBattleManager.Instance.SetPlayerReady(this.Player.Uid);

    if (!allReady) {
      Logger.Info(`[BattleManager] PVP战斗准备: UserID=${this.Player.Uid}, 等待对手准备`);
      return;
    }

    Logger.Info(`[BattleManager] PVP战斗双方准备完毕，开始创建战斗实例`);

    const player1Session = OnlineTracker.Instance.GetPlayerSession(pvpRoom.player1Id);
    const player2Session = OnlineTracker.Instance.GetPlayerSession(pvpRoom.player2Id);

    if (!player1Session?.Player || !player2Session?.Player) {
      Logger.Error(`[BattleManager] 无法获取PVP玩家实例`);
      return;
    }

    const battle = await this.CreatePvpBattle(player1Session.Player, player2Session.Player);

    if (!battle) {
      Logger.Error(`[BattleManager] 创建PVP战斗失败`);
      return;
    }

    player1Session.Player.BattleManager.InitializeBattle(battle);
    player2Session.Player.BattleManager.InitializeBattle(battle);

    // 初始化对手的HP记录（player2视角）
    player2Session.Player.BattleManager._battlePetHPMap.set(battle.enemy.catchTime, battle.enemy.hp);

    const battleStartResults = BattleEffectIntegration.OnBattleStart(battle);
    Logger.Debug(`[BattleManager] PVP战斗开始效果: ${battleStartResults.length}个结果`);

    const player1Pet = BattleConverter.ToFightPetInfo(battle.player, pvpRoom.player1Id, 0);
    const player2Pet = BattleConverter.ToFightPetInfo(battle.enemy, pvpRoom.player2Id, 0);

    Logger.Debug(
      `[BattleManager] 发送NOTE_START_FIGHT给玩家1: ` +
      `player1Pet(userId=${player1Pet.userID}, petId=${player1Pet.petID}, name=${player1Pet.petName}), ` +
      `player2Pet(userId=${player2Pet.userID}, petId=${player2Pet.petID}, name=${player2Pet.petName})`
    );

    Logger.Debug(
      `[BattleManager] 发送NOTE_START_FIGHT给玩家2: ` +
      `player2Pet(userId=${player2Pet.userID}, petId=${player2Pet.petID}, name=${player2Pet.petName}), ` +
      `player1Pet(userId=${player1Pet.userID}, petId=${player1Pet.petID}, name=${player1Pet.petName})`
    );

    await player1Session.Player.SendPacket(new PacketNoteStartFight(0, player1Pet, player2Pet));
    await player2Session.Player.SendPacket(new PacketNoteStartFight(0, player2Pet, player1Pet));

    Logger.Info(
      `[BattleManager] PVP战斗开始: player1=${pvpRoom.player1Id}, player2=${pvpRoom.player2Id}`
    );
  }

  /**
   * 创建PVP战斗实例
   */
  private async CreatePvpBattle(
    player1: PlayerInstance,
    player2: PlayerInstance
  ): Promise<IBattleInfo | null> {
    try {
      const player1Pets = player1.PetManager.PetData.GetPetsInBag();
      const player2Pets = player2.PetManager.PetData.GetPetsInBag();

      const player1HealthyPets = player1Pets.filter(p => p.hp > 0);
      const player2HealthyPets = player2Pets.filter(p => p.hp > 0);

      if (player1HealthyPets.length === 0 || player2HealthyPets.length === 0) {
        Logger.Warn(`[BattleManager] PVP战斗创建失败：有玩家没有健康精灵`);
        return null;
      }

      const player1Pet = player1HealthyPets.find(p => p.isDefault) || player1HealthyPets[0];
      const player2Pet = player2HealthyPets.find(p => p.isDefault) || player2HealthyPets[0];

      const player1PetConfig = GameConfig.GetPetById(player1Pet.petId);
      const player2PetConfig = GameConfig.GetPetById(player2Pet.petId);

      if (!player1PetConfig || !player2PetConfig) {
        Logger.Warn(`[BattleManager] PVP战斗创建失败：找不到精灵配置`);
        return null;
      }

      const player1BattlePet = this._initService['BuildBattlePet'](
        player1Pet.petId,
        player1Pet.nick || player1PetConfig.DefName || 'Pet',
        player1Pet.level, player1Pet.hp, player1Pet.maxHp,
        player1Pet.atk, player1Pet.def, player1Pet.spAtk, player1Pet.spDef, player1Pet.speed,
        player1PetConfig.Type || 0,
        player1Pet.skillArray.filter((s: number) => s > 0).length > 0 ? player1Pet.skillArray.filter((s: number) => s > 0) : [10001],
        player1Pet.catchTime, 0
      );

      const player2BattlePet = this._initService['BuildBattlePet'](
        player2Pet.petId,
        player2Pet.nick || player2PetConfig.DefName || 'Pet',
        player2Pet.level, player2Pet.hp, player2Pet.maxHp,
        player2Pet.atk, player2Pet.def, player2Pet.spAtk, player2Pet.spDef, player2Pet.speed,
        player2PetConfig.Type || 0,
        player2Pet.skillArray.filter((s: number) => s > 0).length > 0 ? player2Pet.skillArray.filter((s: number) => s > 0) : [10001],
        player2Pet.catchTime, 0
      );

      const battle: IBattleInfo = {
        userId: player1.Uid,
        player: player1BattlePet,
        enemy: player2BattlePet,
        turn: 0,
        isOver: false,
        isPvp: true,
        player2Id: player2.Uid,
        startTime: Date.now()
      };

      return battle;
    } catch (error) {
      Logger.Error(`[BattleManager] 创建PVP战斗失败`, error as Error);
      return null;
    }
  }

  // ==================== 技能使用 ====================

  /**
   * 处理使用技能
   * CMD 2405: USE_SKILL
   */
  public async HandleUseSkill(skillId: number): Promise<void> {
    await this.Player.SendPacket(new PacketEmpty(CommandID.USE_SKILL));

    if (!this._currentBattle || this._currentBattle.isOver) {
      Logger.Warn(`[BattleManager] 没有进行中的战斗: UserID=${this.UserID}`);
      return;
    }

    if (this._currentBattle.isPvp === true) {
      await this.HandlePvpUseSkill(skillId);
      return;
    }

    // PvE战斗
    this.DeductSkillPP(this._currentBattle.player, skillId);
    const currentTurn = this._currentBattle.turn;

    const result = this._turnService.ExecuteTurn(this._currentBattle, skillId);
    const { firstAttack, secondAttack } = this.BuildAttackValuePair(result, this.UserID, 0);

    await this.Player.SendPacket(new PacketNoteUseSkill(firstAttack, secondAttack));
    this.UpdatePlayerHPRecord();

    if (await this.CheckPlayerPetDeath()) return;

    if (result.isOver) {
      await this.HandleFightOver(result.winner || 0, result.reason || 0);
    }

    Logger.Info(`[BattleManager] 使用技能: UserID=${this.UserID}, SkillId=${skillId}, Turn=${currentTurn}`);
  }

  /**
   * 处理PVP战斗中的技能使用
   */
  private async HandlePvpUseSkill(skillId: number): Promise<void> {
    if (!this._currentBattle || !this._currentBattle.player2Id) {
      Logger.Error(`[BattleManager] PVP战斗数据异常`);
      return;
    }

    const isPlayer1 = this.UserID === this._currentBattle.userId;
    const myPet = isPlayer1 ? this._currentBattle.player : this._currentBattle.enemy;

    this.DeductSkillPP(myPet, skillId);

    const action: IPvpAction = { type: 'skill', skillId };
    const bothReady = PvpBattleManager.Instance.SetPlayerAction(this.UserID, action);

    if (!bothReady) {
      Logger.Info(`[BattleManager] PVP等待对手提交动作: UserID=${this.UserID}, SkillId=${skillId}`);
      return;
    }

    await this.ResolvePvpTurn();
  }

  /**
   * PVP回合结算
   */
  private async ResolvePvpTurn(): Promise<void> {
    if (!this._currentBattle || !this._currentBattle.player2Id) return;

    const actions = PvpBattleManager.Instance.GetActions(this.UserID);
    if (!actions) {
      Logger.Error(`[BattleManager] ResolvePvpTurn: 获取动作失败`);
      return;
    }

    const { player1Action, player2Action, player1Id, player2Id } = actions;

    const player1Session = OnlineTracker.Instance.GetPlayerSession(player1Id);
    const player2Session = OnlineTracker.Instance.GetPlayerSession(player2Id);

    const player1ChangePet = player1Action.type === 'changePet';
    const player2ChangePet = player2Action.type === 'changePet';

    // 处理换精灵动作（在结算前执行）
    if (player1ChangePet && player1Action.catchTime) {
      await this.ExecutePvpChangePet(player1Id, player1Action.catchTime, true);
    }
    if (player2ChangePet && player2Action.catchTime) {
      await this.ExecutePvpChangePet(player2Id, player2Action.catchTime, false);
    }

    // 如果双方都换精灵，不执行技能回合，直接结束
    if (player1ChangePet && player2ChangePet) {
      Logger.Info(`[BattleManager] PVP双方都换精灵，跳过技能回合`);
      PvpBattleManager.Instance.ClearActions(this.UserID);
      return;
    }

    // 确定双方的技能ID（换精灵的一方技能ID为0）
    const player1SkillId = player1ChangePet ? 0 : (player1Action.skillId || 0);
    const player2SkillId = player2ChangePet ? 0 : (player2Action.skillId || 0);

    Logger.Info(
      `[BattleManager] PVP回合结算: player1(${player1Id}) ` +
      `action=${player1ChangePet ? 'changePet' : 'skill'} skill=${player1SkillId}, ` +
      `player2(${player2Id}) action=${player2ChangePet ? 'changePet' : 'skill'} skill=${player2SkillId}`
    );

    // 执行PVP回合（传入pet2SkillId）
    const result = this._turnService.ExecuteTurn(this._currentBattle, player1SkillId, player2SkillId);

    // 构建攻击结果并发送给双方
    const { firstAttack, secondAttack } = this.BuildAttackValuePair(result, player1Id, player2Id);

    if (player1Session?.Player) {
      await player1Session.Player.SendPacket(new PacketNoteUseSkill(firstAttack, secondAttack));
    }
    if (player2Session?.Player) {
      await player2Session.Player.SendPacket(new PacketNoteUseSkill(firstAttack, secondAttack));
    }

    // 更新HP记录
    if (player1Session?.Player) {
      player1Session.Player.BattleManager._battlePetHPMap.set(
        this._currentBattle.player.catchTime, this._currentBattle.player.hp
      );
    }
    if (player2Session?.Player) {
      player2Session.Player.BattleManager._battlePetHPMap.set(
        this._currentBattle.enemy.catchTime, this._currentBattle.enemy.hp
      );
    }

    PvpBattleManager.Instance.ClearActions(this.UserID);

    const p1Hp = this._currentBattle.player.hp;
    const p2Hp = this._currentBattle.enemy.hp;

    await this.CheckPvpBattleEnd(result, player1Id, player2Id);

    Logger.Info(
      `[BattleManager] PVP回合结算完成: player1HP=${p1Hp}, player2HP=${p2Hp}, isOver=${result.isOver}`
    );
  }

  /**
   * 执行PVP换精灵
   */
  private async ExecutePvpChangePet(userId: number, catchTime: number, isPlayer1: boolean): Promise<void> {
    if (!this._currentBattle) return;

    const session = OnlineTracker.Instance.GetPlayerSession(userId);
    if (!session?.Player) return;

    const playerPets = session.Player.PetManager.PetData.GetPetsInBag();
    const newPet = playerPets.find(p => p.catchTime === catchTime);
    if (!newPet) return;

    const petConfig = GameConfig.GetPetById(newPet.petId);
    if (!petConfig) return;

    const battlePet = isPlayer1 ? this._currentBattle.player : this._currentBattle.enemy;

    // 保存旧精灵的HP
    const oldCatchTime = battlePet.catchTime;
    const battleManager = session.Player.BattleManager;
    battleManager._battlePetHPMap.set(oldCatchTime, battlePet.hp);

    this.UpdateBattlePet(battlePet, newPet, petConfig);
    battleManager._battlePetHPMap.set(newPet.catchTime, battlePet.hp);

    // 发送换精灵通知给双方
    const opponentId = isPlayer1 ? this._currentBattle.player2Id! : this._currentBattle.userId;
    const opponentSession = OnlineTracker.Instance.GetPlayerSession(opponentId);

    await session.Player.SendPacket(new PacketChangePet(
      userId, newPet.petId,
      newPet.nick || petConfig.DefName || 'Pet',
      newPet.level, battlePet.hp, battlePet.maxHp, newPet.catchTime
    ));

    if (opponentSession?.Player) {
      await opponentSession.Player.SendPacket(new PacketChangePet(
        userId, newPet.petId,
        newPet.nick || petConfig.DefName || 'Pet',
        newPet.level, battlePet.hp, battlePet.maxHp, newPet.catchTime
      ));
    }

    Logger.Info(`[BattleManager] PVP换精灵: userId=${userId}, newPetId=${newPet.petId}, isPlayer1=${isPlayer1}`);
  }

  /**
   * 检查PVP战斗结束条件
   */
  private async CheckPvpBattleEnd(
    result: { isOver: boolean; winner?: number; reason?: number },
    player1Id: number,
    player2Id: number
  ): Promise<void> {
    if (!this._currentBattle) return;

    const player1Session = OnlineTracker.Instance.GetPlayerSession(player1Id);
    const player2Session = OnlineTracker.Instance.GetPlayerSession(player2Id);

    if (this._currentBattle.player.hp <= 0) {
      const p1Pets = player1Session?.Player?.PetManager.PetData.GetPetsInBag();
      const p1HasHealthy = p1Pets?.some(p => p.hp > 0 && p.catchTime !== this._currentBattle!.player.catchTime);

      if (!p1HasHealthy) {
        this._currentBattle.isOver = true;
        await this.HandleFightOver(player2Id, 0);
        return;
      }
      Logger.Info(`[BattleManager] PVP玩家1精灵阵亡，等待切换`);
    }

    if (this._currentBattle.enemy.hp <= 0) {
      const p2Pets = player2Session?.Player?.PetManager.PetData.GetPetsInBag();
      const p2HasHealthy = p2Pets?.some(p => p.hp > 0 && p.catchTime !== this._currentBattle!.enemy.catchTime);

      if (!p2HasHealthy) {
        this._currentBattle.isOver = true;
        await this.HandleFightOver(player1Id, 0);
        return;
      }
      Logger.Info(`[BattleManager] PVP玩家2精灵阵亡，等待切换`);
    }

    if (result.isOver) {
      await this.HandleFightOver(result.winner || 0, result.reason || 0);
    }
  }

  // ==================== 战斗结束 ====================

  /**
   * 处理战斗结束
   */
  private async HandleFightOver(winnerId: number, reason: number): Promise<void> {
    if (!this._currentBattle) return;

    const isPvp = this._currentBattle.isPvp === true;

    await this.SyncBattlePetHP();

    const battleEndResults = BattleEffectIntegration.OnBattleEnd(this._currentBattle, winnerId);
    Logger.Debug(`[BattleManager] 战斗结束效果: ${battleEndResults.length}个结果`);

    // PVE胜利奖励
    let rewardItems: Array<{ itemId: number; itemCnt: number }> = [];
    if (!isPvp && winnerId === this.UserID) {
      const reward = await this._rewardService.ProcessVictoryReward(
        this.UserID,
        this._currentBattle,
        this._currentBattleMapId >= 0 ? this._currentBattleMapId : undefined,
        this._currentBattleSlot >= 0 ? this._currentBattleSlot : undefined,
        this._currentBattleOriginalPetId >= 0 ? this._currentBattleOriginalPetId : undefined
      );
      rewardItems = reward.rewardItems;
      Logger.Info(`[BattleManager] 战斗胜利奖励: Exp=${reward.expGained}, Coins=${reward.coinsGained}, LevelUp=${reward.levelUp}, Drops=${reward.droppedItems.length}, RewardItems=${rewardItems.length}`);
    }

    // 发送战斗结束包
    await this.SendFightOverPacket(this.Player, reason, winnerId);

    // PVP通知对手
    if (isPvp) {
      await this.NotifyPvpOpponentFightOver(reason, winnerId);
    }

    // PVE清理地图
    if (!isPvp) {
      await this.CleanupPveMap();
    }

    // 延迟推送物品奖励弹窗（仅PVE）
    if (!isPvp && rewardItems.length > 0) {
      setTimeout(async () => {
        await this.Player.SendPacket(new PacketBattleReward(rewardItems));
        Logger.Info(`[BattleManager] 推送物品奖励弹窗: RewardItems=${rewardItems.length}`);
      }, 1200);
    }

    this.CleanupBattle();

    Logger.Info(`[BattleManager] 战斗结束: Winner=${winnerId}, Reason=${reason}, IsPvp=${isPvp}`);
  }

  // ==================== 道具/换精灵/捕捉/逃跑 ====================

  /**
   * 处理使用精灵道具
   * CMD 2406: USE_PET_ITEM
   */
  public async HandleUsePetItem(itemId: number): Promise<void> {
    if (!this._currentBattle || this._currentBattle.isOver) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5001));
      return;
    }

    const healAmount = 50;
    const oldHp = this._currentBattle.player.hp;
    this._currentBattle.player.hp = Math.min(
      this._currentBattle.player.maxHp,
      this._currentBattle.player.hp + healAmount
    );
    const actualHeal = this._currentBattle.player.hp - oldHp;

    await this.Player.SendPacket(new PacketUsePetItem(
      this.UserID, itemId,
      this._currentBattle.player.hp, actualHeal
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

    try {
      const isPvp = this._currentBattle.isPvp === true;

      const validated = this.ValidateChangePet(catchTime, isPvp);
      if (!validated) return;

      const { newPet, petConfig } = validated;

      // PVP模式：换精灵作为回合动作
      if (isPvp) {
        const action: IPvpAction = { type: 'changePet', catchTime };
        const bothReady = PvpBattleManager.Instance.SetPlayerAction(this.UserID, action);

        if (!bothReady) {
          Logger.Info(`[BattleManager] PVP换精灵，等待对手: UserID=${this.UserID}, CatchTime=${catchTime}`);
          return;
        }

        await this.ResolvePvpTurn();
        return;
      }

      // PVE模式：立即执行
      this.UpdateBattlePet(this._currentBattle.player, newPet, petConfig);
      this._battlePetHPMap.set(newPet.catchTime, this._currentBattle.player.hp);

      // 发送切换精灵数据（包含CommandID.CHANGE_PET）
      await this.Player.SendPacket(new PacketChangePet(
        this.UserID, newPet.petId,
        newPet.nick || petConfig.DefName || 'Pet',
        newPet.level,
        this._currentBattle.player.hp,
        this._currentBattle.player.maxHp,
        newPet.catchTime
      ));

      Logger.Info(
        `[BattleManager] 更换精灵: UserID=${this.UserID}, PetId=${newPet.petId}, ` +
        `HP=${this._currentBattle.player.hp}/${this._currentBattle.player.maxHp}, CatchTime=${catchTime}`
      );

      // 敌方反击
      await this.ExecuteEnemyCounterAndSend();
      await this.CheckPlayerPetDeath();

      Logger.Info(`[BattleManager] 更换精灵成功: UserID=${this.UserID}, PetId=${newPet.petId}, CatchTime=${catchTime}`);
    } catch (error) {
      Logger.Error(`[BattleManager] 更换精灵失败`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5000));
    }
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

    const catchResult = this._turnService.Catch(this._currentBattle);

    if (catchResult.success) {
      const success = await this._rewardService.ProcessCatch(
        this.UserID,
        this._currentBattle,
        catchResult.catchTime,
        this._currentBattleMapId >= 0 ? this._currentBattleMapId : undefined,
        this._currentBattleSlot >= 0 ? this._currentBattleSlot : undefined
      );

      if (success) {
        const enemyId = this._currentBattle.enemy.id;

        await this.Player.SendPacket(new PacketCatchMonster(catchResult.catchTime, enemyId));

        // 发送战斗结束协议（reason=6表示捕捉成功）
        await this.SendFightOverPacket(this.Player, 6, this.UserID);

        // 清理地图
        await this.CleanupPveMap();

        this.CleanupBattle();

        Logger.Info(
          `[BattleManager] 捕获成功: UserID=${this.UserID}, PetId=${enemyId}, ` +
          `捕获率=${catchResult.catchRate.toFixed(2)}%, 摇晃次数=${catchResult.shakeCount}`
        );
      } else {
        // 捕获成功但入库失败（理论上不应该发生，因为 GivePet 已处理背包满情况）
        await this.Player.SendPacket(new PacketEmpty(CommandID.CATCH_MONSTER).setResult(5003));
        Logger.Error(`[BattleManager] 捕获成功但入库失败: UserID=${this.UserID}`);
      }
    } else {
      // 捕获失败
      await this.Player.SendPacket(new PacketCatchMonster(0, this._currentBattle.enemy.id));
      Logger.Info(
        `[BattleManager] 捕获失败: UserID=${this.UserID}, ` +
        `捕获率=${catchResult.catchRate.toFixed(2)}%, 摇晃次数=${catchResult.shakeCount}`
      );

      // 敌方反击
      await this.ExecuteEnemyCounterAndSend();

      // 检查是否被打败
      if (this._currentBattle.player.hp <= 0) {
        this._currentBattle.isOver = true;
        await this.HandleFightOver(0, 0);
      }

      Logger.Info(`[BattleManager] 捕获失败后敌人反击: 玩家HP=${this._currentBattle?.player.hp}, 敌人HP=${this._currentBattle?.enemy.hp}`);
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

    Logger.Info(`[BattleManager] 逃跑成功: UserID=${this.UserID}`);

    await this.SyncBattlePetHP();

    await this.Player.SendPacket(new PacketEscapeFight(1));

    // 发送战斗结束包 (reason=1 表示逃跑)
    await this.SendFightOverPacket(this.Player, 1, 0);

    this.CleanupBattle();
  }

  // ==================== 查询/生命周期 ====================

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
    if (!this._currentBattle) return;

    Logger.Info(`[BattleManager] 玩家登出，清理战斗: UserID=${this.UserID}`);

    // 如果是PVP战斗，通知对手战斗结束（对手获胜）
    if (this._currentBattle.isPvp === true && this._currentBattle.player2Id) {
      const opponentId = this.UserID === this._currentBattle.userId
        ? this._currentBattle.player2Id
        : this._currentBattle.userId;

      Logger.Info(`[BattleManager] PVP战斗中玩家掉线，通知对手: opponentId=${opponentId}`);

      const opponentSession = OnlineTracker.Instance.GetPlayerSession(opponentId);
      if (opponentSession?.Player) {
        // 对手获胜（reason=1 表示对方中途退出）
        await this.SendFightOverPacket(opponentSession.Player, 1, opponentId);
        await opponentSession.Player.BattleManager.SyncBattlePetHP();
        opponentSession.Player.BattleManager.CleanupBattle();
      }

      // 清理PVP房间
      const roomKey = PvpBattleManager.Instance['GetRoomKey'](
        this._currentBattle.userId,
        this._currentBattle.player2Id
      );
      PvpBattleManager.Instance.RemoveBattleRoom(roomKey);
    }

    // 清理本地战斗数据
    this.CleanupBattle();
  }

  /**
   * 构建玩家背包中所有精灵的SimplePetInfoProto数组
   */
  public BuildPlayerPetsInfo(): SimplePetInfoProto[] {
    return this.Player.PetManager.PetData.GetPetsInBag().map(pet => {
      const petConfig = GameConfig.GetPetById(pet.petId);
      const skills = pet.skillArray.filter(s => s > 0);
      const finalSkills = skills.length > 0 ? skills : [10001];

      const skillsWithPP = finalSkills.map(skillId => {
        const skillConfig = GameConfig.GetSkillById(skillId);
        return {
          id: skillId,
          pp: skillConfig?.MaxPP || 20
        };
      });

      return new SimplePetInfoProto()
        .setPetId(pet.petId)
        .setLevel(pet.level)
        .setHP(pet.hp, pet.maxHp)
        .setSkills(skillsWithPP)
        .setCatchTime(pet.catchTime)
        .setCatchMap(301)
        .setCatchLevel(pet.level)
        .setSkinID(0);
    });
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 发送战斗准备通知 (NOTE_READY_TO_FIGHT)
   */
  private async SendReadyToFight(battle: IBattleInfo, enemyNickname: string = ''): Promise<void> {
    const playerNick = this.Player.Data.nick || `Player${this.UserID}`;
    const playerPets = this.BuildPlayerPetsInfo();
    const enemyPets = [BattleConverter.ToSimplePetInfo(battle.enemy)];

    // 如果是BOSS战斗，使用BOSS配置中的petName作为敌人昵称
    let actualEnemyNickname = enemyNickname;
    if (battle.bossMapId !== undefined && battle.bossParam2 !== undefined) {
      const bossConfig = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(battle.bossMapId, battle.bossParam2);
      if (bossConfig && bossConfig.petName) {
        actualEnemyNickname = bossConfig.petName;
      }
    }

    await this.Player.SendPacket(new PacketNoteReadyToFight(
      this.UserID,
      playerNick,
      playerPets,
      0,
      actualEnemyNickname,
      enemyPets
    ));
  }

  /**
   * 检查是否是BOSS战斗
   */
  private async IsBossBattle(mapId: number, slot: number): Promise<boolean> {
    const mapConfig = GameConfig.GetMapConfigById(mapId);
    if (!mapConfig) return false;

    const ogre = mapConfig.ogres.find((o: any) => o.slot === slot);
    return ogre?.isBoss === true;
  }

  /**
   * 发送BOSS移除通知
   */
  private async SendBossRemovalNotification(region: number): Promise<void> {
    const bossRemoval = this.Player.MapSpawnManager.RemoveBoss(region);
    if (bossRemoval) {
      await this.Player.SendPacket(new PacketMapBoss([bossRemoval]));
      Logger.Info(`[BattleManager] 推送BOSS移除通知: region=${region}`);
    }
  }

  /**
   * 发送野怪列表更新
   */
  private async SendOgreListUpdate(): Promise<void> {
    const mapId = this.Player.Data.mapID || 1;
    const ogres = this.Player.MapSpawnManager.GetMapOgres(mapId);

    if (ogres.length > 0) {
      await this.Player.SendPacket(new PacketMapOgreList(ogres));
      Logger.Info(`[BattleManager] 推送野怪列表更新: mapId=${mapId}, count=${ogres.length}`);
    }
  }
}
