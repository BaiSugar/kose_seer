import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware, whitelistMiddleware } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// 公开路由（无需认证）
router.post('/login', authController.login);

// 需要认证的路由
router.post('/logout', authMiddleware, authController.logout);
router.get('/current', authMiddleware, authController.getCurrentUser);

// 白名单管理（需要白名单权限）
router.get('/whitelist', authMiddleware, whitelistMiddleware('*'), authController.getWhitelist);
router.post('/whitelist', authMiddleware, whitelistMiddleware('*'), authController.addToWhitelist);
router.delete('/whitelist', authMiddleware, whitelistMiddleware('*'), authController.removeFromWhitelist);

export default router;
