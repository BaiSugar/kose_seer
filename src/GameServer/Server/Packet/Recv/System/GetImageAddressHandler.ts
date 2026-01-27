import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketGetImageAddress } from '../../Send/System/PacketGetImageAddress';

/**
 * [CMD: 1005 GET_IMAGE_ADDRESS] 获取图片服务器地址
 * 简单逻辑，直接在 Handler 中处理
 */
@Opcode(CommandID.GET_IMAGE_ADDRESS, InjectType.NONE)
export class GetImageAddressHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    await player.SendPacket(new PacketGetImageAddress('127.0.0.1', 80, ''));
  }
}

