/**
 * SPT (Species) 配置系统
 * 负责精灵种族数据的读取和查询
 * 
 * 移植自: luvit/luvit_version/game/seer_pets.lua
 * 
 * 功能：
 * - 精灵种族值查询
 * - 可学习技能查询
 * - 进化链查询
 * - 额外技能查询
 * 
 * 数据来源：config/data/xml/spt.xml
 */

import { GameConfig } from '../../../shared/config/game/GameConfig';
import { Logger } from '../../../shared/utils';
import { IPetMonster, ILearnableMove } from '../../../shared/config/XmlConfigInterfaces';

/**
 * 可学习技能信息接口
 */
export interface ILearnableSkillInfo {
  id: number;        // 技能ID
  level: number;     // 学习等级
}

/**
 * SPT 系统类
 */
export class SptSystem {

  /**
   * 精灵数据缓存
   * petId -> IPetMonster
   */
  private static petCache: Map<number, IPetMonster> | null = null;

  /**
   * 可学习技能缓存
   * petId -> ILearnableSkillInfo[]
   */
  private static learnableMovesCache: Map<number, ILearnableSkillInfo[]> | null = null;

  /**
   * 加载 SPT 数据
   */
  private static LoadSptData(): void {
    if (this.petCache && this.learnableMovesCache) {
      return;
    }

    try {
      const sptConfig = GameConfig.GetSptConfig();
      if (!sptConfig || !sptConfig.Monsters) {
        Logger.Warn('[SptSystem] SPT 配置未加载');
        this.petCache = new Map();
        this.learnableMovesCache = new Map();
        return;
      }

      this.petCache = new Map();
      this.learnableMovesCache = new Map();

      const monsters = sptConfig.Monsters.Monster;
      if (!monsters) {
        return;
      }

      const monsterArray = Array.isArray(monsters) ? monsters : [monsters];

      for (const monster of monsterArray) {
        const petId = monster.ID;

        // 缓存精灵数据
        this.petCache.set(petId, monster);

        // 解析可学习技能
        const learnableMoves: ILearnableSkillInfo[] = [];
        
        if (monster.LearnableMoves && monster.LearnableMoves.Move) {
          const moves = monster.LearnableMoves.Move;
          const moveArray = Array.isArray(moves) ? moves : [moves];

          for (const move of moveArray) {
            learnableMoves.push({
              id: move.ID,
              level: move.LearningLv
            });
          }

          // 按等级排序
          learnableMoves.sort((a, b) => a.level - b.level);
        }

        this.learnableMovesCache.set(petId, learnableMoves);
      }

      Logger.Info(`[SptSystem] 加载 SPT 数据完成: ${this.petCache.size} 个精灵`);
    } catch (error) {
      Logger.Error('[SptSystem] 加载 SPT 数据失败', error as Error);
      this.petCache = new Map();
      this.learnableMovesCache = new Map();
    }
  }

  // ==================== 精灵查询 ====================

  /**
   * 获取精灵数据
   * 
   * @param petId 精灵ID
   * @returns 精灵数据，不存在返回null
   */
  public static GetPet(petId: number): IPetMonster | null {
    this.LoadSptData();
    return this.petCache?.get(petId) || null;
  }

  /**
   * 检查精灵是否存在
   * 
   * @param petId 精灵ID
   * @returns 是否存在
   */
  public static Exists(petId: number): boolean {
    this.LoadSptData();
    return this.petCache?.has(petId) || false;
  }

  /**
   * 获取精灵名称
   * 
   * @param petId 精灵ID
   * @returns 精灵名称
   */
  public static GetName(petId: number): string {
    const pet = this.GetPet(petId);
    return pet?.DefName || `Pet${petId}`;
  }

  /**
   * 获取所有精灵ID
   * 
   * @returns 精灵ID数组
   */
  public static GetAllPetIds(): number[] {
    this.LoadSptData();
    return Array.from(this.petCache?.keys() || []);
  }

  // ==================== 可学习技能查询 ====================

  /**
   * 获取精灵的所有可学习技能
   * 
   * @param petId 精灵ID
   * @returns 可学习技能列表
   */
  public static GetLearnableMoves(petId: number): ILearnableSkillInfo[] {
    this.LoadSptData();
    return this.learnableMovesCache?.get(petId) || [];
  }

  /**
   * 获取精灵在指定等级可学习的技能
   * 
   * @param petId 精灵ID
   * @param level 等级
   * @returns 可学习技能列表（等级 <= level）
   */
  public static GetLearnableMovesByLevel(petId: number, level: number): ILearnableSkillInfo[] {
    const allMoves = this.GetLearnableMoves(petId);
    return allMoves.filter(move => move.level <= level);
  }

  /**
   * 获取精灵的默认技能（最后学会的4个技能）
   * 
   * @param petId 精灵ID
   * @param level 等级
   * @returns 默认技能列表（最多4个）
   */
  public static GetDefaultSkills(petId: number, level: number): ILearnableSkillInfo[] {
    const availableMoves = this.GetLearnableMovesByLevel(petId, level);
    
    // 获取最后4个技能
    const startIdx = Math.max(0, availableMoves.length - 4);
    return availableMoves.slice(startIdx);
  }

  /**
   * 检查精灵是否可以学习指定技能
   * 
   * @param petId 精灵ID
   * @param skillId 技能ID
   * @returns 是否可以学习
   */
  public static CanLearnMove(petId: number, skillId: number): boolean {
    const moves = this.GetLearnableMoves(petId);
    return moves.some(move => move.id === skillId);
  }

  /**
   * 获取技能的学习等级
   * 
   * @param petId 精灵ID
   * @param skillId 技能ID
   * @returns 学习等级，如果不能学习则返回-1
   */
  public static GetMoveLearnLevel(petId: number, skillId: number): number {
    const moves = this.GetLearnableMoves(petId);
    const move = moves.find(m => m.id === skillId);
    return move ? move.level : -1;
  }

  /**
   * 获取精灵在升级时新学会的技能
   * 
   * @param petId 精灵ID
   * @param newLevel 新等级
   * @returns 新学会的技能列表
   */
  public static GetNewMovesOnLevelUp(petId: number, newLevel: number): ILearnableSkillInfo[] {
    const moves = this.GetLearnableMoves(petId);
    return moves.filter(move => move.level === newLevel);
  }

  // ==================== 额外技能查询 ====================

  /**
   * 获取精灵的额外技能（第五技能等）
   * 
   * @param petId 精灵ID
   * @returns 额外技能ID列表
   */
  public static GetExtraMoves(petId: number): number[] {
    const pet = this.GetPet(petId);
    if (!pet || !pet.ExtraMoves || !pet.ExtraMoves.Move) {
      return [];
    }

    const moves = pet.ExtraMoves.Move;
    return Array.isArray(moves) ? moves : [moves];
  }

  /**
   * 检查技能是否为额外技能
   * 
   * @param petId 精灵ID
   * @param skillId 技能ID
   * @returns 是否为额外技能
   */
  public static IsExtraMove(petId: number, skillId: number): boolean {
    const extraMoves = this.GetExtraMoves(petId);
    return extraMoves.includes(skillId);
  }

  // ==================== 进化链查询 ====================

  /**
   * 获取精灵的进化前形态
   * 
   * @param petId 精灵ID
   * @returns 进化前形态ID，如果是初始形态则返回0
   */
  public static GetEvolvesFrom(petId: number): number {
    const pet = this.GetPet(petId);
    return pet?.EvolvesFrom || 0;
  }

  /**
   * 获取精灵的进化后形态
   * 
   * @param petId 精灵ID
   * @returns 进化后形态ID，如果是最终形态则返回0
   */
  public static GetEvolvesTo(petId: number): number {
    const pet = this.GetPet(petId);
    return pet?.EvolvesTo || 0;
  }

  /**
   * 获取精灵的进化等级
   * 
   * @param petId 精灵ID
   * @returns 进化等级，如果不能进化则返回0
   */
  public static GetEvolvingLevel(petId: number): number {
    const pet = this.GetPet(petId);
    return pet?.EvolvingLv || 0;
  }

  /**
   * 检查精灵是否可以进化
   * 
   * @param petId 精灵ID
   * @param level 当前等级
   * @returns 是否可以进化
   */
  public static CanEvolve(petId: number, level: number): boolean {
    const pet = this.GetPet(petId);
    if (!pet || !pet.EvolvesTo || pet.EvolvesTo === 0) {
      return false;
    }

    const evolvingLv = pet.EvolvingLv || 0;
    return level >= evolvingLv;
  }

  /**
   * 获取精灵的完整进化链
   * 
   * @param petId 精灵ID
   * @returns 进化链（从初始形态到最终形态）
   */
  public static GetEvolutionChain(petId: number): number[] {
    const chain: number[] = [];
    
    // 向前查找起始形态
    let currentId = petId;
    while (currentId > 0) {
      const evolvesFrom = this.GetEvolvesFrom(currentId);
      if (evolvesFrom === 0) {
        break;
      }
      currentId = evolvesFrom;
    }

    // 从起始形态向后遍历
    while (currentId > 0) {
      chain.push(currentId);
      const evolvesTo = this.GetEvolvesTo(currentId);
      if (evolvesTo === 0) {
        break;
      }
      currentId = evolvesTo;
    }

    return chain;
  }

  /**
   * 检查精灵是否为初始形态
   * 
   * @param petId 精灵ID
   * @returns 是否为初始形态
   */
  public static IsBaseForm(petId: number): boolean {
    return this.GetEvolvesFrom(petId) === 0;
  }

  /**
   * 检查精灵是否为最终形态
   * 
   * @param petId 精灵ID
   * @returns 是否为最终形态
   */
  public static IsFinalForm(petId: number): boolean {
    return this.GetEvolvesTo(petId) === 0;
  }

  // ==================== 种族值查询 ====================

  /**
   * 获取精灵的种族值
   * 
   * @param petId 精灵ID
   * @returns 种族值对象
   */
  public static GetBaseStats(petId: number): {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    spd: number;
  } | null {
    const pet = this.GetPet(petId);
    if (!pet) {
      return null;
    }

    return {
      hp: pet.HP || 50,
      atk: pet.Atk || 50,
      def: pet.Def || 50,
      spAtk: pet.SpAtk || 50,
      spDef: pet.SpDef || 50,
      spd: pet.Spd || 50
    };
  }

  /**
   * 获取精灵的种族值总和
   * 
   * @param petId 精灵ID
   * @returns 种族值总和
   */
  public static GetBaseStatsTotal(petId: number): number {
    const stats = this.GetBaseStats(petId);
    if (!stats) {
      return 0;
    }

    return stats.hp + stats.atk + stats.def + stats.spAtk + stats.spDef + stats.spd;
  }

  // ==================== 其他属性查询 ====================

  /**
   * 获取精灵的属性类型
   * 
   * @param petId 精灵ID
   * @returns { type1: 主属性, type2: 副属性（可选） }
   */
  public static GetTypes(petId: number): { type1: number; type2?: number } {
    const pet = this.GetPet(petId);
    if (!pet) {
      return { type1: 8 }; // 默认普通属性
    }

    return {
      type1: pet.Type || 8,
      type2: pet.Type2
    };
  }

  /**
   * 获取精灵的捕获率
   * 
   * @param petId 精灵ID
   * @returns 捕获率 (0-255)
   */
  public static GetCatchRate(petId: number): number {
    const pet = this.GetPet(petId);
    return pet?.CatchRate || 255;
  }

  /**
   * 检查精灵是否可以放生
   * 
   * @param petId 精灵ID
   * @returns 是否可以放生
   */
  public static CanRelease(petId: number): boolean {
    const pet = this.GetPet(petId);
    return (pet?.FreeForbidden || 0) === 0;
  }

  /**
   * 检查精灵是否为稀有精灵
   * 
   * @param petId 精灵ID
   * @returns 是否为稀有精灵
   */
  public static IsRare(petId: number): boolean {
    const pet = this.GetPet(petId);
    return (pet?.IsRareMon || 0) === 1;
  }

  /**
   * 检查精灵是否为暗黑精灵
   * 
   * @param petId 精灵ID
   * @returns 是否为暗黑精灵
   */
  public static IsDark(petId: number): boolean {
    const pet = this.GetPet(petId);
    return (pet?.IsDark || 0) === 1;
  }

  // ==================== 统计信息 ====================

  /**
   * 获取 SPT 系统统计信息
   * 
   * @returns 统计信息
   */
  public static GetStats(): {
    totalPets: number;
    petsWithMoves: number;
    totalMoves: number;
  } {
    this.LoadSptData();

    let petsWithMoves = 0;
    let totalMoves = 0;

    for (const moves of this.learnableMovesCache?.values() || []) {
      if (moves.length > 0) {
        petsWithMoves++;
        totalMoves += moves.length;
      }
    }

    return {
      totalPets: this.petCache?.size || 0,
      petsWithMoves,
      totalMoves
    };
  }

  /**
   * 打印 SPT 系统信息（调试用）
   */
  public static PrintStats(): void {
    const stats = this.GetStats();
    Logger.Info('========== SPT 系统统计 ==========');
    Logger.Info(`总精灵数: ${stats.totalPets}`);
    Logger.Info(`有技能的精灵: ${stats.petsWithMoves}`);
    Logger.Info(`总技能数: ${stats.totalMoves}`);
    Logger.Info('====================================');
  }

  /**
   * 打印精灵的可学习技能（调试用）
   * 
   * @param petId 精灵ID
   */
  public static PrintLearnableMoves(petId: number): void {
    const pet = this.GetPet(petId);
    if (!pet) {
      Logger.Warn(`[SptSystem] 精灵不存在: ${petId}`);
      return;
    }

    const moves = this.GetLearnableMoves(petId);
    Logger.Info(`========== ${pet.DefName} (ID: ${petId}) 可学习技能 ==========`);
    
    if (moves.length === 0) {
      Logger.Info('无可学习技能');
    } else {
      for (const move of moves) {
        Logger.Info(`Lv.${move.level.toString().padStart(2, '0')} - 技能ID: ${move.id}`);
      }
    }
    
    Logger.Info('====================================');
  }
}
