import { Logger } from '../../../../shared/utils';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { IBattleInfo } from '../../../../shared/models/BattleModel';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { IOgreDropItem } from '../../../../shared/config/game/interfaces/IMapOgreConfig';

/**
 * 战斗奖励服务
 * 负责处理战斗胜利后的奖励：经验、金币、捕获等
 */
export class BattleRewardService {
  private _player: PlayerInstance;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 处理战斗胜利奖励
   * @param userId 玩家ID
   * @param battle 战斗信息
   * @param mapId 地图ID（可选，用于读取配置）
   * @param slot 野怪槽位（可选，用于读取配置）
   */
  public async ProcessVictoryReward(
    userId: number, 
    battle: IBattleInfo,
    mapId?: number,
    slot?: number
  ): Promise<{
    expGained: number;
    coinsGained: number;
    levelUp: boolean;
    newLevel: number;
    droppedItems: { itemId: number; count: number }[];
  }> {
    try {
      // 1. 计算经验奖励（从配置或默认计算）
      const expGained = this.CalculateExpReward(battle.enemy.level, battle.enemy.id, mapId, slot);

      // 2. 计算金币奖励
      const coinsGained = this.CalculateCoinsReward(battle.enemy.level);

      // 3. 给精灵增加经验（使用catchTime查找精灵）
      const catchTime = battle.player.catchTime;
      const levelUp = await this._player.PetManager.HandleAddPetExpByCatchTime(catchTime, expGained);
      const pet = this._player.PetManager.PetData.GetPetByCatchTime(catchTime);
      const newLevel = pet ? pet.level : battle.player.level;

      // 4. 给玩家增加金币
      await this._player.AddCurrency(undefined, coinsGained);

      // 5. 处理掉落物品
      const droppedItems = this.ProcessDropItems(mapId, slot);
      for (const drop of droppedItems) {
        await this._player.ItemManager.ItemData.AddItem(drop.itemId, drop.count, 0);
        Logger.Info(`[BattleRewardService] 掉落物品: ItemId=${drop.itemId}, Count=${drop.count}`);
      }

      Logger.Info(`[BattleRewardService] 战斗奖励: UserID=${userId}, Exp=${expGained}, Coins=${coinsGained}, LevelUp=${levelUp}, Drops=${droppedItems.length}`);

      return { expGained, coinsGained, levelUp, newLevel, droppedItems };

    } catch (error) {
      Logger.Error(`[BattleRewardService] 处理奖励失败: ${error}`);
      return { expGained: 0, coinsGained: 0, levelUp: false, newLevel: battle.player.level, droppedItems: [] };
    }
  }

  /**
   * 处理精灵捕获
   * @param userId 玩家ID
   * @param battle 战斗信息
   * @param catchTime 捕获时间
   * @param mapId 地图ID（可选，用于检查是否可捕获）
   * @param slot 野怪槽位（可选，用于检查是否可捕获）
   */
  public async ProcessCatch(
    userId: number, 
    battle: IBattleInfo, 
    catchTime: number,
    mapId?: number,
    slot?: number
  ): Promise<boolean> {
    try {
      // 检查是否可以捕获（从配置读取）
      const catchable = this.IsCatchable(battle.enemy.id, mapId, slot);
      if (!catchable) {
        Logger.Warn(`[BattleRewardService] 该精灵不可捕获: PetId=${battle.enemy.id}`);
        return false;
      }

      // 检查背包空间
      const bagSpace = await this._player.PetManager.GetBagSpace();

      if (bagSpace <= 0) {
        Logger.Warn(`[BattleRewardService] 背包已满: UserID=${userId}`);
        return false;
      }

      // 使用 PetManager 的 GivePet 方法
      const success = await this._player.PetManager.GivePet(battle.enemy.id, battle.enemy.level, catchTime);

      if (success) {
        Logger.Info(`[BattleRewardService] 捕获精灵: UserID=${userId}, PetId=${battle.enemy.id}, Level=${battle.enemy.level}, CatchTime=${catchTime}`);
      }

      return success;

    } catch (error) {
      Logger.Error(`[BattleRewardService] 捕获精灵失败: ${error}`);
      return false;
    }
  }

  /**
   * 计算经验奖励
   * 优先从配置读取，否则使用默认计算
   */
  private CalculateExpReward(enemyLevel: number, enemyId: number, mapId?: number, slot?: number): number {
    // 尝试从配置读取
    if (mapId !== undefined && slot !== undefined) {
      const ogreConfig = this.GetOgreConfig(mapId, slot, enemyId);
      if (ogreConfig) {
        // 如果配置了经验奖励，使用配置值
        if (ogreConfig.expReward !== undefined) {
          const multiplier = ogreConfig.expMultiplier || 1.0;
          return Math.floor(ogreConfig.expReward * multiplier);
        }
      }
    }

    // 尝试从精灵配置读取 YieldingExp
    const petConfig = GameConfig.GetPetById(enemyId);
    if (petConfig && petConfig.YieldingExp) {
      return petConfig.YieldingExp;
    }

    // 默认计算：基础经验 = 敌人等级 * 10
    const baseExp = enemyLevel * 10;

    // BOSS额外奖励
    const bossBonus = enemyId > 100 ? 1.5 : 1.0;

    return Math.floor(baseExp * bossBonus);
  }

  /**
   * 计算金币奖励
   */
  private CalculateCoinsReward(enemyLevel: number): number {
    // 金币 = 敌人等级 * 5
    return enemyLevel * 5;
  }

  /**
   * 处理掉落物品
   */
  private ProcessDropItems(mapId?: number, slot?: number): { itemId: number; count: number }[] {
    if (mapId === undefined || slot === undefined) {
      return [];
    }

    const droppedItems: { itemId: number; count: number }[] = [];

    // 从配置读取掉落物品
    const mapConfig = GameConfig.GetMapOgreConfig();
    if (!mapConfig) return droppedItems;

    const map = mapConfig.maps[mapId.toString()];
    if (!map) return droppedItems;

    const ogre = map.ogres.find(o => o.slot === slot);
    if (!ogre || !ogre.dropItems) return droppedItems;

    // 处理每个掉落物品
    for (const dropConfig of ogre.dropItems) {
      // 掉落概率判定
      if (Math.random() <= dropConfig.dropRate) {
        // 随机掉落数量
        const count = Math.floor(
          Math.random() * (dropConfig.maxCount - dropConfig.minCount + 1) + dropConfig.minCount
        );
        droppedItems.push({ itemId: dropConfig.itemId, count });
      }
    }

    return droppedItems;
  }

  /**
   * 检查精灵是否可以捕获
   */
  private IsCatchable(petId: number, mapId?: number, slot?: number): boolean {
    // 尝试从配置读取
    if (mapId !== undefined && slot !== undefined) {
      const ogreConfig = this.GetOgreConfig(mapId, slot, petId);
      if (ogreConfig) {
        // 如果配置了 catchable，使用配置值
        if (ogreConfig.catchable !== undefined) {
          return ogreConfig.catchable;
        }
      }
    }

    // 默认可以捕获
    return true;
  }

  /**
   * 获取野怪配置
   */
  private GetOgreConfig(mapId: number, slot: number, petId: number) {
    const mapConfig = GameConfig.GetMapOgreConfig();
    if (!mapConfig) return null;

    const map = mapConfig.maps[mapId.toString()];
    if (!map) return null;

    return map.ogres.find(o => o.slot === slot && o.petId === petId);
  }
}
