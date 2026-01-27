import { CommandMetaRegistry } from './CommandMetaRegistry';
import { LoginMetadata } from './login.meta';
import { ServerMetadata } from './server.meta';
import { ChatMetadata } from './chat.meta';
import { MapMetadata } from './map.meta';
import { PetModuleMetadata } from './pet.meta';
import { SystemModuleMetadata } from './system.meta';
import { ItemModuleMetadata } from './item.meta';
import { SocialMetadata } from './social.meta';

// 导出类型和接口
export * from './CommandMetaRegistry';

// 创建全局注册表实例
export const CmdMeta = new CommandMetaRegistry();

// 注册所有元数据
CmdMeta.RegisterBatch(LoginMetadata);
CmdMeta.RegisterBatch(ServerMetadata);
CmdMeta.RegisterBatch(ChatMetadata);
CmdMeta.RegisterBatch(MapMetadata);
CmdMeta.RegisterBatch(PetModuleMetadata);
CmdMeta.RegisterBatch(SystemModuleMetadata);
CmdMeta.RegisterBatch(ItemModuleMetadata);
CmdMeta.RegisterBatch(SocialMetadata);

// 可以继续添加更多模块的元数据
// CmdMeta.RegisterBatch(BattleMetadata);
// ...
