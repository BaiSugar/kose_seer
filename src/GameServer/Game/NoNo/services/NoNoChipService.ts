import { PlayerInstance } from '../../Player/PlayerInstance';
import { Logger } from '../../../../shared/utils';

/**
 * NoNo 芯片服务
 * 负责 NoNo 芯片的获取、合成、使用等功能
 */
export class NoNoChipService {
  private _player: PlayerInstance;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 获取 NoNo 芯片
   * @param userId 用户ID
   * @param chipType 芯片类型
   * @returns 芯片ID和数�?
   */
  public async GetChip(userId: number, chipType: number): Promise<{ chipId: number; chipCount: number } | null> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoChipService] 玩家未拥�?NoNo: UserID=${userId}`);
      return null;
    }

    // 芯片类型映射到芯片ID
    const chipId = chipType;
    const chipCount = 1;

    // 更新玩家的芯片数量（简化处理，实际应该有芯片背包系统）
    const newChipValue = playerData.nonoChip + chipCount;
    const success = await this._player.PlayerRepo.UpdateNoNoChip(newChipValue);

    if (success) {
      Logger.Info(`[NoNoChipService] 获取芯片成功: UserID=${userId}, ChipType=${chipType}, ChipId=${chipId}, Count=${chipCount}`);
      return { chipId, chipCount };
    } else {
      Logger.Error(`[NoNoChipService] 获取芯片失败: UserID=${userId}`);
      return null;
    }
  }

  /**
   * NoNo 芯片合成
   * @param userId 用户ID
   * @param chipIds 要合成的芯片ID列表
   * @returns 合成后的新芯片ID
   */
  public async MixtureChip(userId: number, chipIds: number[] = []): Promise<number | null> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoChipService] 玩家未拥�?NoNo: UserID=${userId}`);
      return null;
    }

    // 检查是否有足够的芯�?
    if (playerData.nonoChip < chipIds.length) {
      Logger.Warn(`[NoNoChipService] 芯片数量不足: UserID=${userId}, Required=${chipIds.length}, Has=${playerData.nonoChip}`);
      return null;
    }

    // 简化的合成逻辑：消耗芯片，生成新芯�?
    const newChipId = Math.floor(Math.random() * 1000) + 1000; // 随机生成高级芯片ID
    const newChipValue = playerData.nonoChip - chipIds.length + 1;

    const success = await this._player.PlayerRepo.UpdateNoNoChip(newChipValue);

    if (success) {
      Logger.Info(`[NoNoChipService] 芯片合成成功: UserID=${userId}, NewChipId=${newChipId}`);
      return newChipId;
    } else {
      Logger.Error(`[NoNoChipService] 芯片合成失败: UserID=${userId}`);
      return null;
    }
  }

  /**
   * 使用 NoNo 工具/道具
   * @param userId 用户ID
   * @param toolId 工具ID
   */
  public async ImplementTool(userId: number, toolId: number): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoChipService] 玩家未拥�?NoNo: UserID=${userId}`);
      return false;
    }

    // 根据工具ID执行不同的效�?
    let success = false;
    switch (toolId) {
      case 1: // 体力药水
        success = await this._player.PlayerRepo.UpdateNoNoPower(Math.min(100000, playerData.nonoPower + 5000));
        break;
      case 2: // 心情药水
        success = await this._player.PlayerRepo.UpdateNoNoMate(Math.min(100000, playerData.nonoMate + 5000));
        break;
      case 3: // 智商药水
        success = await this._player.PlayerRepo.UpdateNoNoIq(Math.min(100000, playerData.nonoIq + 1000));
        break;
      default:
        Logger.Warn(`[NoNoChipService] 未知的工具ID: ToolId=${toolId}`);
        return false;
    }

    if (success) {
      Logger.Info(`[NoNoChipService] 使用工具成功: UserID=${userId}, ToolId=${toolId}`);
    } else {
      Logger.Error(`[NoNoChipService] 使用工具失败: UserID=${userId}, ToolId=${toolId}`);
    }

    return success;
  }
}
