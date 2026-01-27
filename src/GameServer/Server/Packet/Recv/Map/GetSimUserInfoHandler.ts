import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetSimUserInfoReqProto } from '../../../../../shared/proto/packets/req/map/GetSimUserInfoReqProto';

/**
 * 获取简单用户信息处理器
 * CMD 1005
 */
@Opcode(CommandID.GET_SIM_USERINFO, InjectType.NONE)
export class GetSimUserInfoHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new GetSimUserInfoReqProto();
    req.deserialize(body);
    await player.MapManager.HandleGetSimUserInfo(req.targetId);
  }
}
