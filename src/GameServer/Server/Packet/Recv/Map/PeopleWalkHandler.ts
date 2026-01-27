import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PeopleWalkReqProto } from '../../../../../shared/proto/packets/req/map/PeopleWalkReqProto';
import { PeopleWalkRspProto } from '../../../../../shared/proto/packets/rsp/map/PeopleWalkRspProto';
import { OnlineTracker } from '../../../../Game/Player/OnlineTracker';

/**
 * 玩家移动处理器
 * CMD 1013
 */
@Opcode(CommandID.PEOPLE_WALK, InjectType.NONE)
export class PeopleWalkHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = PeopleWalkReqProto.fromBuffer(body);

    // 广播移动消息到同地图玩家
    const mapId = OnlineTracker.Instance.GetPlayerMap(player.UserID);
    if (mapId > 0) {
      const rsp = new PeopleWalkRspProto(req.walkType, player.UserID, req.x, req.y, req.amfData);
      await OnlineTracker.Instance.BroadcastToMap(mapId, rsp);
    }
  }
}
