import { Router } from 'express';
import { ConfigController } from '../controllers/ConfigController';

export const configRouter = Router();
const configController = new ConfigController();

// 获取配置元数据
configRouter.get('/metadata', configController.getMetadata);

// 获取精灵名字映射
configRouter.get('/pet-names', configController.getPetNames);

// 获取物品名字映射
configRouter.get('/item-names', configController.getItemNames);

// 获取任务名字映射
configRouter.get('/task-names', configController.getTaskNames);

// 获取技能名字映射
configRouter.get('/skill-names', configController.getSkillNames);

// 搜索精灵选项（分页）
configRouter.get('/search/pets', configController.searchPets);

// 搜索物品选项（分页）
configRouter.get('/search/items', configController.searchItems);

// 获取配置数据
configRouter.get('/:type', configController.getConfig);

// 保存配置数据
configRouter.post('/:type', configController.saveConfig);

// 重载配置
configRouter.post('/:type/reload', configController.reloadConfig);

// 获取下拉选项
configRouter.get('/options/:type', configController.getOptions);
