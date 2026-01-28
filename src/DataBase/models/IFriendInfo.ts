/**
 * 好友信息接口
 */
export interface IFriendInfo {
  id: number;
  userId: number;
  friendId: number;
  status: FriendStatus;
  createTime: number;
}

/**
 * 好友状态枚举
 */
export enum FriendStatus {
  PENDING = 0,    // 待确认
  CONFIRMED = 1   // 已确认
}

/**
 * 黑名单信息接口
 */
export interface IBlacklistInfo {
  id: number;
  userId: number;
  targetId: number;
  createTime: number;
}

/**
 * 好友数据库行接口
 */
export interface IFriendRow {
  id: number;
  userId: number;
  friendId: number;
  status: number;
  createTime: number;
}

/**
 * 黑名单数据库行接口
 */
export interface IBlacklistRow {
  id: number;
  userId: number;
  targetId: number;
  createTime: number;
}

/**
 * 创建默认好友信息
 */
export function createDefaultFriendInfo(): IFriendInfo {
  return {
    id: 0,
    userId: 0,
    friendId: 0,
    status: FriendStatus.PENDING,
    createTime: Math.floor(Date.now() / 1000)
  };
}

/**
 * 创建默认黑名单信息
 */
export function createDefaultBlacklistInfo(): IBlacklistInfo {
  return {
    id: 0,
    userId: 0,
    targetId: 0,
    createTime: Math.floor(Date.now() / 1000)
  };
}
