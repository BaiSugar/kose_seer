import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ItemBuyReqProto } from '../../../../../shared/proto/packets/req/item/ItemBuyReqProto';

/**
 * 购买物品处理器
 * CMD 2601
 * 
 * 重构说明：
 * - 不再需要依赖注入 ItemManager
 * - 直接使用 player.ItemManager
 */
@Opcode(CommandID.ITEM_BUY, InjectType.NONE)
export class ItemBuyHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new ItemBuyReqProto();
    req.deserialize(body);

    // 直接调用 player.ItemManager
    await player.ItemManager.HandleItemBuy(req.itemId, req.count);
  }
}
