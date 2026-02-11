import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PeopleTransformReqProto } from '../../../../../shared/proto/packets/req/map/PeopleTransformReqProto';
import { PeopleTransformRspProto } from '../../../../../shared/proto/packets/rsp/map/PeopleTransformRspProto';
import { OnlineTracker } from '../../../../Game/Player/OnlineTracker';

/**
 * 玩家变身处理器
 * CMD 1011
 */
@Opcode(CommandID.PEOPLE_TRANSFROM, InjectType.NONE)
export class PeopleTransformHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new PeopleTransformReqProto();
    req.deserialize(body);

    const rsp = new PeopleTransformRspProto(player.Uid, req.transId);
    
    // 发送给自己
    await player.SendPacket(rsp);
    
    // 广播给同地图其他玩家
    const mapId = player.Data.mapID;
    if (mapId > 0) {
      await OnlineTracker.Instance.BroadcastToMap(mapId, rsp, player.Uid);
    }
  }
}
