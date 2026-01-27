import { ISkillConfig } from '../../../shared/models/SkillModel';
import { Logger } from '../../../shared/utils';
import { ConfigLoader } from '../../../shared/config/ConfigLoader';
import { ConfigPaths, ConfigKeys } from '../../../shared/config/ConfigDefinitions';

/**
 * XML 技能数据结构（xml2js 解析后的格式）
 */
interface ISkillXmlData {
  MovesTbl?: {
    Moves?: {
      Move?: Array<{
        ID: number;
        Name: string;
        Category: number;
        Type: number;
        Power: number;
        MaxPP: number;
        Accuracy: number;
        CritRate?: number;
        Priority?: number;
        MustHit?: number;
        SideEffect?: number;
        SideEffectArg?: string;
      }>;
    };
  };
}

/**
 * 技能配置管理器
 * 从 XML 文件加载技能数据，使用 ConfigLoader 和 xml2js
 */
export class SkillConfig {
  private static _skills: Map<number, ISkillConfig> = new Map();
  private static _loaded: boolean = false;

  /**
   * 加载技能配置
   * 使用 ConfigLoader 从 config/data/skills.xml 加载
   */
  public static Load(): void {
    if (this._loaded) return;

    try {
      // 从 ConfigDefinitions 获取配置路径
      const configPath = ConfigPaths[ConfigKeys.SKILL_CONFIG];
      
      // 使用 ConfigLoader 加载 XML（xml2js 解析）
      const xmlData = ConfigLoader.Instance.LoadXmlSync<ISkillXmlData>(configPath);

      if (!xmlData) {
        Logger.Error('[SkillConfig] 无法加载技能配置文件');
        return;
      }

      // 解析 xml2js 格式的数据
      const moves = xmlData.MovesTbl?.Moves?.Move;
      
      if (!moves || !Array.isArray(moves)) {
        Logger.Error('[SkillConfig] 技能数据格式错误');
        return;
      }

      let count = 0;

      for (const moveData of moves) {
        const id = moveData.ID;

        if (id > 0) {
          const skill: ISkillConfig = {
            id,
            name: moveData.Name || `技能${id}`,
            category: moveData.Category || 1,
            type: moveData.Type || 8,
            power: moveData.Power || 0,
            maxPP: moveData.MaxPP || 35,
            accuracy: moveData.Accuracy || 100,
            critRate: moveData.CritRate || 1,
            priority: moveData.Priority || 0,
            mustHit: (moveData.MustHit || 0) === 1,
            sideEffect: moveData.SideEffect,
            sideEffectArg: moveData.SideEffectArg
          };

          this._skills.set(id, skill);
          count++;
        }
      }

      this._loaded = true;
      Logger.Info(`[SkillConfig] 成功加载 ${count} 个技能配置 (路径: ${configPath})`);

    } catch (error) {
      Logger.Error(`[SkillConfig] 加载技能配置失败: ${error}`);
    }
  }

  /**
   * 获取技能配置
   */
  public static GetSkill(skillId: number): ISkillConfig | undefined {
    if (!this._loaded) {
      this.Load();
    }
    return this._skills.get(skillId);
  }

  /**
   * 获取技能威力
   */
  public static GetSkillPower(skillId: number): number {
    const skill = this.GetSkill(skillId);
    return skill?.power || 40;
  }

  /**
   * 获取技能最大PP
   */
  public static GetSkillMaxPP(skillId: number): number {
    const skill = this.GetSkill(skillId);
    return skill?.maxPP || 20;
  }

  /**
   * 获取技能名称
   */
  public static GetSkillName(skillId: number): string {
    const skill = this.GetSkill(skillId);
    return skill?.name || `技能${skillId}`;
  }

  /**
   * 检查技能是否存在
   */
  public static HasSkill(skillId: number): boolean {
    if (!this._loaded) {
      this.Load();
    }
    return this._skills.has(skillId);
  }

  /**
   * 获取所有技能
   */
  public static GetAllSkills(): ISkillConfig[] {
    if (!this._loaded) {
      this.Load();
    }
    return Array.from(this._skills.values());
  }

  /**
   * 重新加载配置
   */
  public static Reload(): void {
    this._skills.clear();
    this._loaded = false;
    this.Load();
  }
}

// 注释掉自动加载，改为按需加载
// 只有GameServer需要时才调用 SkillConfig.Load()
// SkillConfig.Load();
