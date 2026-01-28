import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 2304 PET_RELEASE] 精灵操作（释放/放入背包）
 * 
 * 请求格式：catchTime(4) + flag(4)
 * - flag=0: 释放精灵（从背包删除）
 * - flag=1: 将精灵放入背包（从仓库取出，或确认获得新精灵）
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
      // 释放精灵（删除）
      await player.PetManager.HandlePetRelease(catchTime);
    } else if (flag === 1) {
      // 将精灵放入背包（从仓库取出，或确认获得新精灵）
      // 对于新手任务获得的精灵，这个命令只是确认，不需要做任何操作
      // 精灵已经在 CompleteTask 时添加到背包了
      await player.PetManager.HandlePetTakeOut(catchTime);
    } else {
      Logger.Warn(`[PetReleaseHandler] 未知的 flag 值: ${flag}`);
    }
  }
}
