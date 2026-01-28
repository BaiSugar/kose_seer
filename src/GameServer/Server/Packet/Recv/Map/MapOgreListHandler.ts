import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketMapOgreList } from '../../Send/Map/PacketMapOgreList';
import { MapSpawnManager } from '../../../../Game/Map/MapSpawnManager';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 2004 MAP_OGRE_LIST] 获取地图野怪列表
 * 
 * 请求：无参数
 * 响应：9个槽位，每个槽位 8 bytes (petId + shiny)
 * 总共 72 bytes
 * 
 * 注意：使用 MapSpawnManager 管理刷新状态，确保同一地图的野怪保持一致
 */
@Opcode(CommandID.MAP_OGRE_LIST, InjectType.NONE)
export class MapOgreListHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const mapId = player.Data.mapID;
    
    // 使用 MapSpawnManager 获取玩家的野怪列表
    const ogres = MapSpawnManager.Instance.GetMapOgres(player.Uid, mapId);
    
    // 发送响应
    await player.SendPacket(new PacketMapOgreList(ogres));
    
    const activeOgres = ogres.filter(o => o.petId > 0);
    Logger.Debug(`[MapOgreListHandler] MapID=${mapId}, Ogres=${activeOgres.length}`);
    if (activeOgres.length > 0) {
      const ogreDetails = ogres
        .map((o, slot) => o.petId > 0 ? `Slot${slot}:Pet${o.petId}${o.shiny ? '(闪)' : ''}` : null)
        .filter(Boolean)
        .join(', ');
      Logger.Debug(`[MapOgreListHandler] Active ogres: ${ogreDetails}`);
    }
  }
}
