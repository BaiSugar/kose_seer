import { PlayerInstance } from '../../Player/PlayerInstance';
import { Logger } from '../../../../shared/utils';

/**
 * NoNo 能量服务
 * 负责 NoNo 的体力、心情、智商、AI 等属性管�?
 */
export class NoNoEnergyService {
  private _player: PlayerInstance;

  // 属性上�?
  private static readonly MAX_POWER = 100000;
  private static readonly MAX_MATE = 100000;
  private static readonly MAX_IQ = 100000;
  private static readonly MAX_AI = 100000;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * NoNo 治疗（恢复体力和心情到最大值）
   */
  public async CureNoNo(userId: number): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoEnergyService] 玩家未拥�?NoNo: UserID=${userId}`);
      return false;
    }

    // 恢复体力和心情到最大�?
    const success = await this._player.PlayerRepo.UpdateNoNoData({
      power: NoNoEnergyService.MAX_POWER,
      mate: NoNoEnergyService.MAX_MATE
    });

    if (success) {
      Logger.Info(`[NoNoEnergyService] NoNo 治疗成功: UserID=${userId}`);
    } else {
      Logger.Error(`[NoNoEnergyService] NoNo 治疗失败: UserID=${userId}`);
    }

    return success;
  }

  /**
   * NoNo 玩耍（增加心情值）
   */
  public async PlayWithNoNo(userId: number): Promise<{ power: number; mate: number; iq: number; ai: number } | null> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoEnergyService] 玩家未拥�?NoNo: UserID=${userId}`);
      return null;
    }

    // 玩耍增加心情�?5000，但不超过上�?
    const newMate = Math.min(NoNoEnergyService.MAX_MATE, playerData.nonoMate + 5000);
    
    // 玩耍可能会消耗一点体�?
    const newPower = Math.max(0, playerData.nonoPower - 100);

    const success = await this._player.PlayerRepo.UpdateNoNoData({
      power: newPower,
      mate: newMate
    });

    if (success) {
      Logger.Info(`[NoNoEnergyService] NoNo 玩耍成�? UserID=${userId}, Mate=${playerData.nonoMate} �?${newMate}`);
      return {
        power: newPower,
        mate: newMate,
        iq: playerData.nonoIq,
        ai: playerData.nonoAi
      };
    } else {
      Logger.Error(`[NoNoEnergyService] NoNo 玩耍失�? UserID=${userId}`);
      return null;
    }
  }

  /**
   * 增加 NoNo 能量和心�?
   */
  public async AddEnergyMate(userId: number, powerDelta: number = 10000, mateDelta: number = 10000): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoEnergyService] 玩家未拥�?NoNo: UserID=${userId}`);
      return false;
    }

    // 计算新值，不超过上�?
    const newPower = Math.min(NoNoEnergyService.MAX_POWER, playerData.nonoPower + powerDelta);
    const newMate = Math.min(NoNoEnergyService.MAX_MATE, playerData.nonoMate + mateDelta);

    const success = await this._player.PlayerRepo.UpdateNoNoData({
      power: newPower,
      mate: newMate
    });

    if (success) {
      Logger.Info(`[NoNoEnergyService] NoNo 能量心情增加成功: UserID=${userId}, Power=${playerData.nonoPower} �?${newPower}, Mate=${playerData.nonoMate} �?${newMate}`);
    } else {
      Logger.Error(`[NoNoEnergyService] NoNo 能量心情增加失败: UserID=${userId}`);
    }

    return success;
  }

  /**
   * NoNo 充电（恢复体力）
   */
  public async ChargeNoNo(userId: number): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoEnergyService] 玩家未拥�?NoNo: UserID=${userId}`);
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    
    // 充电恢复体力
    const newPower = Math.min(NoNoEnergyService.MAX_POWER, playerData.nonoPower + 5000);

    const success = await this._player.PlayerRepo.UpdateNoNoData({
      power: newPower,
      chargeTime: now
    });

    if (success) {
      Logger.Info(`[NoNoEnergyService] NoNo 充电成功: UserID=${userId}, Power=${playerData.nonoPower} �?${newPower}`);
    } else {
      Logger.Error(`[NoNoEnergyService] NoNo 充电失败: UserID=${userId}`);
    }

    return success;
  }

  /**
   * 增加 NoNo 经验（提升智商和 AI�?
   */
  public async AddNoNoExp(userId: number, expAmount: number = 1000): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoEnergyService] 玩家未拥�?NoNo: UserID=${userId}`);
      return false;
    }

    // 经验转换为智商和 AI 的提�?
    const iqIncrease = Math.floor(expAmount * 0.6);
    const aiIncrease = Math.floor(expAmount * 0.4);

    const newIq = Math.min(NoNoEnergyService.MAX_IQ, playerData.nonoIq + iqIncrease);
    const newAi = Math.min(NoNoEnergyService.MAX_AI, playerData.nonoAi + aiIncrease);

    const success = await this._player.PlayerRepo.UpdateNoNoData({
      iq: newIq,
      ai: newAi
    });

    if (success) {
      Logger.Info(`[NoNoEnergyService] NoNo 经验增加成功: UserID=${userId}, IQ=${playerData.nonoIq} �?${newIq}, AI=${playerData.nonoAi} �?${newAi}`);
    } else {
      Logger.Error(`[NoNoEnergyService] NoNo 经验增加失败: UserID=${userId}`);
    }

    return success;
  }

  /**
   * NoNo 帮助经验（辅助玩家获得经验）
   */
  public async HelpExp(userId: number): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoEnergyService] 玩家未拥�?NoNo: UserID=${userId}`);
      return false;
    }

    // 检�?NoNo 体力是否足够
    if (playerData.nonoPower < 1000) {
      Logger.Warn(`[NoNoEnergyService] NoNo 体力不足: UserID=${userId}, Power=${playerData.nonoPower}`);
      return false;
    }

    // 消耗体�?
    const newPower = playerData.nonoPower - 1000;

    const success = await this._player.PlayerRepo.UpdateNoNoPower(newPower);

    if (success) {
      Logger.Info(`[NoNoEnergyService] NoNo 帮助经验成功: UserID=${userId}, Power=${playerData.nonoPower} �?${newPower}`);
    } else {
      Logger.Error(`[NoNoEnergyService] NoNo 帮助经验失败: UserID=${userId}`);
    }

    return success;
  }

  /**
   * NoNo 心情变化（随机事件）
   */
  public async MateChange(userId: number, delta: number): Promise<boolean> {
    const playerData = this._player.PlayerRepo.data;
    if (!playerData || !playerData.hasNono) {
      Logger.Warn(`[NoNoEnergyService] 玩家未拥�?NoNo: UserID=${userId}`);
      return false;
    }

    const newMate = Math.max(0, Math.min(NoNoEnergyService.MAX_MATE, playerData.nonoMate + delta));

    const success = await this._player.PlayerRepo.UpdateNoNoMate(newMate);

    if (success) {
      Logger.Info(`[NoNoEnergyService] NoNo 心情变化: UserID=${userId}, Mate=${playerData.nonoMate} �?${newMate}, Delta=${delta}`);
    } else {
      Logger.Error(`[NoNoEnergyService] NoNo 心情变化失败: UserID=${userId}`);
    }

    return success;
  }
}
