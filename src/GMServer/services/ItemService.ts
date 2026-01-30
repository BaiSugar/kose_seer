import { DatabaseHelper } from '../../DataBase/DatabaseHelper';
import { Logger } from '../../shared/utils/Logger';

/**
 * 物品管理服务
 */
export class ItemService {
  /**
   * 发送物品
   */
  public async giveItem(uid: number, itemId: number, count: number): Promise<void> {
    const itemData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_ItemData(uid);
    itemData.AddItem(itemId, count, 0);
    Logger.Info(`[ItemService] 发送物品: uid=${uid}, itemId=${itemId}, count=${count}`);
  }

  /**
   * 批量发送物品
   */
  public async giveItemBatch(uid: number, items: Array<{ itemId: number; count: number }>): Promise<void> {
    const itemData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_ItemData(uid);
    for (const item of items) {
      itemData.AddItem(item.itemId, item.count, 0);
    }
    Logger.Info(`[ItemService] 批量发送物品: uid=${uid}, count=${items.length}`);
  }

  /**
   * 删除物品
   */
  public async removeItem(uid: number, itemId: number, count: number): Promise<void> {
    const itemData = await DatabaseHelper.Instance.GetInstance_ItemData(uid);
    if (!itemData) {
      throw new Error('玩家物品数据不存在');
    }

    const item = itemData.ItemList.find(i => i.itemId === itemId);
    if (!item) {
      throw new Error('物品不存在');
    }

    if (item.count < count) {
      throw new Error('物品数量不足');
    }

    item.count -= count;
    if (item.count <= 0) {
      const index = itemData.ItemList.indexOf(item);
      itemData.ItemList.splice(index, 1);
    }

    Logger.Info(`[ItemService] 删除物品: uid=${uid}, itemId=${itemId}, count=${count}`);
  }

  /**
   * 获取玩家物品列表
   */
  public async getPlayerItems(uid: number): Promise<any[]> {
    const itemData = await DatabaseHelper.Instance.GetInstance_ItemData(uid);
    if (!itemData) {
      return [];
    }
    return itemData.ItemList;
  }
}
