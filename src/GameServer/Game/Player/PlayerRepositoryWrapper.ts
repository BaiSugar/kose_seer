/**
 * 玩家 Repository 包装器
 * 自动注入 userId，简化 Manager 中的调用
 */

import { ItemRepository } from '../../../DataBase/repositories/Item/ItemRepository';
import { PetRepository } from '../../../DataBase/repositories/Pet/PetRepository';
import { MailRepository } from '../../../DataBase/repositories/Mail/MailRepository';
import { PlayerRepository } from '../../../DataBase/repositories/Player/PlayerRepository';
import { IPetInfo } from '../../../shared/models/PetModel';
import { IMailInfo } from '../../../shared/models/MailModel';
import { IPlayerInfo } from '../../../shared/models/PlayerModel';

/**
 * 物品 Repository 包装器
 * 自动注入 userId
 */
export class PlayerItemRepository {
  private _repo: ItemRepository;
  private _userId: number;

  constructor(userId: number) {
    this._repo = new ItemRepository();
    this._userId = userId;
  }

  public async AddItem(itemId: number, count: number, expireTime: number = 0, itemLevel: number = 0): Promise<boolean> {
    return await this._repo.AddItem(this._userId, itemId, count, expireTime, itemLevel);
  }

  public async HasItem(itemId: number): Promise<boolean> {
    return await this._repo.HasItem(this._userId, itemId);
  }

  public async RemoveItem(itemId: number, count: number): Promise<boolean> {
    return await this._repo.RemoveItem(this._userId, itemId, count);
  }

  public async FindByOwnerId(): Promise<any[]> {
    return await this._repo.FindByOwnerId(this._userId);
  }

  public async FindItem(itemId: number): Promise<any> {
    return await this._repo.FindItem(this._userId, itemId);
  }

  public async CountItems(): Promise<number> {
    return await this._repo.CountItems(this._userId);
  }

  public async SetItemCount(itemId: number, count: number): Promise<boolean> {
    return await this._repo.SetItemCount(this._userId, itemId, count);
  }

  public async FindByItemIdRange(minId: number, maxId: number): Promise<any[]> {
    return await this._repo.FindByItemIdRange(this._userId, minId, maxId);
  }
}

/**
 * 精灵 Repository 包装器
 * 自动注入 userId
 */
export class PlayerPetRepository {
  private _repo: PetRepository;
  private _userId: number;

  constructor(userId: number) {
    this._repo = new PetRepository();
    this._userId = userId;
  }

  public async Create(petInfo: IPetInfo): Promise<number> {
    return await this._repo.Create(petInfo);
  }

  public async FindPetById(petId: number): Promise<IPetInfo | null> {
    return await this._repo.FindPetById(petId);
  }

  public async FindByUserId(): Promise<IPetInfo[]> {
    return await this._repo.FindByUserId(this._userId);
  }

  public async FindInBag(): Promise<IPetInfo[]> {
    return await this._repo.FindInBag(this._userId);
  }

  public async FindInStorage(): Promise<IPetInfo[]> {
    return await this._repo.FindInStorage(this._userId);
  }

  public async FindDefault(): Promise<IPetInfo | null> {
    return await this._repo.FindDefault(this._userId);
  }

  public async UpdateHp(petId: number, hp: number): Promise<boolean> {
    return await this._repo.UpdateHp(petId, hp);
  }

  public async CurePet(petId: number): Promise<boolean> {
    return await this._repo.CurePet(petId);
  }

  public async UpdateExpAndLevel(petId: number, exp: number, level: number): Promise<boolean> {
    return await this._repo.UpdateExpAndLevel(petId, exp, level);
  }

  public async SetDefault(petId: number): Promise<boolean> {
    return await this._repo.SetDefault(this._userId, petId);
  }

  public async Release(petId: number): Promise<boolean> {
    return await this._repo.Release(petId);
  }

  public async MoveToStorage(petId: number): Promise<boolean> {
    return await this._repo.MoveToStorage(petId);
  }

  public async MoveToBag(petId: number, position: number): Promise<boolean> {
    return await this._repo.MoveToBag(petId, position);
  }

  public async UpdateNick(petId: number, nick: string): Promise<boolean> {
    return await this._repo.UpdateNick(petId, nick);
  }

  public async CountByUserId(): Promise<number> {
    return await this._repo.CountByUserId(this._userId);
  }

  public async CountInBag(): Promise<number> {
    return await this._repo.CountInBag(this._userId);
  }

  public async UpdateStats(petId: number, stats: {
    hp?: number;
    maxHp?: number;
    atk?: number;
    def?: number;
    spAtk?: number;
    spDef?: number;
    speed?: number;
  }): Promise<boolean> {
    return await this._repo.UpdateStats(petId, stats);
  }

  public async UpdateSkills(petId: number, skills: number[]): Promise<boolean> {
    return await this._repo.UpdateSkills(petId, skills);
  }
}

/**
 * 邮件 Repository 包装器
 * 自动注入 userId
 */
export class PlayerMailRepository {
  private _repo: MailRepository;
  private _userId: number;

  constructor(userId: number) {
    this._repo = new MailRepository();
    this._userId = userId;
  }

  public async Create(mail: IMailInfo): Promise<number> {
    return await this._repo.Create(mail);
  }

  public async FindMailById(mailId: number): Promise<IMailInfo | null> {
    return await this._repo.FindMailById(mailId);
  }

  public async FindByUserId(limit: number = 100): Promise<IMailInfo[]> {
    return await this._repo.FindByUserId(this._userId, limit);
  }

  public async FindUnreadByUserId(): Promise<IMailInfo[]> {
    return await this._repo.FindUnreadByUserId(this._userId);
  }

  public async CountUnread(): Promise<number> {
    return await this._repo.CountUnread(this._userId);
  }

  public async MarkAsRead(mailId: number): Promise<boolean> {
    return await this._repo.MarkAsRead(mailId);
  }

  public async MarkAllAsRead(): Promise<boolean> {
    return await this._repo.MarkAllAsRead(this._userId);
  }

  public async ClaimAttachment(mailId: number): Promise<boolean> {
    return await this._repo.ClaimAttachment(mailId);
  }

  public async Delete(mailId: number): Promise<boolean> {
    return await this._repo.Delete(mailId);
  }

  public async DeleteAllRead(): Promise<number> {
    return await this._repo.DeleteAllRead(this._userId);
  }

  public async DeleteExpired(): Promise<number> {
    return await this._repo.DeleteExpired();
  }

  public async CountByUserId(): Promise<number> {
    return await this._repo.CountByUserId(this._userId);
  }
}

/**
 * 玩家基础信息 Repository 包装器
 * 自动注入 userId，并缓存玩家数据
 */
export class PlayerInfoRepository {
  private _repo: PlayerRepository;
  private _userId: number;
  private _data: IPlayerInfo | null = null;

  constructor(userId: number) {
    this._repo = new PlayerRepository();
    this._userId = userId;
  }

  /**
   * 获取缓存的玩家数据
   * 如果未加载，抛出错误
   */
  public get data(): IPlayerInfo {
    if (!this._data) {
      throw new Error(`PlayerInfoRepository: 玩家数据未加载 userId=${this._userId}`);
    }
    return this._data;
  }

  /**
   * 加载玩家数据到缓存
   */
  public async Load(): Promise<void> {
    this._data = await this._repo.FindByUserId(this._userId);
    if (!this._data) {
      throw new Error(`PlayerInfoRepository: 玩家不存在 userId=${this._userId}`);
    }
  }

  /**
   * 刷新缓存的玩家数据
   */
  public async Reload(): Promise<void> {
    await this.Load();
  }

  /**
   * 直接查询数据库（不使用缓存）
   */
  public async FindByUserId(): Promise<IPlayerInfo | null> {
    return await this._repo.FindByUserId(this._userId);
  }

  public async UpdateNickname(newNick: string): Promise<boolean> {
    return await this._repo.UpdateNickname(this._userId, newNick);
  }

  public async UpdateColor(newColor: number): Promise<boolean> {
    return await this._repo.UpdateColor(this._userId, newColor);
  }

  public async UpdateCurrency(energy?: number, coins?: number): Promise<boolean> {
    return await this._repo.UpdateCurrency(this._userId, energy, coins);
  }

  public async AddCurrency(energy?: number, coins?: number): Promise<boolean> {
    return await this._repo.AddCurrency(this._userId, energy, coins);
  }

  public async UpdatePosition(mapId: number, posX: number, posY: number): Promise<boolean> {
    return await this._repo.UpdatePosition(this._userId, mapId, posX, posY);
  }

  public async UpdateFlyMode(flyMode: number): Promise<boolean> {
    return await this._repo.UpdateFlyMode(this._userId, flyMode);
  }

  // NoNo 相关方法
  public async UpdateNoNoData(data: any): Promise<boolean> {
    return await this._repo.UpdateNoNoData(this._userId, data);
  }

  public async UpdateNoNoNick(nick: string): Promise<boolean> {
    return await this._repo.UpdateNoNoNick(this._userId, nick);
  }

  public async UpdateNoNoColor(color: number): Promise<boolean> {
    return await this._repo.UpdateNoNoColor(this._userId, color);
  }

  public async UpdateNoNoPower(power: number): Promise<boolean> {
    return await this._repo.UpdateNoNoPower(this._userId, power);
  }

  public async UpdateNoNoMate(mate: number): Promise<boolean> {
    return await this._repo.UpdateNoNoMate(this._userId, mate);
  }

  public async UpdateNoNoIq(iq: number): Promise<boolean> {
    return await this._repo.UpdateNoNoIq(this._userId, iq);
  }

  public async UpdateNoNoChip(chip: number): Promise<boolean> {
    return await this._repo.UpdateNoNoChip(this._userId, chip);
  }

  public async UpdateNoNoGrow(grow: number): Promise<boolean> {
    return await this._repo.UpdateNoNoGrow(this._userId, grow);
  }

  public async UpdateNoNoSuperLevel(level: number): Promise<boolean> {
    return await this._repo.UpdateNoNoSuperLevel(this._userId, level);
  }

  public async EnableSuperNoNo(level: number, expireTime: number): Promise<boolean> {
    return await this._repo.EnableSuperNoNo(this._userId, level, expireTime);
  }
}
