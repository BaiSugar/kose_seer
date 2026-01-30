import { Router } from 'express';
import { ItemController } from '../controllers/ItemController';

export const itemRouter = Router();
const itemController = new ItemController();

// 获取玩家物品列表
itemRouter.get('/:uid', itemController.getPlayerItems);

// 发送物品
itemRouter.post('/:uid', itemController.giveItem);

// 批量发送物品
itemRouter.post('/:uid/batch', itemController.giveItemBatch);

// 删除物品
itemRouter.delete('/:uid', itemController.removeItem);
