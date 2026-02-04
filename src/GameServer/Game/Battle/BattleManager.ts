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
import { BattleEffectIntegration } from './BattleEffectIntegration';
import { SimplePetInfoProto } from '../../../shared/proto/common/SimplePetInfoProto';
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

    // 更新基本属性
    battlePet.petId = newPet.petId;
    battlePet.id = newPet.petId;
    battlePet.name = newPet.nick || petConfig.DefName || 'Pet';
    battlePet.level = newPet.level;
    battlePet.hp = newPet.hp;
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
        Logger.Warn(`[BattleManager] 同步HP失败: 未找到精灵 catchTime=${catchTime}`);
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

  /**
   * 处理挑战野外精灵
   * CMD 2408: FIGHT_NPC_MONSTER
   * 发送 2408 确认 + NOTE_READY_TO_FIGHT (2503)
   */
  public async HandleFightNpcMonster(monsterIndex: number): Promise<void> {
    try {
      // 清理旧战斗（如果存在）
      if (this._currentBattle) {
        Logger.Debug(`[BattleManager] 清理旧战斗: UserID=${this.UserID}`);
        this._currentBattle = null;
        this._currentBattleSlot = -1;
        this._currentBattleMapId = -1;
        this._battlePetHPMap.clear();
      }

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
          // 10017: 精灵体力不足（所有精灵阵亡）
          await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(10017));
          Logger.Warn(`[BattleManager] 玩家所有精灵已阵亡: UserID=${this.UserID}`);
        } else {
          // 其他原因导致创建失败
          await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5001));
          Logger.Warn(`[BattleManager] 创建战斗失败: UserID=${this.UserID}`);
        }
        return;
      }

      // 保存战斗槽位信息（用于战斗结束后刷新）
      this._currentBattle = battle;
      this._currentBattleSlot = monsterIndex;
      this._currentBattleMapId = mapId;
      this._currentBattleOriginalPetId = ogres[monsterIndex].originalPetId; // 保存原始精灵ID

      // 1. 先发送 2408 确认（空响应）
      await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER));

      // 获取玩家昵称
      const playerNick = this.Player.Data.nick || `Player${this.UserID}`;

      // 使用转换器构建精灵信息（链式调用）
      // 发送玩家背包中所有精灵的信息，以便客户端切换精灵时能找到精灵数据
      const playerPets = this.Player.PetManager.PetData.GetPetsInBag().map(pet => {
        const petConfig = GameConfig.GetPetById(pet.petId);
        const petType = petConfig?.Type || 0;
        const skills = pet.skillArray.filter(s => s > 0);
        const finalSkills = skills.length > 0 ? skills : [10001];
        
        // 获取技能PP
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
    // 清理旧战斗（如果存在）
    if (this._currentBattle) {
      Logger.Debug(`[BattleManager] 清理旧战斗: UserID=${this.UserID}`);
      this._currentBattle = null;
      this._currentBattleSlot = -1;
      this._currentBattleMapId = -1;
      this._battlePetHPMap.clear();
    }

    const bossLevel = 1;

    const battle = await this._initService.CreatePVEBattle(this.UserID, bossId, bossLevel);
    
    if (!battle) {
      // 检查是否是因为没有健康的精灵
      const healthyPets = this.Player.PetManager.PetData.GetPetsInBag().filter(p => p.hp > 0);
      if (healthyPets.length === 0) {
        // 10017: 精灵体力不足（所有精灵阵亡）
        await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(10017));
        Logger.Warn(`[BattleManager] 玩家所有精灵已阵亡: UserID=${this.UserID}`);
      } else {
        // 其他原因导致创建失败
        await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(5001));
        Logger.Warn(`[BattleManager] 创建战斗失败: UserID=${this.UserID}`);
      }
      return;
    }

    this._currentBattle = battle;

    // 获取玩家昵称
    const playerNick = this.Player.Data.nick || `Player${this.UserID}`;

    // 使用转换器构建精灵信息（链式调用）
    // 发送玩家背包中所有精灵的信息，以便客户端切换精灵时能找到精灵数据
    const playerPets = this.Player.PetManager.PetData.GetPetsInBag().map(pet => {
      const petConfig = GameConfig.GetPetById(pet.petId);
      const petType = petConfig?.Type || 0;
      const skills = pet.skillArray.filter(s => s > 0);
      const finalSkills = skills.length > 0 ? skills : [10001];
      
      // 获取技能PP
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

    // 初始化HP记录（记录首发精灵）
    this._battlePetHPMap.clear();
    this._battlePetHPMap.set(this._currentBattle.player.catchTime, this._currentBattle.player.hp);

    // ==================== 战斗开始效果 ====================
    const battleStartResults = BattleEffectIntegration.OnBattleStart(this._currentBattle);
    Logger.Debug(`[BattleManager] 战斗开始效果: ${battleStartResults.length}个结果`);

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

    // 扣除玩家技能PP
    const playerPet = this._currentBattle.player;
    const skillIndex = playerPet.skills.indexOf(skillId);
    if (skillIndex !== -1 && playerPet.skillPP && playerPet.skillPP[skillIndex] > 0) {
      playerPet.skillPP[skillIndex]--;
      Logger.Debug(`[BattleManager] 扣除技能PP: SkillId=${skillId}, 剩余PP=${playerPet.skillPP[skillIndex]}`);
    }

    // 保存当前回合数（因为战斗结束后会清理 _currentBattle）
    const currentTurn = this._currentBattle.turn;

    // 2. 执行回合
    const result = this._turnService.ExecuteTurn(this._currentBattle, skillId);

    // 3. 使用转换器构建攻击结果（链式调用）
    // 判断谁是先手攻击者
    const firstAttacker = result.firstAttack?.userId === this.UserID 
      ? this._currentBattle.player 
      : this._currentBattle.enemy;
    const secondAttacker = result.secondAttack?.userId === this.UserID 
      ? this._currentBattle.player 
      : this._currentBattle.enemy;
    
    // 重要：修正 firstAttack 的 attackerRemainHp
    // 因为 firstAttack 执行后，攻击者可能被 secondAttack 反击了
    // 所以需要使用当前战斗状态的HP，而不是 firstAttack 记录的HP
    if (result.firstAttack && firstAttacker) {
      result.firstAttack.attackerRemainHp = firstAttacker.hp;
    }
    
    const firstAttack = BattleConverter.ToAttackValue(
      result.firstAttack,
      this.UserID,
      this._currentBattle.player.hp,
      this._currentBattle.player.maxHp,
      this._currentBattle.player.status,
      this._currentBattle.player.battleLv,
      this._currentBattle.player.type,
      firstAttacker  // 传递攻击者精灵信息
    );

    const secondAttack = BattleConverter.ToAttackValue(
      result.secondAttack,
      0,
      this._currentBattle.enemy.hp,
      this._currentBattle.enemy.maxHp,
      this._currentBattle.enemy.status,
      this._currentBattle.enemy.battleLv,
      this._currentBattle.enemy.type,
      secondAttacker  // 传递攻击者精灵信息
    );

    // 发送 NOTE_USE_SKILL (2505)
    await this.Player.SendPacket(new PacketNoteUseSkill(firstAttack, secondAttack));

    // 更新当前精灵的HP记录
    if (this._currentBattle && this._currentBattle.player) {
      this._battlePetHPMap.set(
        this._currentBattle.player.catchTime, 
        this._currentBattle.player.hp
      );
    }

    // 4. 检查玩家精灵是否阵亡
    if (this._currentBattle.player.hp <= 0) {
      // 检查是否还有其他健康精灵
      const playerPets = this.Player.PetManager.PetData.GetPetsInBag();
      const currentCatchTime = this._currentBattle.player.catchTime;
      const hasHealthyPet = playerPets.some(p => p.hp > 0 && p.catchTime !== currentCatchTime);
      
      if (!hasHealthyPet) {
        // 没有健康精灵，战斗失败
        Logger.Info(`[BattleManager] 所有精灵阵亡，战斗失败: UserID=${this.UserID}`);
        this._currentBattle.isOver = true;
        await this.HandleFightOver(0, 0); // 敌人胜利
        return;
      } else {
        // 还有健康精灵，客户端会自动弹出精灵选择面板
        Logger.Info(`[BattleManager] 当前精灵阵亡，等待切换精灵: UserID=${this.UserID}`);
        // 不发送 FIGHT_OVER，等待客户端发送 CHANGE_PET
        return;
      }
    }

    // 5. 如果战斗结束（敌人被击败），发送 FIGHT_OVER (2506)
    if (result.isOver) {
      await this.HandleFightOver(result.winner || 0, result.reason || 0);
    }

    Logger.Info(`[BattleManager] 使用技能: UserID=${this.UserID}, SkillId=${skillId}, Turn=${currentTurn}`);
  }

  /**
   * 处理战斗结束
   * 发送 FIGHT_OVER (2506) + 物品奖励弹窗
   */
  private async HandleFightOver(winnerId: number, reason: number): Promise<void> {
    if (!this._currentBattle) return;

    // ==================== 同步玩家精灵HP ====================
    // 战斗结束后，将战斗中的精灵HP同步回玩家的精灵数据
    await this.SyncBattlePetHP();

    // ==================== 战斗结束效果 ====================
    const battleEndResults = BattleEffectIntegration.OnBattleEnd(this._currentBattle, winnerId);
    Logger.Debug(`[BattleManager] 战斗结束效果: ${battleEndResults.length}个结果`);

    // 保存奖励信息（稍后发送）
    let rewardItems: Array<{ itemId: number; itemCnt: number }> = [];

    // 如果玩家胜利，处理奖励
    if (winnerId === this.UserID) {
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

    // 获取玩家的各种次数信息
    const playerData = this.Player.Data;
    const twoTimes = playerData.twoTimes || 0;
    const threeTimes = playerData.threeTimes || 0;
    const autoFightTimes = playerData.autoFightTimes || 0;
    const energyTimes = playerData.energyTimes || 0;
    const learnTimes = playerData.learnTimes || 0;

    // 发送 FIGHT_OVER (2506)
    await this.Player.SendPacket(new PacketFightOver(
      reason, 
      winnerId,
      twoTimes,
      threeTimes,
      autoFightTimes,
      energyTimes,
      learnTimes
    ));

    // 战斗结束后移除野怪并推送更新
    if (this._currentBattleSlot >= 0) {
      MapSpawnManager.Instance.OnBattleEnd(this.UserID, this._currentBattleSlot);
      Logger.Info(`[BattleManager] 战斗结束，移除野怪: userId=${this.UserID}, slot=${this._currentBattleSlot}`);
      
      // 推送野怪列表更新
      await this.SendOgreListUpdate();
      
      // 如果是BOSS战斗，推送BOSS移除通知
      if (this._currentBattleMapId >= 0 && await this.IsBossBattle(this._currentBattleMapId, this._currentBattleSlot)) {
        await this.SendBossRemovalNotification(this._currentBattleSlot);
      }
    }

    // 在所有战斗相关协议发送完毕后，延迟推送物品奖励弹窗
    // 客户端在战斗结束后1秒才刷新地图，需要等待地图刷新完成后再发送物品通知
    // 延迟1200ms确保客户端已完全退出战斗状态并刷新地图
    if (rewardItems.length > 0) {
      setTimeout(async () => {
        // 发送物品奖励弹窗（客户端会显示 ItemInBagAlert）
        await this.Player.SendPacket(new PacketBattleReward(rewardItems));
        Logger.Info(`[BattleManager] 推送物品奖励弹窗: RewardItems=${rewardItems.length}`);
      }, 1200);
    }

    // 清理战斗实例
    this._currentBattle = null;
    this._currentBattleSlot = -1;
    this._currentBattleMapId = -1;
    this._currentBattleOriginalPetId = -1;

    Logger.Info(`[BattleManager] 战斗结束: Winner=${winnerId}, Reason=${reason}`);
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
    const bossRemoval = MapSpawnManager.Instance.RemoveBoss(this.UserID, region);
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
    const ogres = MapSpawnManager.Instance.GetMapOgres(this.UserID, mapId);
    
    // 只有当有野怪时才推送
    if (ogres.length > 0) {
      await this.Player.SendPacket(new PacketMapOgreList(ogres));
      Logger.Info(`[BattleManager] 推送野怪列表更新: mapId=${mapId}, count=${ogres.length}`);
    }
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
   * 更换精灵会消耗玩家的回合，敌人会立即反击
   */
  public async HandleChangePet(catchTime: number): Promise<void> {
    if (!this._currentBattle || this._currentBattle.isOver) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5001));
      return;
    }

    try {
      // 1. 根据 catchTime 查找精灵
      const playerPets = this.Player.PetManager.PetData.GetPetsInBag();
      const newPet = playerPets.find(p => p.catchTime === catchTime);
      
      if (!newPet) {
        Logger.Warn(`[BattleManager] 未找到精灵: CatchTime=${catchTime}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5001));
        return;
      }

      // 2. 检查是否是当前精灵
      if (this._currentBattle.player.catchTime === catchTime) {
        Logger.Warn(`[BattleManager] 尝试切换到当前精灵: CatchTime=${catchTime}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5002));
        return;
      }

      // 3. 检查精灵是否已阵亡
      if (newPet.hp <= 0) {
        Logger.Warn(`[BattleManager] 精灵已阵亡: CatchTime=${catchTime}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5003));
        return;
      }

      // 4. 获取精灵配置
      const petConfig = GameConfig.GetPetById(newPet.petId);
      if (!petConfig) {
        Logger.Warn(`[BattleManager] 找不到精灵配置: PetId=${newPet.petId}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5001));
        return;
      }

      // 5. 更新战斗精灵数据
      this.UpdateBattlePet(this._currentBattle.player, newPet, petConfig);

      // 记录切换前精灵的HP（如果被击杀，HP会是0）
      // 注意：这里记录的是切换后的新精灵HP，旧精灵HP已经在战斗中更新了
      this._battlePetHPMap.set(newPet.catchTime, newPet.hp);

      // 6. 发送更换精灵响应
      await this.Player.SendPacket(new PacketChangePet(
        this.UserID,
        newPet.petId,
        newPet.nick || petConfig.DefName || 'Pet',
        newPet.level,
        newPet.hp,
        newPet.maxHp,
        newPet.catchTime
      ));

      Logger.Info(
        `[BattleManager] 发送更换精灵响应: UserID=${this.UserID}, PetId=${newPet.petId}, ` +
        `Name=${newPet.nick || petConfig.DefName}, Level=${newPet.level}, ` +
        `HP=${newPet.hp}/${newPet.maxHp}, CatchTime=${catchTime}`
      );

      // 7. 更换精灵消耗玩家回合，敌人立即反击
      const enemyAttackResult = this._turnService.ExecuteEnemyTurn(this._currentBattle);
      
      // 构建攻击结果
      // firstAttack: 玩家更换精灵，没有攻击（skillID=0, damage=0）
      const playerStatusArray = new Array(20).fill(0);
      if (this._currentBattle.player.status !== undefined) {
        playerStatusArray[this._currentBattle.player.status] = 1;
      }
      
      const firstAttack = BattleConverter.ToAttackValue(
        {
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
        },
        this.UserID,
        this._currentBattle.player.hp,
        this._currentBattle.player.maxHp,
        this._currentBattle.player.status,
        this._currentBattle.player.battleLv,
        this._currentBattle.player.type,
        this._currentBattle.player
      );

      // secondAttack: 敌人的反击
      const secondAttack = BattleConverter.ToAttackValue(
        enemyAttackResult,
        0,
        this._currentBattle.enemy.hp,
        this._currentBattle.enemy.maxHp,
        this._currentBattle.enemy.status,
        this._currentBattle.enemy.battleLv,
        this._currentBattle.enemy.type,
        this._currentBattle.enemy
      );

      // 8. 发送 NOTE_USE_SKILL (2505) - 让客户端知道敌人反击了
      await this.Player.SendPacket(new PacketNoteUseSkill(firstAttack, secondAttack));

      // 更新当前精灵的HP记录（敌人反击后）
      this._battlePetHPMap.set(
        this._currentBattle.player.catchTime, 
        this._currentBattle.player.hp
      );

      // 9. 检查战斗是否结束
      // 如果玩家精灵阵亡，检查是否还有其他健康精灵
      if (this._currentBattle.player.hp <= 0) {
        const playerPets = this.Player.PetManager.PetData.GetPetsInBag();
        const hasHealthyPet = playerPets.some(p => p.hp > 0);
        
        if (!hasHealthyPet) {
          // 没有健康精灵，战斗失败
          this._currentBattle.isOver = true;
          await this.HandleFightOver(0, 0); // 敌人胜利
          Logger.Info(`[BattleManager] 更换精灵后战斗失败: 没有健康精灵`);
        } else {
          // 还有健康精灵，客户端会自动弹出精灵选择面板
          Logger.Info(`[BattleManager] 更换精灵后当前精灵阵亡，等待玩家选择下一只精灵`);
        }
      }

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

    // 尝试捕获（使用普通精灵球）
    const catchResult = this._turnService.Catch(this._currentBattle);

    if (catchResult.success) {
      // 处理捕获
      const success = await this._rewardService.ProcessCatch(
        this.UserID,
        this._currentBattle,
        catchResult.catchTime,
        this._currentBattleMapId >= 0 ? this._currentBattleMapId : undefined,
        this._currentBattleSlot >= 0 ? this._currentBattleSlot : undefined
      );

      if (success) {
        const enemyId = this._currentBattle.enemy.id;
        
        // 1. 发送捕捉成功协议
        await this.Player.SendPacket(new PacketCatchMonster(catchResult.catchTime, enemyId));
        
        // 2. 发送战斗结束协议（reason=6表示捕捉成功）
        const playerData = this.Player.Data;
        await this.Player.SendPacket(new PacketFightOver(
          6,  // reason=6: 捕捉成功
          this.UserID,  // 玩家胜利
          playerData.twoTimes || 0,
          playerData.threeTimes || 0,
          playerData.autoFightTimes || 0,
          playerData.energyTimes || 0,
          playerData.learnTimes || 0
        ));
        
        // 3. 战斗结束后移除野怪并推送更新
        if (this._currentBattleSlot >= 0) {
          MapSpawnManager.Instance.OnBattleEnd(this.UserID, this._currentBattleSlot);
          Logger.Info(`[BattleManager] 捕获成功，移除野怪: userId=${this.UserID}, slot=${this._currentBattleSlot}`);
          
          // 推送野怪列表更新
          await this.SendOgreListUpdate();
          
          // 如果是BOSS战斗，推送BOSS移除通知
          if (this._currentBattleMapId >= 0 && await this.IsBossBattle(this._currentBattleMapId, this._currentBattleSlot)) {
            await this.SendBossRemovalNotification(this._currentBattleSlot);
          }
        }
        
        // 4. 清理战斗实例
        this._currentBattle = null;
        this._currentBattleSlot = -1;
        this._currentBattleMapId = -1;
        this._currentBattleOriginalPetId = -1;
        
        Logger.Info(
          `[BattleManager] 捕获成功: UserID=${this.UserID}, PetId=${enemyId}, ` +
          `捕获率=${catchResult.catchRate.toFixed(2)}%, 摇晃次数=${catchResult.shakeCount}`
        );
      } else {
        await this.Player.SendPacket(new PacketEmpty(CommandID.CATCH_MONSTER).setResult(5003));
      }
    } else {
      // 捕获判定失败（摇晃失败或前置检查失败）- 发送 catchTime=0 的包，播放失败动画
      await this.Player.SendPacket(new PacketCatchMonster(0, this._currentBattle.enemy.id));
      Logger.Info(
        `[BattleManager] 捕获失败: UserID=${this.UserID}, ` +
        `捕获率=${catchResult.catchRate.toFixed(2)}%, 摇晃次数=${catchResult.shakeCount}`
      );
      
      // 捕捉失败后，只有敌人反击（玩家使用道具不攻击）
      // 构建一个只有敌人攻击的回合结果
      const enemyAttackResult = this._turnService.ExecuteEnemyTurn(this._currentBattle);
      
      // 构建攻击结果
      // firstAttack: 玩家使用道具，没有攻击（skillID=0, damage=0）
      // 将玩家状态转换为状态数组
      const playerStatusArray = new Array(20).fill(0);
      if (this._currentBattle.player.status !== undefined) {
        playerStatusArray[this._currentBattle.player.status] = 1;
      }
      
      const firstAttack = BattleConverter.ToAttackValue(
        {
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
        },
        this.UserID,
        this._currentBattle.player.hp,
        this._currentBattle.player.maxHp,
        this._currentBattle.player.status,
        this._currentBattle.player.battleLv,
        this._currentBattle.player.type,
        this._currentBattle.player  // 传递玩家精灵信息
      );

      // secondAttack: 敌人的反击
      const secondAttack = BattleConverter.ToAttackValue(
        enemyAttackResult,
        0,
        this._currentBattle.enemy.hp,
        this._currentBattle.enemy.maxHp,
        this._currentBattle.enemy.status,
        this._currentBattle.enemy.battleLv,
        this._currentBattle.enemy.type,
        this._currentBattle.enemy  // 传递敌人精灵信息
      );

      // 发送 NOTE_USE_SKILL (2505) - 让客户端知道敌人反击了
      await this.Player.SendPacket(new PacketNoteUseSkill(firstAttack, secondAttack));

      // 如果战斗结束（玩家被敌人打败），发送 FIGHT_OVER
      if (this._currentBattle.player.hp <= 0) {
        this._currentBattle.isOver = true;
        await this.HandleFightOver(0, 0); // 敌人胜利
      }
      
      Logger.Info(`[BattleManager] 捕获失败后敌人反击: 玩家HP=${this._currentBattle.player.hp}, 敌人HP=${this._currentBattle.enemy.hp}`);
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

    // 逃跑总是成功（没有失败的设定）
    Logger.Info(`[BattleManager] 逃跑成功: UserID=${this.UserID}`);
    
    // 1. 发送逃跑成功响应
    await this.Player.SendPacket(new PacketEscapeFight(1));
    
    // 2. 发送战斗结束包 (reason=1 表示逃跑)
    const playerData = this.Player.Data;
    await this.Player.SendPacket(new PacketFightOver(
      1,  // reason=1: 逃跑
      0,  // winnerId=0: 无胜者
      playerData.twoTimes || 0,
      playerData.threeTimes || 0,
      playerData.autoFightTimes || 0,
      playerData.energyTimes || 0,
      playerData.learnTimes || 0
    ));
    
    // 逃跑成功不移除野怪（野怪还在）
    // 只有战斗胜利或捕获成功才移除野怪
    
    // 清理战斗实例
    this._currentBattle = null;
    this._currentBattleSlot = -1;
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
