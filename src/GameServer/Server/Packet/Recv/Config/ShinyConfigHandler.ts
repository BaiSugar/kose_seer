import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ShinyConfigReqProto } from '../../../../../shared/proto/packets/req/config/ShinyConfigReqProto';
import { ShinyConfigRspProto } from '../../../../../shared/proto/packets/rsp/config/ShinyConfigRspProto';
import { ShinyConfigManager } from '../../../../Game/Shiny/ShinyConfigManager';
import { Logger } from '../../../../../shared/utils/Logger';

/**
 * 异色配置请求处理器
 * CMD 109001
 */
@Opcode(CommandID.SHINY_CONFIG_GET, InjectType.NONE)
export class ShinyConfigHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      const req = new ShinyConfigReqProto();
      req.deserialize(body);

      Logger.Debug(`[ShinyConfigHandler] 客户端请求异色配置: uid=${player.Uid}, clientVersion=${req.clientVersion}`);

      // 获取服务端配置版本和数据
      const serverVersion = ShinyConfigManager.Instance.GetVersion();
      const configs = ShinyConfigManager.Instance.GetAllConfigs();

      // 构造响应
      const rsp = new ShinyConfigRspProto();
      rsp.version = serverVersion;

      // 如果客户端版本与服务端一致，不发送配置数据（节省带宽）
      if (req.clientVersion === serverVersion) {
        Logger.Debug(`[ShinyConfigHandler] 客户端配置已是最新: version=${serverVersion}`);
        rsp.needUpdate = false;
      } else {
        Logger.Debug(`[ShinyConfigHandler] 发送异色配置: version=${serverVersion}, count=${configs.length}`);
        rsp.needUpdate = true;
        rsp.configs = configs;
      }

      // 发送响应
      await player.SendPacket(rsp);
    } catch (error) {
      Logger.Error(`[ShinyConfigHandler] 处理异色配置请求失败: uid=${player.Uid}`, error as Error);
    }
  }
}
