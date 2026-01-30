import { Router } from 'express';
import { CurrencyController } from '../controllers/CurrencyController';

export const currencyRouter = Router();
const currencyController = new CurrencyController();

// 获取玩家货币信息
currencyRouter.get('/:uid', currencyController.getCurrency);

// 修改金币（增加或减少）
currencyRouter.patch('/:uid/coins', currencyController.modifyCoins);

// 设置金币（直接设置）
currencyRouter.put('/:uid/coins', currencyController.setCoins);
