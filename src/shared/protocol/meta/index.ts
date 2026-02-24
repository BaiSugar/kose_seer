import { CommandMetaRegistry } from './CommandMetaRegistry';
import { LoginMetadata } from './login.meta';
import { ServerMetadata } from './server.meta';
import { ChatMetadata } from './chat.meta';
import { mapMeta } from './map.meta';
import { petMeta } from './pet.meta';
import { SystemModuleMetadata } from './system.meta';
import { ItemModuleMetadata } from './item.meta';
import { SocialMetadata } from './social.meta';
import { NoNoModuleMetadata } from './nono.meta';
import { battleMeta } from './battle.meta';

// 导出类型和接口
export * from './CommandMetaRegistry';

// 创建全局注册表实例
export const CmdMeta = new CommandMetaRegistry();

// 注册所有元数据
CmdMeta.RegisterBatch(LoginMetadata);
CmdMeta.RegisterBatch(ServerMetadata);
CmdMeta.RegisterBatch(ChatMetadata);
CmdMeta.RegisterBatch(mapMeta);
CmdMeta.RegisterBatch(petMeta);
CmdMeta.RegisterBatch(SystemModuleMetadata);
CmdMeta.RegisterBatch(ItemModuleMetadata);
CmdMeta.RegisterBatch(SocialMetadata);
CmdMeta.RegisterBatch(NoNoModuleMetadata);
CmdMeta.RegisterBatch(battleMeta);

