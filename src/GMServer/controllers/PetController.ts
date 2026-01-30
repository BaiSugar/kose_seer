import { Request, Response } from 'express';
import { PetService } from '../services/PetService';
import { Logger } from '../../shared/utils/Logger';

/**
 * 精灵管理控制器
 */
export class PetController {
  private petService: PetService;

  constructor() {
    this.petService = new PetService();
  }

  /**
   * 发送精灵
   */
  public givePet = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { uid } = req.params;
      const { petId, level = 1, shiny = false } = req.body;
      
      if (!petId) {
        return res.status(400).json({ success: false, error: '缺少参数: petId' });
      }
      
      await this.petService.givePet(Number(uid), petId, level, shiny);
      res.json({ success: true, message: '精灵发送成功' });
    } catch (error) {
      Logger.Error(`[PetController] 发送精灵失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 删除精灵
   */
  public removePet = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { uid } = req.params;
      const { catchTime } = req.body;
      
      if (!catchTime) {
        return res.status(400).json({ success: false, error: '缺少参数: catchTime' });
      }
      
      await this.petService.removePet(Number(uid), catchTime);
      res.json({ success: true, message: '精灵删除成功' });
    } catch (error) {
      Logger.Error(`[PetController] 删除精灵失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 修改精灵属性
   */
  public updatePet = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { uid } = req.params;
      const { catchTime, field, value } = req.body;
      
      if (!catchTime || !field || value === undefined) {
        return res.status(400).json({ success: false, error: '缺少参数: catchTime, field, value' });
      }
      
      await this.petService.updatePet(Number(uid), catchTime, field, value);
      res.json({ success: true, message: '精灵属性修改成功' });
    } catch (error) {
      Logger.Error(`[PetController] 修改精灵属性失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 获取玩家精灵列表
   */
  public getPlayerPets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      const pets = await this.petService.getPlayerPets(Number(uid));
      res.json({ success: true, data: pets });
    } catch (error) {
      Logger.Error(`[PetController] 获取玩家精灵失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 治疗精灵
   */
  public curePet = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { uid } = req.params;
      const { catchTime } = req.body;
      
      if (!catchTime) {
        return res.status(400).json({ success: false, error: '缺少参数: catchTime' });
      }
      
      await this.petService.curePet(Number(uid), catchTime);
      res.json({ success: true, message: '精灵治疗成功' });
    } catch (error) {
      Logger.Error(`[PetController] 治疗精灵失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 治疗所有精灵
   */
  public cureAllPets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      await this.petService.cureAllPets(Number(uid));
      res.json({ success: true, message: '所有精灵治疗成功' });
    } catch (error) {
      Logger.Error(`[PetController] 治疗所有精灵失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 设置精灵等级
   */
  public setPetLevel = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { uid } = req.params;
      const { catchTime, level } = req.body;
      
      if (!catchTime || !level) {
        return res.status(400).json({ success: false, error: '缺少参数: catchTime, level' });
      }
      
      await this.petService.setPetLevel(Number(uid), catchTime, level);
      res.json({ success: true, message: '精灵等级设置成功' });
    } catch (error) {
      Logger.Error(`[PetController] 设置精灵等级失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };
}
