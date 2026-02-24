/**
 * Reload 命令 - 重新加载配置
 * 参考 DanhengServer 的 CommandReload
 */

import { ICommand } from '../ICommand';
import { CommandArg } from '../CommandArg';
import { CommandInfo, CommandMethod, CommandDefault } from '../CommandDecorators';
import { ConfigRegistry } from '../../config/ConfigRegistry';
import { CommandOutput } from '../CommandOutput';

@CommandInfo({
  name: 'reload',
  description: '重新加载游戏配置',
  usage: 'reload [all|skill|effect|boss]',
  permission: 'admin'
})
export class ReloadCommand implements ICommand {
  /**
   * reload all - 重载所有配置
   */
  @CommandMethod('0 all')
  async reloadAll(arg: CommandArg): Promise<void> {
    await CommandOutput.progress(arg, '正在重新加载所有配置...');
    try {
      await ConfigRegistry.Instance.Initialize();
      await CommandOutput.success(arg, '所有配置重新加载成功');
    } catch (error) {
      await CommandOutput.error(arg, '配置重新加载失败', String(error));
    }
  }

  /**
   * reload skill - 重载技能配置
   */
  @CommandMethod('0 skill')
  async reloadSkill(arg: CommandArg): Promise<void> {
    await CommandOutput.progress(arg, '正在重新加载技能配置...');
    try {
      // TODO: 实现单独重载技能配置
      await ConfigRegistry.Instance.Initialize();
      await CommandOutput.success(arg, '技能配置重新加载成功');
    } catch (error) {
      await CommandOutput.error(arg, '技能配置重新加载失败', String(error));
    }
  }

  /**
   * reload effect - 重载效果配置
   */
  @CommandMethod('0 effect')
  async reloadEffect(arg: CommandArg): Promise<void> {
    await CommandOutput.progress(arg, '正在重新加载效果配置...');
    try {
      // TODO: 实现单独重载效果配置
      await ConfigRegistry.Instance.Initialize();
      await CommandOutput.success(arg, '效果配置重新加载成功');
    } catch (error) {
      await CommandOutput.error(arg, '效果配置重新加载失败', String(error));
    }
  }

  /**
   * reload boss - 重载Boss配置
   */
  @CommandMethod('0 boss')
  async reloadBoss(arg: CommandArg): Promise<void> {
    await CommandOutput.progress(arg, '正在重新加载Boss配置...');
    try {
      // TODO: 实现单独重载Boss配置
      await ConfigRegistry.Instance.Initialize();
      await CommandOutput.success(arg, 'Boss配置重新加载成功');
    } catch (error) {
      await CommandOutput.error(arg, 'Boss配置重新加载失败', String(error));
    }
  }

  /**
   * reload shiny - 重载异色配置
   */
  @CommandMethod('0 shiny')
  async reloadShiny(arg: CommandArg): Promise<void> {
    await CommandOutput.progress(arg, '正在重新加载异色配置...');
    try {
      const { ShinyConfigManager } = await import('../../../GameServer/Game/Shiny/ShinyConfigManager');
      await ShinyConfigManager.Instance.Reload();
      const stats = ShinyConfigManager.Instance.GetStats();
      await CommandOutput.success(arg, `异色配置重新加载成功 (共 ${stats.total} 个配置, version=${stats.version})`);
    } catch (error) {
      await CommandOutput.error(arg, '异色配置重新加载失败', String(error));
    }
  }

  @CommandDefault()
  async default(arg: CommandArg): Promise<void> {
    // 如果有参数但不匹配任何子命令，提示无效
    if (arg.basicArgs.length > 0) {
      const subCmd = arg.basicArgs[0];
      await CommandOutput.error(arg, `无效的子命令: ${subCmd}`);
      await CommandOutput.availableSubcommands(arg, ['all', 'skill', 'effect', 'boss', 'shiny']);
      return;
    }
    
    // 默认重载所有配置
    await this.reloadAll(arg);
  }
}
