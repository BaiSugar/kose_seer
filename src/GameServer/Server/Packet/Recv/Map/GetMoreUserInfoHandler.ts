import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetMoreUserInfoReqProto } from '../../../../../shared/proto/packets/req/map/GetMoreUserInfoReqProto';

/**
 * 获取详细用户信息处理器
 * CMD 1006
 */
@Opcode(CommandID.GET_MORE_USERINFO, InjectType.NONE)
export class GetMoreUserInfoHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new GetMoreUserInfoReqProto();
    req.deserialize(body);
    await player.MapManager.HandleGetMoreUserInfo(req.targetId);
  }
}
