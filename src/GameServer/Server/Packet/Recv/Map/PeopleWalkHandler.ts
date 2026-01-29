import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PeopleWalkReqProto } from '../../../../../shared/proto/packets/req/map/PeopleWalkReqProto';
import { PeopleWalkRspProto } from '../../../../../shared/proto/packets/rsp/map/PeopleWalkRspProto';
import { OnlineTracker } from '../../../../Game/Player/OnlineTracker';
import { MapSpawnManager } from '../../../../Game/Map/MapSpawnManager';
import { PacketMapOgreList } from '../../Send/Map/PacketMapOgreList';
import { Logger } from '../../../../../shared/utils';

/**
 * 玩家移动处理器
 * CMD 2101
 */
@Opcode(CommandID.PEOPLE_WALK, InjectType.NONE)
export class PeopleWalkHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = PeopleWalkReqProto.fromBuffer(body);

    // 更新玩家位置
    const oldX = player.Data.posX;
    const oldY = player.Data.posY;
    player.Data.posX = req.x;
    player.Data.posY = req.y;

    // 构建响应
    const rsp = new PeopleWalkRspProto(req.walkType, player.Uid, req.x, req.y, req.amfData);
    
    // 发送给当前玩家（主响应，必须先发送）
    await player.SendPacket(rsp);
    
    // 主动推送地图野怪列表（额外响应）
    const mapId = player.Data.mapID;
    if (mapId > 0) {
      const ogres = MapSpawnManager.Instance.GetMapOgres(player.Uid, mapId);
      
      await player.SendPacket(new PacketMapOgreList(ogres));
      
      Logger.Debug(
        `[PeopleWalkHandler] 玩家移动: UserID=${player.Uid}, ` +
        `Pos=(${oldX},${oldY})->(${req.x},${req.y}), ` +
        `Ogres=${ogres.filter(o => o.petId > 0).length}`
      );
    }
    
    // TODO: 广播移动消息到同地图其他玩家
    // 在 Gateway 模式下，广播需要通过其他机制实现
  }
}
