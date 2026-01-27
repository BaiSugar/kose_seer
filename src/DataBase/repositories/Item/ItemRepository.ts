/**
 * 物品仓库
 */
import { BaseRepository } from '../BaseRepository';

/**
 * 物品信息接口
 */
export interface IItemInfo {
  id: number;           // 记录ID
  ownerId: number;      // 所属玩家ID
  itemId: number;       // 物品ID
  count: number;        // 数量
  expireTime: number;   // 过期时间（0=永久）
  itemLevel: number;    // 物品等级
}

/**
 * 数据库物品行类型
 */
interface IItemRow {
  id: number;
  owner_id: number;
  item_id: number;
  count: number;
  expire_time: number;
  item_level: number;
}

export class ItemRepository extends BaseRepository<IItemRow> {
  protected _tableName = 'player_items';

  /**
   * 根据玩家ID获取所有物品
   */
  public async FindByOwnerId(ownerId: number): Promise<IItemInfo[]> {
    const rows = await this._db.Query<IItemRow>(
      'SELECT * FROM player_items WHERE owner_id = ? ORDER BY item_id ASC',
      [ownerId]
    );

    return rows.map(row => this.toItemInfo(row));
  }

  /**
   * 根据物品ID范围查询
   */
  public async FindByItemIdRange(ownerId: number, minId: number, maxId: number): Promise<IItemInfo[]> {
    const rows = await this._db.Query<IItemRow>(
      'SELECT * FROM player_items WHERE owner_id = ? AND item_id >= ? AND item_id <= ? ORDER BY item_id ASC',
      [ownerId, minId, maxId]
    );

    return rows.map(row => this.toItemInfo(row));
  }

  /**
   * 获取指定物品
   */
  public async FindItem(ownerId: number, itemId: number): Promise<IItemInfo | null> {
    const rows = await this._db.Query<IItemRow>(
      'SELECT * FROM player_items WHERE owner_id = ? AND item_id = ?',
      [ownerId, itemId]
    );

    if (rows.length === 0) return null;
    return this.toItemInfo(rows[0]);
  }

  /**
   * 添加物品（如果已存在则增加数量）
   */
  public async AddItem(ownerId: number, itemId: number, count: number, expireTime: number = 0, itemLevel: number = 0): Promise<boolean> {
    // 检查是否已存在
    const existing = await this.FindItem(ownerId, itemId);
    
    if (existing) {
      // 已存在，增加数量
      const result = await this._db.Execute(
        'UPDATE player_items SET count = count + ? WHERE owner_id = ? AND item_id = ?',
        [count, ownerId, itemId]
      );
      return result.affectedRows > 0;
    } else {
      // 不存在，插入新记录
      const result = await this._db.Execute(
        'INSERT INTO player_items (owner_id, item_id, count, expire_time, item_level) VALUES (?, ?, ?, ?, ?)',
        [ownerId, itemId, count, expireTime, itemLevel]
      );
      return result.affectedRows > 0;
    }
  }

  /**
   * 减少物品数量
   */
  public async RemoveItem(ownerId: number, itemId: number, count: number): Promise<boolean> {
    const existing = await this.FindItem(ownerId, itemId);
    
    if (!existing) return false;
    
    if (existing.count <= count) {
      // 数量不足或刚好，删除记录
      const result = await this._db.Execute(
        'DELETE FROM player_items WHERE owner_id = ? AND item_id = ?',
        [ownerId, itemId]
      );
      return result.affectedRows > 0;
    } else {
      // 减少数量
      const result = await this._db.Execute(
        'UPDATE player_items SET count = count - ? WHERE owner_id = ? AND item_id = ?',
        [count, ownerId, itemId]
      );
      return result.affectedRows > 0;
    }
  }

  /**
   * 设置物品数量
   */
  public async SetItemCount(ownerId: number, itemId: number, count: number): Promise<boolean> {
    if (count <= 0) {
      // 删除物品
      const result = await this._db.Execute(
        'DELETE FROM player_items WHERE owner_id = ? AND item_id = ?',
        [ownerId, itemId]
      );
      return result.affectedRows > 0;
    }

    const existing = await this.FindItem(ownerId, itemId);
    
    if (existing) {
      const result = await this._db.Execute(
        'UPDATE player_items SET count = ? WHERE owner_id = ? AND item_id = ?',
        [count, ownerId, itemId]
      );
      return result.affectedRows > 0;
    } else {
      const result = await this._db.Execute(
        'INSERT INTO player_items (owner_id, item_id, count, expire_time, item_level) VALUES (?, ?, ?, 0, 0)',
        [ownerId, itemId, count]
      );
      return result.affectedRows > 0;
    }
  }

  /**
   * 检查物品是否存在
   */
  public async HasItem(ownerId: number, itemId: number): Promise<boolean> {
    const item = await this.FindItem(ownerId, itemId);
    return item !== null && item.count > 0;
  }

  /**
   * 统计物品数量
   */
  public async CountItems(ownerId: number): Promise<number> {
    const rows = await this._db.Query<{ count: number }>(
      'SELECT COUNT(*) as count FROM player_items WHERE owner_id = ?',
      [ownerId]
    );

    return rows[0]?.count || 0;
  }

  /**
   * 转换为 IItemInfo
   */
  private toItemInfo(row: IItemRow): IItemInfo {
    return {
      id: row.id,
      ownerId: row.owner_id,
      itemId: row.item_id,
      count: row.count,
      expireTime: row.expire_time,
      itemLevel: row.item_level
    };
  }
}
