import { BaseManager } from '../Base/BaseManager';
import { PacketNoNoInfo, PacketNoNoCure, PacketNoNoPlay, PacketNoNoFollowOrHoom, PacketGetDiamond, PacketNoNoGetChip, PacketNoNoIsInfo } from '../../Server/Packet/Send/NoNo';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { Logger } from '../../../shared/utils';
import { CommandID } from '../../../shared/protocol/CommandID';
import { 
  NoNoInfoService, 
  NoNoEnergyService, 
  NoNoChipService, 
  NoNoSuperService,
  NoNoExpService 
} from './services';

/**
 * NoNo 管理器
 * 处理 NoNo 宠物相关功能：信息查询、治疗、喂食等
 * 
 * 架构说明：
 * - Manager 负责协调各个 Service
 * - Service 负责具体的业务逻辑和数据库操作
 * - Manager 只处理请求转发和响应发送
 */
export class NoNoManager extends BaseManager {
  // NoNo 跟随状态（会话级别，不持久化）
  private _isFollowing: boolean = false;

  // 服务实例
  private _infoService: NoNoInfoService;
  private _energyService: NoNoEnergyService;
  private _chipService: NoNoChipService;
  private _superService: NoNoSuperService;
  private _expService: NoNoExpService;

  constructor(player: any) {
    super(player);
    
    // 初始化服务，传入 Player 实例
    this._infoService = new NoNoInfoService(player);
    this._energyService = new NoNoEnergyService(player);
    this._chipService = new NoNoChipService(player);
    this._superService = new NoNoSuperService(player);
    this._expService = new NoNoExpService(player);
  }

  /**
   * 处理获取 NoNo 信息
   * 复杂逻辑：需要从数据库读取 NoNo 数据
   */
  public async HandleNoNoInfo(): Promise<void> {
    const playerData = await this._infoService.GetNoNoData(this.UserID);
    if (!playerData) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_INFO).setResult(5001));
      return;
    }

    // 使用真实的 NoNo 数据
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

    Logger.Info(`[NoNoManager] 发送 NoNo 信息: UserID=${this.UserID}, Nick=${playerData.nonoNick}`);
  }

  /**
   * 处理 NoNo 治疗
   * 复杂逻辑：恢复 NoNo 的体力和心情到最大值
   */
  public async HandleNoNoCure(): Promise<void> {
    const success = await this._energyService.CureNoNo(this.UserID);
    
    if (success) {
      await this.Player.SendPacket(new PacketNoNoCure());
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CURE).setResult(5001));
    }
  }

  /**
   * 处理 NoNo 玩耍
   * 复杂逻辑：增加 NoNo 的心情值，消耗体力
   */
  public async HandleNoNoPlay(): Promise<void> {
    const result = await this._energyService.PlayWithNoNo(this.UserID);
    
    if (result) {
      await this.Player.SendPacket(new PacketNoNoPlay(
        result.power,
        result.ai,
        result.mate,
        result.iq
      ));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_PLAY).setResult(5001));
    }
  }

  /**
   * 处理 NoNo 跟随或回家
   * 简单逻辑：设置会话级别的跟随状态
   * @param action 0=回家, 1=跟随
   */
  public async HandleNoNoFollowOrHoom(action: number): Promise<void> {
    const playerData = await this._infoService.GetNoNoData(this.UserID);
    if (!playerData) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_FOLLOW_OR_HOOM).setResult(5001));
      return;
    }

    const isFollow = action === 1;
    this._isFollowing = isFollow;

    // 发送响应
    if (isFollow) {
      // 跟随：返回完整 NoNo 信息
      await this.Player.SendPacket(new PacketNoNoFollowOrHoom(
        this.UserID,
        0,  // flag=0 (官服格式)
        1,  // state=1 (跟随状态)
        true,
        playerData.nonoNick,
        playerData.nonoColor,
        playerData.nonoChargeTime
      ));
      Logger.Info(`[NoNoManager] NoNo 跟随: UserID=${this.UserID}`);
    } else {
      // 回家：返回简单信息
      await this.Player.SendPacket(new PacketNoNoFollowOrHoom(
        this.UserID,
        0,  // flag=0
        0,  // state=0 (回家状态)
        false
      ));
      Logger.Info(`[NoNoManager] NoNo 回家: UserID=${this.UserID}`);
    }
  }

  /**
   * 处理开启NoNo
   * 复杂逻辑：为玩家创建 NoNo
   */
  public async HandleNoNoOpen(): Promise<void> {
    const success = await this._infoService.EnableNoNo(this.UserID);
    
    if (success) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_OPEN));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_OPEN).setResult(5001));
    }
  }

  /**
   * 处理修改NoNo昵称
   * 复杂逻辑：验证昵称并修改
   */
  public async HandleNoNoChangeName(newName: string): Promise<void> {
    const success = await this._infoService.ChangeNoNoNick(this.UserID, newName);
    
    if (success) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHANGE_NAME));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHANGE_NAME).setResult(5001));
    }
  }

  /**
   * 处理NoNo芯片合成
   * 复杂逻辑：消耗芯片合成新芯片
   */
  public async HandleNoNoChipMixture(): Promise<void> {
    const newChipId = await this._chipService.MixtureChip(this.UserID, []);
    
    if (newChipId !== null) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHIP_MIXTURE));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHIP_MIXTURE).setResult(5001));
    }
  }

  /**
   * 处理NoNo经验管理
   * 复杂逻辑：管理 NoNo 的经验分配
   */
  public async HandleNoNoExpadm(): Promise<void> {
    const currentGrow = await this._expService.ManageExp(this.UserID, 'query', 0);
    
    if (currentGrow !== null) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_EXPADM));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_EXPADM).setResult(5001));
    }
  }

  /**
   * 处理NoNo使用工具
   * 复杂逻辑：使用道具提升 NoNo 属性
   */
  public async HandleNoNoImplementTool(toolId: number = 1): Promise<void> {
    const success = await this._chipService.ImplementTool(this.UserID, toolId);
    
    if (success) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_IMPLEMENT_TOOL));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_IMPLEMENT_TOOL).setResult(5001));
    }
  }

  /**
   * 处理修改NoNo颜色
   * 复杂逻辑：修改 NoNo 的颜色
   */
  public async HandleNoNoChangeColor(newColor: number = 0xFFFFFF): Promise<void> {
    const success = await this._infoService.ChangeNoNoColor(this.UserID, newColor);
    
    if (success) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHANGE_COLOR));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHANGE_COLOR).setResult(5001));
    }
  }

  /**
   * 处理获取NoNo芯片
   * 复杂逻辑：获取指定类型的芯片并保存到数据库
   */
  public async HandleNoNoGetChip(chipType: number): Promise<void> {
    const result = await this._chipService.GetChip(this.UserID, chipType);
    
    if (result) {
      await this.Player.SendPacket(new PacketNoNoGetChip(result.chipId, result.chipCount));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_GET_CHIP).setResult(5001));
    }
  }

  /**
   * 处理增加NoNo能量和心情
   * 复杂逻辑：增加 NoNo 的体力和心情值
   */
  public async HandleNoNoAddEnergyMate(): Promise<void> {
    const success = await this._energyService.AddEnergyMate(this.UserID, 10000, 10000);
    
    if (success) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_ADD_ENERGY_MATE));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_ADD_ENERGY_MATE).setResult(5001));
    }
  }

  /**
   * 处理获取钻石数量
   * 简单逻辑：返回玩家的钻石数量（TODO: 需要钻石系统）
   */
  public async HandleGetDiamond(): Promise<void> {
    // TODO: 从数据库读取真实钻石数量
    const diamondCount = 9999;  // 临时默认值

    await this.Player.SendPacket(new PacketGetDiamond(diamondCount));
  }

  /**
   * 处理增加NoNo经验
   * 复杂逻辑：增加 NoNo 的经验值和成长值
   */
  public async HandleNoNoAddExp(expAmount: number = 1000): Promise<void> {
    const success = await this._expService.GainExp(this.UserID, expAmount, 'manual');
    
    if (success) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_ADD_EXP));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_ADD_EXP).setResult(5001));
    }
  }

  /**
   * 处理查询是否有NoNo
   * 简单逻辑：返回玩家是否拥有NoNo
   */
  public async HandleNoNoIsInfo(): Promise<void> {
    const hasNono = await this._infoService.HasNoNo(this.UserID);
    await this.Player.SendPacket(new PacketNoNoIsInfo(hasNono ? 1 : 0));
  }

  /**
   * 处理开启超级NoNo
   * 复杂逻辑：开启超级 NoNo 功能
   */
  public async HandleNoNoOpenSuper(): Promise<void> {
    const success = await this._superService.OpenSuper(this.UserID);
    
    if (success) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_OPEN_SUPER));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_OPEN_SUPER).setResult(5001));
    }
  }

  /**
   * 处理NoNo帮助经验
   * 复杂逻辑：NoNo 辅助玩家获得经验，消耗体力
   */
  public async HandleNoNoHelpExp(): Promise<void> {
    const success = await this._energyService.HelpExp(this.UserID);
    
    if (success) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_HELP_EXP));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_HELP_EXP).setResult(5001));
    }
  }

  /**
   * 处理NoNo心情变化
   * 复杂逻辑：随机事件导致心情变化
   */
  public async HandleNoNoMateChange(delta: number = 0): Promise<void> {
    const success = await this._energyService.MateChange(this.UserID, delta);
    
    if (success) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_MATE_CHANGE));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_MATE_CHANGE).setResult(5001));
    }
  }

  /**
   * 处理NoNo充电
   * 复杂逻辑：恢复 NoNo 体力
   */
  public async HandleNoNoCharge(): Promise<void> {
    const success = await this._energyService.ChargeNoNo(this.UserID);
    
    if (success) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHARGE));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CHARGE).setResult(5001));
    }
  }

  /**
   * 处理NoNo开始执行任务
   * 简单逻辑：开始执行任务（TODO: 需要任务系统）
   */
  public async HandleNoNoStartExe(): Promise<void> {
    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_START_EXE));
  }

  /**
   * 处理NoNo结束执行任务
   * 简单逻辑：结束执行任务（TODO: 需要任务系统）
   */
  public async HandleNoNoEndExe(): Promise<void> {
    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_END_EXE));
  }

  /**
   * 处理NoNo开启/关闭
   * 简单逻辑：切换 NoNo 的开启状态
   */
  public async HandleNoNoCloseOpen(action: number): Promise<void> {
    // action: 0=关闭, 1=开启
    // 这里只是状态切换，不影响数据库
    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_CLOSE_OPEN));
  }

  /**
   * 处理NoNo执行列表
   * 简单逻辑：返回空列表（TODO: 需要任务系统）
   */
  public async HandleNoNoExeList(): Promise<void> {
    await this.Player.SendPacket(new PacketEmpty(CommandID.NONO_EXE_LIST));
  }

  /**
   * 获取 NoNo 跟随状态
   */
  public get IsFollowing(): boolean {
    return this._isFollowing;
  }
}
