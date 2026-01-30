import { Router } from 'express';
import { ConfigRegistry } from '../../shared/config/ConfigRegistry';
import { GameConfig } from '../../shared/config/game/GameConfig';
import { Logger } from '../../shared/utils/Logger';

export const reloadRouter = Router();

// 重载指定配置
reloadRouter.post('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    Logger.Info(`[ReloadRouter] 收到配置重载请求: ${type}`);
    
    // 重载配置
    await ConfigRegistry.Instance.ReloadConfig(type);
    
    // 刷新 GameConfig 缓存
    GameConfig.ReloadAll();
    
    Logger.Info(`[ReloadRouter] 配置重载成功: ${type}`);
    
    res.json({ 
      success: true, 
      message: `配置 ${type} 重载成功`,
      timestamp: Date.now()
    });
  } catch (error) {
    Logger.Error(`[ReloadRouter] 配置重载失败: ${req.params.type}`, error as Error);
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
});

// 重载所有配置
reloadRouter.post('/', async (req, res) => {
  try {
    Logger.Info('[ReloadRouter] 收到全部配置重载请求');
    
    // 重新初始化所有配置
    await ConfigRegistry.Instance.Initialize();
    
    // 刷新 GameConfig 缓存
    GameConfig.ReloadAll();
    
    Logger.Info('[ReloadRouter] 全部配置重载成功');
    
    res.json({ 
      success: true, 
      message: '全部配置重载成功',
      timestamp: Date.now()
    });
  } catch (error) {
    Logger.Error('[ReloadRouter] 全部配置重载失败', error as Error);
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
});

// 获取配置状态
reloadRouter.get('/status', (req, res) => {
  try {
    const configs = ConfigRegistry.Instance.GetAllConfigs();
    const status = Object.keys(configs).map(key => ({
      name: key,
      loaded: configs[key] !== null,
      itemCount: Array.isArray(configs[key]) ? configs[key].length : 
                 typeof configs[key] === 'object' ? Object.keys(configs[key]).length : 1
    }));
    
    res.json({ 
      success: true, 
      data: status,
      timestamp: Date.now()
    });
  } catch (error) {
    Logger.Error('[ReloadRouter] 获取配置状态失败', error as Error);
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
});
