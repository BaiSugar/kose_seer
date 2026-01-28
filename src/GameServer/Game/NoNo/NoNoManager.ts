import { BaseManager } from '../Base/BaseManager';
import { PacketNoNoInfo, PacketNoNoCure, PacketNoNoPlay, PacketNoNoFollowOrHoom, PacketGetDiamond, PacketNoNoGetChip, PacketNoNoIsInfo } from '../../Server/Packet/Send/NoNo';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { Logger } from '../../../shared/utils';
import { CommandID } from '../../../shared/protocol/CommandID';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';

/**
 * NoNo 管理器
 * 直接操作 PlayerData 中的 NoNo 字段
 */
export class NoNoManager extends BaseManager {
  private _isFollowing: boolean = false;

  constructor(player: any) {
    super(player);
  }

  /**
   * 处理获取 NoNo 信息
   */
  public async HandleNoNoInfo(): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_INFO).setResult(5001));
      return;
    }

    await this.Player.SendPacket(new PacketNoNoInfo(
      this.UserID,
      playerData.nonoFlag,
      playerData.nonoState,
      playerData.nonoNick,
      playerData.nonoColor,
      playerData.nonoPower,
      playerData.nonoMate,
      playerData.nonoIq,
      playerData.nonoAi,
      playerData.nonoSuperLevel,
      playerData.nonoBio,
      playerData.nonoBirth,
      playerData.nonoChargeTime,
      playerData.nonoExpire,
      playerData.nonoChip,
      playerData.nonoGrow
    ));

    Logger.Info(`[NoNoManager] 发�?NoNo 信息: UserID=${this.UserID}, Nick=${playerData.nonoNick}`);
  }

  /**
   * 处理 NoNo 治疗
   */
  public async HandleNoNoCure(): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CURE).setResult(5001));
      return;
    }

    playerData.nonoPower = 100000;
    playerData.nonoMate = 100000;


    await this.Player.SendPacket(new PacketNoNoCure());
  }

  /**
   * 处理 NoNo 玩�?
   */
  public async HandleNoNoPlay(): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_PLAY).setResult(5001));
      return;
    }

    playerData.nonoMate = Math.min(100000, playerData.nonoMate + 1000);
    playerData.nonoPower = Math.max(0, playerData.nonoPower - 500);


    await this.Player.SendPacket(new PacketNoNoPlay(
      playerData.nonoPower,
      playerData.nonoAi,
      playerData.nonoMate,
      playerData.nonoIq
    ));
  }

  /**
   * 处理 NoNo 跟随或回�?
   */
  public async HandleNoNoFollowOrHoom(action: number): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_FOLLOW_OR_HOOM).setResult(5001));
      return;
    }

    const isFollow = action === 1;
    this._isFollowing = isFollow;

    if (isFollow) {
      await this.Player.SendPacket(new PacketNoNoFollowOrHoom(
        this.UserID,
        0,
        1,
        true,
        playerData.nonoNick,
        playerData.nonoColor,
        playerData.nonoChargeTime
      ));
      Logger.Info(`[NoNoManager] NoNo 跟随: UserID=${this.UserID}`);
    } else {
      await this.Player.SendPacket(new PacketNoNoFollowOrHoom(
        this.UserID,
        0,
        0,
        false
      ));
      Logger.Info(`[NoNoManager] NoNo 回家: UserID=${this.UserID}`);
    }
  }

  /**
   * 处理开启NoNo
   */
  public async HandleNoNoOpen(): Promise<void> {
    const playerData = this.Player.Data;
    if (playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_OPEN).setResult(5002));
      return;
    }

    playerData.hasNono = true;
    playerData.nonoNick = 'NoNo';
    playerData.nonoColor = 0xFFFFFF;
    playerData.nonoPower = 100000;
    playerData.nonoMate = 100000;
    playerData.nonoIq = 1000;
    playerData.nonoAi = 1000;


    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_OPEN));
  }

  /**
   * 处理修改NoNo昵称
   */
  public async HandleNoNoChangeName(newName: string): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHANGE_NAME).setResult(5001));
      return;
    }

    playerData.nonoNick = newName;


    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHANGE_NAME));
  }

  /**
   * 处理NoNo芯片合成
   */
  public async HandleNoNoChipMixture(): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHIP_MIXTURE).setResult(5001));
      return;
    }

    playerData.nonoChip += 1;


    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHIP_MIXTURE));
  }

  /**
   * 处理NoNo经验管理
   */
  public async HandleNoNoExpadm(): Promise<void> {
    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_EXPADM));
  }

  /**
   * 处理NoNo使用工具
   */
  public async HandleNoNoImplementTool(toolId: number = 1): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_IMPLEMENT_TOOL).setResult(5001));
      return;
    }

    switch (toolId) {
      case 1:
        playerData.nonoPower = Math.min(100000, playerData.nonoPower + 5000);
        break;
      case 2:
        playerData.nonoMate = Math.min(100000, playerData.nonoMate + 5000);
        break;
      case 3:
        playerData.nonoIq = Math.min(100000, playerData.nonoIq + 1000);
        break;
    }


    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_IMPLEMENT_TOOL));
  }

  /**
   * 处理修改NoNo颜色
   */
  public async HandleNoNoChangeColor(newColor: number = 0xFFFFFF): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHANGE_COLOR).setResult(5001));
      return;
    }

    playerData.nonoColor = newColor;


    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHANGE_COLOR));
  }

  /**
   * 处理获取NoNo芯片
   */
  public async HandleNoNoGetChip(chipType: number): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_GET_CHIP).setResult(5001));
      return;
    }

    const chipId = chipType;
    const chipCount = 1;
    playerData.nonoChip += chipCount;


    await this.Player.SendPacket(new PacketNoNoGetChip(chipId, chipCount));
  }

  /**
   * 处理增加NoNo能量和心�?
   */
  public async HandleNoNoAddEnergyMate(): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_ADD_ENERGY_MATE).setResult(5001));
      return;
    }

    playerData.nonoPower = Math.min(100000, playerData.nonoPower + 10000);
    playerData.nonoMate = Math.min(100000, playerData.nonoMate + 10000);


    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_ADD_ENERGY_MATE));
  }

  /**
   * 处理获取钻石数量
   */
  public async HandleGetDiamond(): Promise<void> {
    const diamondCount = 9999;
    await this.Player.SendPacket(new PacketGetDiamond(diamondCount));
  }

  /**
   * 处理增加NoNo经验
   */
  public async HandleNoNoAddExp(expAmount: number = 1000): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_ADD_EXP).setResult(5001));
      return;
    }

    playerData.nonoGrow += expAmount;


    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_ADD_EXP));
  }

  /**
   * 处理查询是否有NoNo
   */
  public async HandleNoNoIsInfo(): Promise<void> {
    const hasNono = this.Player.Data.hasNono;
    await this.Player.SendPacket(new PacketNoNoIsInfo(hasNono ? 1 : 0));
  }

  /**
   * 处理开启超级NoNo
   */
  public async HandleNoNoOpenSuper(): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_OPEN_SUPER).setResult(5001));
      return;
    }

    playerData.superNono = true;
    playerData.nonoSuperLevel = 1;


    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_OPEN_SUPER));
  }

  /**
   * 处理NoNo帮助经验
   */
  public async HandleNoNoHelpExp(): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono || playerData.nonoPower < 1000) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_HELP_EXP).setResult(5001));
      return;
    }

    playerData.nonoPower -= 1000;


    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_HELP_EXP));
  }

  /**
   * 处理NoNo心情变化
   */
  public async HandleNoNoMateChange(delta: number = 0): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_MATE_CHANGE).setResult(5001));
      return;
    }

    playerData.nonoMate = Math.max(0, Math.min(100000, playerData.nonoMate + delta));


    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_MATE_CHANGE));
  }

  /**
   * 处理NoNo充电
   */
  public async HandleNoNoCharge(): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHARGE).setResult(5001));
      return;
    }

    playerData.nonoPower = 100000;


    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHARGE));
  }

  /**
   * 处理NoNo开始执行任�?
   */
  public async HandleNoNoStartExe(): Promise<void> {
    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_START_EXE));
  }

  /**
   * 处理NoNo结束执行任务
   */
  public async HandleNoNoEndExe(): Promise<void> {
    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_END_EXE));
  }

  /**
   * 处理NoNo开�?关闭
   */
  public async HandleNoNoCloseOpen(action: number): Promise<void> {
    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CLOSE_OPEN));
  }

  /**
   * 处理NoNo执行列表
   */
  public async HandleNoNoExeList(): Promise<void> {
    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_EXE_LIST));
  }

  /**
   * 获取 NoNo 跟随状�?
   */
  public get IsFollowing(): boolean {
    return this._isFollowing;
  }
}
