import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ItemListReqProto } from '../../../../../shared/proto/packets/req/item/ItemListReqProto';

/**
 * 物品列表处理器
 * CMD 2605
 * 
 * 重构说明：
 * - 不再需要依赖注入 ItemManager
 * - 直接使用 player.ItemManager
 */
@Opcode(CommandID.ITEM_LIST, InjectType.NONE)
export class ItemListHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new ItemListReqProto();
    req.deserialize(body);

    // 直接调用 player.ItemManager
    await player.ItemManager.HandleItemList(req.itemType1, req.itemType2, req.itemType3);
  }
}
