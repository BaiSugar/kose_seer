import { Logger } from '../../../../shared/utils';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { IBattleInfo, IBattlePet, BattleStatus } from '../../../../shared/models/BattleModel';

/**
 * 战斗初始化服�?
 * 负责创建战斗实例、初始化精灵数据
 */
export class BattleInitService {
  private _player: PlayerInstance;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 创建PVE战斗（玩�?vs BOSS�?
   */
  public async CreatePVEBattle(userId: number, bossId: number, bossLevel: number): Promise<IBattleInfo | null> {
    try {
      // 1. 获取玩家首发精灵
      const playerPet = await this._player.PetRepo.FindDefault();
      if (!playerPet) {
        Logger.Warn(`[BattleInitService] 玩家没有首发精灵: UserID=${userId}`);
        return null;
      }

      // 2. 构建玩家精灵数据
      const playerBattlePet = this.BuildBattlePet(
        playerPet.petId,
        playerPet.nick || 'Pet',
        playerPet.level,
        playerPet.hp,
        playerPet.maxHp,
        playerPet.atk,
        playerPet.def,
        playerPet.spAtk,
        playerPet.spDef,
        playerPet.speed,
        0, // type - 需要从配置读取
        playerPet.skillArray,
        playerPet.catchTime
      );

      // 3. 构建BOSS精灵数据
      const bossStats = this.CalculateBossStats(bossId, bossLevel);
      const bossSkills = this.GetBossSkills(bossId, bossLevel);
      
      const enemyBattlePet = this.BuildBattlePet(
        bossId,
        `Boss${bossId}`,
        bossLevel,
        bossStats.hp,
        bossStats.maxHp,
        bossStats.attack,
        bossStats.defence,
        bossStats.spAtk,
        bossStats.spDef,
        bossStats.speed,
        0, // type
        bossSkills,
        0
      );

      // 4. 创建战斗实例
      const battle: IBattleInfo = {
        userId,
        player: playerBattlePet,
        enemy: enemyBattlePet,
        turn: 0,
        isOver: false,
        aiType: this.GetBossAIType(bossId),
        startTime: Math.floor(Date.now() / 1000)
      };

      Logger.Info(`[BattleInitService] 创建战斗: UserID=${userId}, Pet=${playerPet.petId}(Lv${playerPet.level}) vs Boss=${bossId}(Lv${bossLevel})`);
      return battle;

    } catch (error) {
      Logger.Error(`[BattleInitService] 创建战斗失败: ${error}`);
      return null;
    }
  }

  /**
   * 构建战斗精灵数据
   */
  private BuildBattlePet(
    id: number,
    name: string,
    level: number,
    hp: number,
    maxHp: number,
    attack: number,
    defence: number,
    spAtk: number,
    spDef: number,
    speed: number,
    type: number,
    skills: number[],
    catchTime: number
  ): IBattlePet {
    return {
      petId: id,
      id,
      name,
      level,
      hp,
      maxHp,
      attack,
      defence,
      spAtk,
      spDef,
      speed,
      type,
      skills: skills.filter(s => s > 0),
      catchTime,
      statusArray: new Array(20).fill(0),
      battleLv: new Array(6).fill(0),
      status: BattleStatus.NONE,
      statusTurns: 0,
      flinched: false,
      bound: false,
      boundTurns: 0,
      fatigue: false,
      fatigueTurns: 0,
      battleLevels: [0, 0, 0, 0, 0, 0],
      effectCounters: {},
      skillPP: skills.filter(s => s > 0).map(() => 20),
      lastMove: 0,
      encore: false,
      encoreTurns: 0
    };
  }

  /**
   * 计算BOSS属�?
   * 简化公式：基础�?* 等级系数
   */
  private CalculateBossStats(bossId: number, level: number): {
    hp: number;
    maxHp: number;
    attack: number;
    defence: number;
    spAtk: number;
    spDef: number;
    speed: number;
  } {
    // 基础属性（可以从配置文件读取）
    const baseHp = 50 + bossId * 2;
    const baseAtk = 40 + bossId;
    const baseDef = 35 + bossId;
    const baseSpAtk = 40 + bossId;
    const baseSpDef = 35 + bossId;
    const baseSpeed = 30 + bossId;

    // 等级系数
    const levelMultiplier = 1 + (level - 1) * 0.1;

    const hp = Math.floor(baseHp * levelMultiplier);
    
    return {
      hp,
      maxHp: hp,
      attack: Math.floor(baseAtk * levelMultiplier),
      defence: Math.floor(baseDef * levelMultiplier),
      spAtk: Math.floor(baseSpAtk * levelMultiplier),
      spDef: Math.floor(baseSpDef * levelMultiplier),
      speed: Math.floor(baseSpeed * levelMultiplier)
    };
  }

  /**
   * 获取BOSS技能列�?
   */
  private GetBossSkills(bossId: number, level: number): number[] {
    // 简化：返回基础技�?
    // 实际应该从配置文件读�?
    const skills = [10001]; // 撞击

    if (level >= 5) skills.push(10002);  // �?
    if (level >= 10) skills.push(10003); // 电击
    if (level >= 15) skills.push(10004); // 火花

    return skills;
  }

  /**
   * 获取BOSS的AI类型
   */
  private GetBossAIType(bossId: number): string {
    // 简化：所有BOSS使用随机AI
    // 实际可以根据bossId返回不同AI类型
    return 'random';
  }

  /**
   * 验证战斗是否有效
   */
  public ValidateBattle(battle: IBattleInfo | null): boolean {
    if (!battle) return false;
    if (battle.isOver) return false;
    if (battle.player.hp <= 0 || battle.enemy.hp <= 0) return false;
    return true;
  }
}
