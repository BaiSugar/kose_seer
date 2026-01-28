import { Logger } from '../../../../shared/utils';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { IBattleInfo, IBattlePet, BattleStatus } from '../../../../shared/models/BattleModel';
import { GameConfig } from '../../../../shared/config/game/GameConfig';

/**
 * 战斗初始化服务
 * 负责创建战斗实例、初始化精灵数据
 */
export class BattleInitService {
  private _player: PlayerInstance;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 创建PVE战斗（玩家 vs BOSS/野怪）
   */
  public async CreatePVEBattle(userId: number, enemyId: number, enemyLevel: number): Promise<IBattleInfo | null> {
    try {
      // 1. 获取玩家首发精灵
      const playerPets = this._player.PetManager.PetData.GetPetsInBag();
      const playerPet = playerPets.find(p => p.isDefault) || playerPets[0];
      if (!playerPet) {
        Logger.Warn(`[BattleInitService] 玩家没有首发精灵: UserID=${userId}`);
        return null;
      }

      // 2. 从配置获取玩家精灵的类型
      const playerPetConfig = GameConfig.GetPetById(playerPet.petId);
      const playerType = playerPetConfig?.Type || 0;

      // 3. 确保玩家精灵有技能（如果没有，使用默认技能）
      let playerSkills = playerPet.skillArray.filter(s => s > 0);
      if (playerSkills.length === 0) {
        // 默认技能：撞击
        playerSkills = [10001];
        Logger.Warn(`[BattleInitService] 玩家精灵没有技能，使用默认技能: UserID=${userId}, PetId=${playerPet.petId}`);
      }

      // 4. 构建玩家精灵数据
      const playerBattlePet = this.BuildBattlePet(
        playerPet.petId,
        playerPet.nick || playerPetConfig?.DefName || 'Pet',
        playerPet.level,
        playerPet.hp,      // 使用当前HP
        playerPet.maxHp,
        playerPet.atk,
        playerPet.def,
        playerPet.spAtk,
        playerPet.spDef,
        playerPet.speed,
        playerType,
        playerSkills,
        playerPet.catchTime
      );

      // 4. 从配置获取敌人精灵信息
      const enemyPetConfig = GameConfig.GetPetById(enemyId);
      if (!enemyPetConfig) {
        Logger.Warn(`[BattleInitService] 找不到精灵配置: PetId=${enemyId}`);
        return null;
      }

      // 5. 计算敌人属性
      const enemyStats = this.CalculateEnemyStats(enemyPetConfig, enemyLevel);
      let enemySkills = this.GetEnemySkills(enemyId, enemyLevel);
      
      // 确保敌人有技能
      if (enemySkills.length === 0) {
        enemySkills = [10001]; // 默认：撞击
      }
      
      const enemyBattlePet = this.BuildBattlePet(
        enemyId,
        enemyPetConfig.DefName || `Enemy${enemyId}`,
        enemyLevel,
        enemyStats.hp,
        enemyStats.maxHp,
        enemyStats.attack,
        enemyStats.defence,
        enemyStats.spAtk,
        enemyStats.spDef,
        enemyStats.speed,
        enemyPetConfig.Type || 0,
        enemySkills,
        0
      );

      // 6. 创建战斗实例
      const battle: IBattleInfo = {
        userId,
        player: playerBattlePet,
        enemy: enemyBattlePet,
        turn: 0,
        isOver: false,
        aiType: 'random',
        startTime: Math.floor(Date.now() / 1000)
      };

      Logger.Info(`[BattleInitService] 创建战斗: UserID=${userId}, Pet=${playerPet.petId}(Lv${playerPet.level}) vs Enemy=${enemyId}(Lv${enemyLevel})`);
      return battle;

    } catch (error) {
      Logger.Error(`[BattleInitService] 创建战斗失败`, error as Error);
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
    // 过滤无效技能，但确保至少有一个技能
    const validSkills = skills.filter(s => s > 0);
    const finalSkills = validSkills.length > 0 ? validSkills : [10001]; // 默认撞击
    
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
      skills: finalSkills,
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
      skillPP: finalSkills.map(() => 20),
      lastMove: 0,
      encore: false,
      encoreTurns: 0
    };
  }

  /**
   * 计算敌人属性
   * 基于配置的基础属性 + 等级成长
   */
  private CalculateEnemyStats(petConfig: any, level: number): {
    hp: number;
    maxHp: number;
    attack: number;
    defence: number;
    spAtk: number;
    spDef: number;
    speed: number;
  } {
    // 从配置读取基础属性
    const baseHp = petConfig.HP || 50;
    const baseAtk = petConfig.Atk || 40;
    const baseDef = petConfig.Def || 35;
    const baseSpAtk = petConfig.SpAtk || 40;
    const baseSpDef = petConfig.SpDef || 35;
    const baseSpeed = petConfig.Spd || 30;

    // 等级成长公式（简化版）
    // HP: base + (base * 0.1 * (level - 1))
    // 其他: base + (base * 0.05 * (level - 1))
    const hp = Math.floor(baseHp + (baseHp * 0.1 * (level - 1)));
    
    return {
      hp,
      maxHp: hp,
      attack: Math.floor(baseAtk + (baseAtk * 0.05 * (level - 1))),
      defence: Math.floor(baseDef + (baseDef * 0.05 * (level - 1))),
      spAtk: Math.floor(baseSpAtk + (baseSpAtk * 0.05 * (level - 1))),
      spDef: Math.floor(baseSpDef + (baseSpDef * 0.05 * (level - 1))),
      speed: Math.floor(baseSpeed + (baseSpeed * 0.05 * (level - 1)))
    };
  }

  /**
   * 获取敌人技能列表
   * 从配置读取该精灵在指定等级可学会的技能
   */
  private GetEnemySkills(petId: number, level: number): number[] {
    // TODO: 从技能配置读取该精灵的可学技能
    // 暂时返回基础技能
    const skills = [10001]; // 撞击

    if (level >= 5) skills.push(10002);  // 叫声
    if (level >= 10) skills.push(10006); // 抓
    if (level >= 15) skills.push(20004); // 火花

    return skills.slice(0, 4); // 最多4个技能
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
