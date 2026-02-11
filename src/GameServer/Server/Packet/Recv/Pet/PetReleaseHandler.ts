import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 2304 PET_RELEASE] 精灵操作（放入仓库/取回背包）
 * 
 * 请求格式：catchTime(4) + flag(4)
 * - flag=0: 将精灵放入仓库（从背包移到仓库）
 * - flag=1: 将精灵取回背包（从仓库移到背包，或确认获得新精灵）
 */
@Opcode(CommandID.PET_RELEASE, InjectType.NONE)
export class PetReleaseHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // 解析请求
    let catchTime = 0;
    let flag = 0;
    
    if (body.length >= 4) {
      catchTime = body.readUInt32BE(0);
    }
    if (body.length >= 8) {
      flag = body.readUInt32BE(4);
    }

    Logger.Info(`[PetReleaseHandler] 用户 ${player.Uid} 精灵操作: catchTime=${catchTime}, flag=${flag}`);

    if (flag === 0) {
      // 将精灵放入仓库
      await player.PetManager.HandlePetRelease(catchTime);
    } else if (flag === 1) {
      // 将精灵取回背包（从仓库取出，或确认获得新精灵）
      await player.PetManager.HandlePetTakeOut(catchTime);
    } else {
      Logger.Warn(`[PetReleaseHandler] 未知的 flag 值: ${flag}`);
    }
  }
}
