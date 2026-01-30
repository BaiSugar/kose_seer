import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../../shared/utils/Logger';
import { ConfigRegistry } from '../../shared/config/ConfigRegistry';
import { GameConfig } from '../../shared/config/game/GameConfig';

export class ConfigService {
  private configPath = path.join(__dirname, '../../../config');

  /**
   * 将前端配置键名（连字符）转换为后端配置键名（下划线）
   * 例如: map-ogres -> map_ogres
   */
  private normalizeConfigKey(key: string): string {
    return key.replace(/-/g, '_');
  }

  // 配置元数据定义
  private metadata = {
    'map-ogres': {
      name: '地图怪物配置',
      fields: [
        { key: 'mapId', label: '地图ID', type: 'number', required: true },
        { key: 'name', label: '地图名称', type: 'text', required: true },
        { key: 'slot', label: '槽位', type: 'number', required: true },
        { key: 'petId', label: '精灵ID', type: 'select', options: 'pets', required: true },
        { key: 'minLevel', label: '最小等级', type: 'number', required: true, min: 1, max: 100 },
        { key: 'maxLevel', label: '最大等级', type: 'number', required: true, min: 1, max: 100 },
        { key: 'expReward', label: '经验奖励', type: 'number', required: true },
        { key: 'catchRate', label: '捕捉率', type: 'number', required: true, min: 0, max: 1, step: 0.01 },
        { key: 'expMultiplier', label: '经验倍率', type: 'number', required: true, min: 0.1, max: 10, step: 0.1 },
        { key: 'catchable', label: '可捕捉', type: 'boolean', required: true },
        { key: 'isBoss', label: 'BOSS', type: 'boolean', required: true },
        { key: 'refreshInterval', label: '刷新间隔(秒)', type: 'number', required: true },
        { key: 'shinyRate', label: '闪光率', type: 'number', required: true, min: 0, max: 1, step: 0.01 },
        { key: 'weight', label: '权重', type: 'number', required: true }
      ]
    },
    'tasks': {
      name: '任务配置',
      fields: [
        { key: 'id', label: '任务ID', type: 'number', required: true },
        { key: 'name', label: '任务名称', type: 'text', required: true },
        { key: 'description', label: '任务描述', type: 'textarea', required: true },
        { key: 'type', label: '任务类型', type: 'select', options: ['daily', 'weekly', 'main', 'side'], required: true },
        { key: 'rewardCoins', label: '金币奖励', type: 'number', required: false },
        { key: 'rewardExp', label: '经验奖励', type: 'number', required: false },
        { key: 'rewardItems', label: '物品奖励', type: 'select', options: 'items', multiple: true, required: false }
      ]
    },
    'unique-items': {
      name: '特殊物品配置',
      fields: [
        { key: 'itemId', label: '物品ID', type: 'select', options: 'items', required: true },
        { key: 'effectType', label: '效果类型', type: 'select', options: ['heal', 'buff', 'capture', 'evolution'], required: true },
        { key: 'effectValue', label: '效果值', type: 'number', required: true },
        { key: 'duration', label: '持续时间(秒)', type: 'number', required: false }
      ]
    }
  };

  // 获取配置元数据
  public async getMetadata(): Promise<any> {
    return this.metadata;
  }

  // 获取配置数据
  public async getConfig(type: string): Promise<any> {
    const filePath = path.join(this.configPath, 'data/json', `${type}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const rawData = JSON.parse(content);
    
    // 直接返回原始数据，保持层级结构
    return rawData;
  }

  // 保存配置数据
  public async saveConfig(type: string, data: any): Promise<void> {
    const filePath = path.join(this.configPath, 'data/json', `${type}.json`);
    
    Logger.Info(`[ConfigService] 开始保存配置: ${type}`);
    Logger.Debug(`[ConfigService] 配置路径: ${filePath}`);
    
    // 备份原配置
    const backupPath = `${filePath}.backup.${Date.now()}`;
    try {
      await fs.copyFile(filePath, backupPath);
      Logger.Info(`[ConfigService] 配置已备份: ${backupPath}`);
    } catch (error) {
      Logger.Warn(`[ConfigService] 备份配置失败: ${error}`);
    }

    // 保存新配置
    const jsonContent = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonContent, 'utf-8');
    Logger.Info(`[ConfigService] 配置已保存: ${type}, 大小: ${jsonContent.length} 字节`);
  }

  // 重载配置（通知游戏服务器）
  public async reloadConfig(type: string): Promise<void> {
    try {
      Logger.Info(`[ConfigService] 开始重载配置: ${type}`);
      
      // 转换配置键名（连字符 -> 下划线）
      const normalizedKey = this.normalizeConfigKey(type);
      Logger.Debug(`[ConfigService] 配置键名转换: ${type} -> ${normalizedKey}`);
      
      // 重载配置（只重载指定配置，不重启服务器）
      const success = await ConfigRegistry.Instance.ReloadConfig(normalizedKey);
      
      if (!success) {
        throw new Error('配置重载失败');
      }
      
      // 刷新 GameConfig 缓存
      GameConfig.ReloadAll();
      
      Logger.Info(`[ConfigService] 配置重载成功: ${type} (仅重载配置文件，服务器继续运行)`);
    } catch (error) {
      Logger.Error(`[ConfigService] 配置重载失败: ${type}`, error as Error);
      throw error;
    }
  }

  // 获取下拉选项数据
  public async getOptions(type: string): Promise<any[]> {
    switch (type) {
      case 'pets':
        return await this.getPetOptions();
      case 'skills':
        return await this.getSkillOptions();
      case 'items':
        return await this.getItemOptions();
      default:
        return [];
    }
  }

  // 获取精灵选项
  private async getPetOptions(): Promise<any[]> {
    const pets = GameConfig.GetAllPets();
    return pets.map((pet: any) => ({
      value: pet.ID,
      label: `${pet.ID} - ${pet.DefName || '未知'}`
    }));
  }

  // 搜索精灵选项（支持分页和搜索）
  public async searchPetOptions(query: string = '', page: number = 1, pageSize: number = 50): Promise<{ items: any[], total: number }> {
    const allOptions = await this.getPetOptions();
    
    // 搜索过滤
    let filtered = allOptions;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = allOptions.filter(opt => 
        opt.label.toLowerCase().includes(lowerQuery) ||
        opt.value.toString().includes(query)
      );
    }
    
    // 分页
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);
    
    return {
      items,
      total: filtered.length
    };
  }

  // 获取技能选项
  private async getSkillOptions(): Promise<any[]> {
    const skills = GameConfig.GetAllSkills();
    return skills.map((skill: any) => ({
      value: skill.ID,
      label: `${skill.ID} - ${skill.Name || '未知'}`
    }));
  }

  // 获取物品选项
  private async getItemOptions(): Promise<any[]> {
    const items = GameConfig.GetAllItems();
    return items.map((item: any) => ({
      value: item.ID,
      label: `${item.ID} - ${item.Name || '未知'}`
    }));
  }

  // 搜索物品选项（支持分页和搜索）
  public async searchItemOptions(query: string = '', page: number = 1, pageSize: number = 50): Promise<{ items: any[], total: number }> {
    const allOptions = await this.getItemOptions();
    
    // 搜索过滤
    let filtered = allOptions;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = allOptions.filter(opt => 
        opt.label.toLowerCase().includes(lowerQuery) ||
        opt.value.toString().includes(query)
      );
    }
    
    // 分页
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);
    
    return {
      items,
      total: filtered.length
    };
  }

  // 获取精灵名字映射（ID -> 名字）
  public async getPetNames(): Promise<Record<number, string>> {
    const pets = GameConfig.GetAllPets();
    const nameMap: Record<number, string> = {};
    
    pets.forEach((pet: any) => {
      nameMap[pet.ID] = pet.DefName || '未知';
    });
    
    Logger.Info(`[ConfigService] 加载精灵名字: ${Object.keys(nameMap).length} 个精灵`);
    return nameMap;
  }

  // 获取物品名字映射（ID -> 名字）
  public async getItemNames(): Promise<Record<number, string>> {
    const items = GameConfig.GetAllItems();
    const nameMap: Record<number, string> = {};
    
    items.forEach((item: any) => {
      nameMap[item.ID] = item.Name || '未知';
    });
    
    Logger.Info(`[ConfigService] 加载物品名字: ${Object.keys(nameMap).length} 个物品`);
    return nameMap;
  }

  // 获取任务名字映射（ID -> 名字）
  public async getTaskNames(): Promise<Record<number, string>> {
    const config = GameConfig.GetTaskConfig();
    const nameMap: Record<number, string> = {};
    
    if (!config || !config.tasks) {
      Logger.Warn('[ConfigService] 任务配置不存在或为空');
      return nameMap;
    }
    
    const tasks = config.tasks;
    Object.keys(tasks).forEach((taskId) => {
      const id = parseInt(taskId);
      const name = tasks[taskId].name || '未知任务';
      nameMap[id] = name;
    });
    
    Logger.Info(`[ConfigService] 加载任务名字: ${Object.keys(nameMap).length} 个任务`);
    return nameMap;
  }

  // 获取技能名字映射（ID -> 名字）
  public async getSkillNames(): Promise<Record<number, string>> {
    const skills = GameConfig.GetAllSkills();
    const nameMap: Record<number, string> = {};
    
    skills.forEach((skill: any) => {
      nameMap[skill.ID] = skill.Name || '未知技能';
    });
    
    Logger.Info(`[ConfigService] 加载技能名字: ${Object.keys(nameMap).length} 个技能`);
    return nameMap;
  }
}
