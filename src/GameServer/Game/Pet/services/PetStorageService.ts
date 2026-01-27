import { Logger } from '../../../../shared/utils';
import { PlayerInstance } from '../../Player/PlayerInstance';

/**
 * 精灵存储服务
 * 负责精灵在背包和仓库之间的移动
 */
export class PetStorageService {
  private _player: PlayerInstance;

  // 背包最大容量
  private static readonly MAX_BAG_SIZE = 6;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 移动精灵到仓库
   */
  public async MoveToStorage(userId: number, petId: number): Promise<boolean> {
    // 验证精灵是否属于该玩家
    const pet = await this._player.PetRepo.FindPetById(petId);
    if (!pet || pet.userId !== userId) {
      Logger.Warn(`[PetStorageService] 精灵不属于该玩家: UserID=${userId}, PetId=${petId}`);
      return false;
    }

    // 验证精灵是否在背包中
    if (!pet.isInBag) {
      Logger.Warn(`[PetStorageService] 精灵已在仓库中: PetId=${petId}`);
      return true;
    }

    // 不能移动首发精灵
    if (pet.isDefault) {
      Logger.Warn(`[PetStorageService] 不能移动首发精灵到仓库: PetId=${petId}`);
      return false;
    }

    const success = await this._player.PetRepo.MoveToStorage(petId);
    if (success) {
      Logger.Info(`[PetStorageService] 移动精灵到仓库成功: PetId=${petId}`);
    } else {
      Logger.Error(`[PetStorageService] 移动精灵到仓库失败: PetId=${petId}`);
    }

    return success;
  }

  /**
   * 移动精灵到背包
   */
  public async MoveToBag(userId: number, petId: number): Promise<boolean> {
    // 验证精灵是否属于该玩家
    const pet = await this._player.PetRepo.FindPetById(petId);
    if (!pet || pet.userId !== userId) {
      Logger.Warn(`[PetStorageService] 精灵不属于该玩家: UserID=${userId}, PetId=${petId}`);
      return false;
    }

    // 验证精灵是否在仓库中
    if (pet.isInBag) {
      Logger.Warn(`[PetStorageService] 精灵已在背包中: PetId=${petId}`);
      return true;
    }

    // 检查背包是否已满
    const bagCount = await this._player.PetRepo.CountInBag();
    if (bagCount >= PetStorageService.MAX_BAG_SIZE) {
      Logger.Warn(`[PetStorageService] 背包已满: UserID=${userId}, Count=${bagCount}`);
      return false;
    }

    // 找到一个空位置
    const position = await this.FindEmptyPosition(userId);

    const success = await this._player.PetRepo.MoveToBag(petId, position);
    if (success) {
      Logger.Info(`[PetStorageService] 移动精灵到背包成功: PetId=${petId}, Position=${position}`);
    } else {
      Logger.Error(`[PetStorageService] 移动精灵到背包失败: PetId=${petId}`);
    }

    return success;
  }

  /**
   * 查找背包中的空位置
   */
  private async FindEmptyPosition(userId: number): Promise<number> {
    const petsInBag = await this._player.PetRepo.FindInBag();
    const usedPositions = new Set(petsInBag.map(p => p.position));

    // 找到第一个未使用的位置
    for (let i = 0; i < PetStorageService.MAX_BAG_SIZE; i++) {
      if (!usedPositions.has(i)) {
        return i;
      }
    }

    return 0;  // 默认返回0
  }

  /**
   * 交换两个精灵的位置
   */
  public async SwapPosition(userId: number, petId1: number, petId2: number): Promise<boolean> {
    // 验证两个精灵都属于该玩家
    const pet1 = await this._player.PetRepo.FindPetById(petId1);
    const pet2 = await this._player.PetRepo.FindPetById(petId2);

    if (!pet1 || pet1.userId !== userId || !pet2 || pet2.userId !== userId) {
      Logger.Warn(`[PetStorageService] 精灵不属于该玩家: UserID=${userId}`);
      return false;
    }

    // 验证两个精灵都在背包中
    if (!pet1.isInBag || !pet2.isInBag) {
      Logger.Warn(`[PetStorageService] 精灵不在背包中，无法交换位置`);
      return false;
    }

    // 交换位置
    const pos1 = pet1.position;
    const pos2 = pet2.position;

    await this._player.PetRepo.MoveToBag(petId1, pos2);
    await this._player.PetRepo.MoveToBag(petId2, pos1);

    Logger.Info(`[PetStorageService] 交换精灵位置: Pet1=${petId1}(${pos1}->${pos2}), Pet2=${petId2}(${pos2}->${pos1})`);
    return true;
  }

  /**
   * 整理背包（重新排列位置）
   */
  public async OrganizeBag(userId: number): Promise<boolean> {
    const petsInBag = await this._player.PetRepo.FindInBag();

    // 按捕获时间排序
    petsInBag.sort((a, b) => a.catchTime - b.catchTime);

    // 重新分配位置
    for (let i = 0; i < petsInBag.length; i++) {
      await this._player.PetRepo.MoveToBag(petsInBag[i].id, i);
    }

    Logger.Info(`[PetStorageService] 整理背包成功: UserID=${userId}, Count=${petsInBag.length}`);
    return true;
  }

  /**
   * 获取背包剩余空间
   */
  public async GetBagSpace(userId: number): Promise<number> {
    const bagCount = await this._player.PetRepo.CountInBag();
    return Math.max(0, PetStorageService.MAX_BAG_SIZE - bagCount);
  }
}
