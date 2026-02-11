import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetRoomListReqProto } from '../../../../../shared/proto/packets/req/pet/PetRoomListReqProto';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 2324 PET_ROOM_LIST] 获取精灵仓库列表处理器
 */
@Opcode(CommandID.PET_ROOM_LIST, InjectType.NONE)
export class PetRoomListHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = PetRoomListReqProto.fromBuffer(body);
    Logger.Debug(`[PetRoomListHandler] 获取精灵仓库列表: UserID=${player.Data.userID}, RoomType=${req.roomType}`);

    await player.PetManager.HandleGetPetRoomList(req.roomType);
  }
}
