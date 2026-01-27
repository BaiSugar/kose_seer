import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ChangeClothReqProto } from '../../../../../shared/proto/packets/req/item/ChangeClothReqProto';

/**
 * 更换服装处理器
 * CMD 2604
 * 
 * 重构说明：
 * - 不再需要依赖注入 ItemManager
 * - 直接使用 player.ItemManager
 */
@Opcode(CommandID.CHANGE_CLOTH, InjectType.NONE)
export class ChangeClothHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new ChangeClothReqProto();
    req.deserialize(body);

    // 直接调用 player.ItemManager
    await player.ItemManager.HandleChangeCloth(req.clothIds);
  }
}
