import { BaseManager } from '../Base/BaseManager';
import { PacketNoNoInfo, PacketNoNoCure, PacketNoNoPlay, PacketNoNoFollowOrHoom, PacketGetDiamond, PacketNoNoGetChip, PacketNoNoIsInfo, PacketOpenSuperNono, PacketNoNoOpen } from '../../Server/Packet/Send/NoNo';
import { PacketVipCo } from '../../Server/Packet/Send/Vip';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { Logger } from '../../../shared/utils';
import { CommandID } from '../../../shared/protocol/CommandID';
import { OnlineTracker } from '../Player/OnlineTracker';

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
   * 初始化（从数据库加载跟随状态）
   */
  public async Initialize(): Promise<void> {
    const playerData = this.Player.Data;
    if (playerData.hasNono) {
      // nonoState 是32位标志:
      // Bit 0 (值 1) = HasNoNo - 是否拥有NoNo
      // Bit 1 (值 2) = Show/Follow - NoNo是否显示/跟随
      // 
      // 客户端通过 BitUtil.getBit(nonoState, 1) 检查 Bit 1
      // 只有当 Bit 1 = 1 时，客户端才会显示NoNo
      // 
      // 常见值：
      // - 0 (0b00): 没有NoNo
      // - 1 (0b01): 有NoNo但不显示（只有Bit 0）
      // - 3 (0b11): 有NoNo且显示（Bit 0 + Bit 1 = 1 + 2 = 3）
      this._isFollowing = (playerData.nonoState & 0x02) !== 0; // 检查Bit 1
      Logger.Debug(`[NoNoManager] 初始化: UserID=${this.UserID}, isFollowing=${this._isFollowing}, nonoState=${playerData.nonoState}`);
    }
  }

  /**
   * 登录后处理（在玩家完全初始化后调用）
   * 注意：不自动召唤NoNo，玩家需要手动召唤（和Lua端一致）
   */
  public async OnLogin(): Promise<void> {
    const playerData = this.Player.Data;
    Logger.Debug(`[NoNoManager] 登录完成: UserID=${this.UserID}, hasNono=${playerData.hasNono}, nonoState=${playerData.nonoState}, nonoFlag=${playerData.nonoFlag}`);
  }

  /**
   * 处理获取 NoNo 信息（官方格式）
   */
  public async HandleNoNoInfo(): Promise<void> {
    const playerData = this.Player.Data;
    const userId = this.UserID;
    
    // 如果没有 NoNo，返回 flag=0, state=0
    // 客户端会在 flag==0 时直接返回，不解析后续数据
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketNoNoInfo(
        userId,
        0,      // flag = 0 (没有 NoNo，客户端会直接返回)
        0,      // state = 0 (无状态)
        '',     // nick = 空
        0,      // superNono = 0
        0,      // color = 0
        0,      // power = 0
        0,      // mate = 0
        0,      // iq = 0
        0,      // ai = 0
        0,      // birth = 0
        0,      // chargeTime = 0
        0,      // superEnergy = 0
        0,      // superLevel = 0
        0       // superStage = 0
      ));
      Logger.Debug(`[NoNoManager] 发送NoNo信息: UserID=${userId}, hasNono=false, flag=0 (客户端会直接返回)`);
      return;
    }
    
    // 有 NoNo：返回完整数据
    const flag = playerData.nonoFlag || 1;  // 默认 flag=1
    const state = playerData.nonoState;     // 从数据库加载的状态（0/1/3）
    const nick = playerData.nonoNick || 'NoNo';
    const superNono = playerData.superNono ? 1 : 0;
    const color = playerData.nonoColor || 0xFFFFFF;
    const power = playerData.nonoPower || 0;
    const mate = playerData.nonoMate || 0;
    const iq = playerData.nonoIq || 0;
    const ai = playerData.nonoAi || 0;
    const birth = playerData.nonoBirth || Math.floor(Date.now() / 1000);
    const chargeTime = playerData.nonoChargeTime || 0;
    const superEnergy = playerData.nonoSuperEnergy || 0;
    const superLevel = playerData.nonoSuperLevel || 0;
    const superStage = playerData.nonoSuperStage || 0;

    Logger.Debug(`[NoNoManager] 发送NoNo信息: UserID=${userId}, hasNono=true, flag=${flag}, state=${state} (0b${state.toString(2).padStart(8, '0')}), state[1]=${(state & 0x02) !== 0 ? 'true(跟随)' : 'false(回家)'}`);

    await this.Player.SendPacket(new PacketNoNoInfo(
      userId,
      flag,
      state,
      nick,
      superNono,
      color,
      power,
      mate,
      iq,
      ai,
      birth,
      chargeTime,
      superEnergy,
      superLevel,
      superStage
    ));

    // 如果 NoNo 处于跟随状态（state bit 1 = 1），推送 NONO_FOLLOW_OR_HOOM 让客户端显示 NoNo
    const isFollowing = (state & 0x02) !== 0;  // 检查 bit 1
    if (isFollowing) {
      Logger.Info(`[NoNoManager] NoNo处于跟随状态，推送NONO_FOLLOW_OR_HOOM: UserID=${userId}`);
      
      const followPacket = new PacketNoNoFollowOrHoom(
        userId,
        superStage,
        1,  // state: 1=跟随
        true,
        nick,
        color,
        power
      );

      // 广播给地图上的所有玩家（包括自己）
      const mapId = OnlineTracker.Instance.GetPlayerMap(userId);
      if (mapId > 0) {
        const sentCount = await OnlineTracker.Instance.BroadcastToMap(mapId, followPacket);
        Logger.Info(`[NoNoManager] 推送NoNo跟随状态到地图 ${mapId}: ${sentCount} 个玩家`);
      } else {
        // 如果不在地图上，只发给自己
        await this.Player.SendPacket(followPacket);
        Logger.Info(`[NoNoManager] 推送NoNo跟随状态给玩家自己`);
      }
    }
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
   * 处理 NoNo 跟随或回家
   */
  public async HandleNoNoFollowOrHoom(action: number): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_FOLLOW_OR_HOOM).setResult(5001));
      return;
    }

    const isFollow = action === 1;
    this._isFollowing = isFollow;

    // 更新 nonoState（使用位操作）
    // Bit 0 (值 1) = HasNoNo - 是否拥有NoNo
    // Bit 1 (值 2) = Show/Follow - NoNo是否显示/跟随
    // 
    // 客户端检查 nonoState[1] (Bit 1) 来决定是否显示NoNo
    // 必须设置 Bit 1 = 1 (值 3 = 0b11) 才能显示 NoNo
    const oldState = playerData.nonoState;
    if (isFollow) {
      playerData.nonoState = 3; // 0b11 = Bit 0 + Bit 1 = HasNoNo + Show
    } else {
      playerData.nonoState = 1; // 0b01 = 只有 Bit 0 = HasNoNo
    }
    Logger.Debug(`[NoNoManager] NoNo状态变更: UserID=${this.UserID}, ${oldState} → ${playerData.nonoState} (${isFollow ? '跟随' : '回家'}), 将自动保存到数据库`);

    // 创建响应包
    let packet: PacketNoNoFollowOrHoom;
    
    if (isFollow) {
      // 跟随：发送完整NoNo信息
      // superStage: 0=普通NoNo, >0=超级NoNo等级
      const superStage = playerData.superNono ? (playerData.nonoSuperLevel || 1) : 0;
      
      packet = new PacketNoNoFollowOrHoom(
        this.UserID,
        superStage,
        1, // state: 1=跟随
        true,
        playerData.nonoNick,
        playerData.nonoColor,
        playerData.nonoPower
      );
      Logger.Info(`[NoNoManager] NoNo 跟随: UserID=${this.UserID}, superStage=${superStage}, nonoState=${playerData.nonoState}`);
    } else {
      // 回家：只发送基本信息
      packet = new PacketNoNoFollowOrHoom(
        this.UserID,
        0,
        0, // state: 0=回家
        false
      );
      Logger.Info(`[NoNoManager] NoNo 回家: UserID=${this.UserID}, nonoState=${playerData.nonoState}`);
    }

    // 广播给地图上的所有玩家（包括自己）
    const mapId = OnlineTracker.Instance.GetPlayerMap(this.UserID);
    if (mapId > 0) {
      const sentCount = await OnlineTracker.Instance.BroadcastToMap(mapId, packet);
      Logger.Debug(`[NoNoManager] 广播NoNo状态到地图 ${mapId}: ${sentCount} 个玩家`);
    } else {
      // 如果不在地图上，只发给自己
      await this.Player.SendPacket(packet);
    }
  }

  
  /**
   * 处理开启NoNo（玩家手动领取）
   */
  public async HandleNoNoOpen(): Promise<void> {
    const playerData = this.Player.Data;
    
    // 检查是否已经有NoNo
    if (playerData.hasNono) {
      // 返回 status=0 表示已经有NoNo
      await this.Player.SendPacket(new PacketNoNoOpen(0));
      Logger.Warn(`[NoNoManager] 开启NoNo失败: 已经拥有NoNo, UserID=${this.UserID}`);
      return;
    }

    // 初始化NoNo数据
    const now = Math.floor(Date.now() / 1000);
    playerData.hasNono = true;
    playerData.nonoNick = 'NoNo';
    playerData.nonoColor = 0xFFFFFF;
    playerData.nonoFlag = 1;
    // nonoState = 3 (0b11): Bit 0 (HasNoNo) + Bit 1 (Show) = 1 + 2 = 3
    // 客户端检查 nonoState[1] (Bit 1) 来决定是否显示NoNo
    playerData.nonoState = 3;
    playerData.nonoPower = 10000;  // 官方默认值为10000
    playerData.nonoMate = 10000;   // 官方默认值为10000
    playerData.nonoIq = 0;
    playerData.nonoAi = 0;
    playerData.nonoBirth = now;
    playerData.nonoChargeTime = 500;
    playerData.superNono = false;
    playerData.nonoSuperEnergy = 0;
    playerData.nonoSuperLevel = 0;
    playerData.nonoSuperStage = 0;

    // 设置跟随状态
    this._isFollowing = true;

    // 数据会自动保存（Proxy机制），无需手动调用save()

    // 发送开通成功响应，status=1 表示成功获得NoNo
    // 客户端会设置 MainManager.actorInfo.hasNono = true
    await this.Player.SendPacket(new PacketNoNoOpen(1));
    
    // 自动发送NoNo跟随广播包，让NoNo立即显示
    const superStage = 0; // 普通NoNo
    const followPacket = new PacketNoNoFollowOrHoom(
      this.UserID,
      superStage,
      1, // state: 1=跟随
      true,
      playerData.nonoNick,
      playerData.nonoColor,
      playerData.nonoPower
    );

    // 广播给地图上的所有玩家（包括自己）
    const mapId = OnlineTracker.Instance.GetPlayerMap(this.UserID);
    if (mapId > 0) {
      const sentCount = await OnlineTracker.Instance.BroadcastToMap(mapId, followPacket);
      Logger.Info(`[NoNoManager] 开启NoNo成功并自动召唤: UserID=${this.UserID}, nick=${playerData.nonoNick}, 广播到地图 ${mapId}: ${sentCount} 个玩家`);
    } else {
      // 如果不在地图上，只发给自己
      await this.Player.SendPacket(followPacket);
      Logger.Info(`[NoNoManager] 开启NoNo成功并自动召唤: UserID=${this.UserID}, nick=${playerData.nonoNick}`);
    }
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

    // NoNo芯片功能已移除（官方包中没有此字段）
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
    // NoNo芯片功能已移除（官方包中没有此字段）

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
  public async HandleNoNoAddExp(_expAmount: number = 1000): Promise<void> {
    const playerData = this.Player.Data;
    if (!playerData.hasNono) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_ADD_EXP).setResult(5001));
      return;
    }

    // NoNo成长值功能已移除（官方包中没有此字段）
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
  public async HandleNoNoCloseOpen(_action: number): Promise<void> {
    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CLOSE_OPEN));
  }

  /**
   * 处理NoNo执行列表
   */
  public async HandleNoNoExeList(): Promise<void> {
    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_EXE_LIST));
  }

  /**
   * 处理开启超级NoNo (CMD 80001)
   */
  public async HandleOpenSuperNono(): Promise<void> {
    try {
      const playerData = this.Player.Data;
      
      // 检查是否有NoNo
      if (!playerData.hasNono) {
        await this.Player.SendPacket(new PacketOpenSuperNono(1)); // 失败
        Logger.Warn(`[NoNoManager] 开启超级NoNo失败: 没有NoNo, UserID=${this.UserID}`);
        return;
      }

      // 检查是否已经是超级NoNo
      if (playerData.superNono) {
        await this.Player.SendPacket(new PacketOpenSuperNono(1)); // 失败
        Logger.Warn(`[NoNoManager] 开启超级NoNo失败: 已经是超级NoNo, UserID=${this.UserID}`);
        return;
      }

      // 开启超级NoNo（自动保存）
      playerData.superNono = true;
      playerData.nonoSuperLevel = 1;
      playerData.nonoSuperEnergy = 0;
      playerData.nonoSuperStage = 0;
      
      // 设置过期时间（30天后）- 使用VIP系统管理
      const expireTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

      // 发送开通成功响应
      await this.Player.SendPacket(new PacketOpenSuperNono(0)); // 成功
      
      // 推送VIP状态变更包（vipType=2表示超级NoNo）
      await this.Player.SendPacket(new PacketVipCo(
        this.UserID,
        2, // vipType: 2=超级NoNo
        0, // autoCharge
        expireTime // vipEndTime
      ));
      
      Logger.Info(`[NoNoManager] 开启超级NoNo成功: UserID=${this.UserID}, ExpireTime=${expireTime}`);
    } catch (error) {
      Logger.Error(`[NoNoManager] HandleOpenSuperNono failed`, error as Error);
      await this.Player.SendPacket(new PacketOpenSuperNono(1)); // 失败
    }
  }
}
