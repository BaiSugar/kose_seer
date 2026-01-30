import { Router } from 'express';
import { PetController } from '../controllers/PetController';

export const petRouter = Router();
const petController = new PetController();

// 获取玩家精灵列表
petRouter.get('/:uid', petController.getPlayerPets);

// 发送精灵
petRouter.post('/:uid', petController.givePet);

// 修改精灵属性
petRouter.patch('/:uid', petController.updatePet);

// 删除精灵
petRouter.delete('/:uid', petController.removePet);

// 治疗精灵
petRouter.post('/:uid/cure', petController.curePet);

// 治疗所有精灵
petRouter.post('/:uid/cure-all', petController.cureAllPets);

// 设置精灵等级
petRouter.post('/:uid/level', petController.setPetLevel);
