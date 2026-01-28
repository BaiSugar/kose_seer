/**
 * 好友数据类
 * 直接映射数据库表，通过 ORM 自动保存
 * 
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */

import { DatabaseHelper } from '../DatabaseHelper';
import { Logger } from '../../shared/utils/Logger';
import { BaseData } from './BaseData';

/**
 * 好友聊天消息
 */
export interface IFriendChatData {
  sendTime: number;
  message: string;
  extraId: number;
  sendUid: number;
  receiveUid: number;
}

/**
 * 好友聊天历史
 */
export interface IFriendChatHistory {
  messageList: IFriendChatData[];
}

/**
 * 好友数据（对应数据库表 friends）
 * 
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 */
export class FriendData extends BaseData {
  /** 用户ID（主键） */
  public Uid: number;

  /** 好友列表 */
  public FriendList: number[] = [];

  /** 黑名单列表 */
  public BlackList: number[] = [];

  /** 发送的好友申请列表 */
  public SendApplyList: number[] = [];

  /** 接收的好友申请列表 */
  public ReceiveApplyList: number[] = [];

  /** 聊天历史（key: 好友 uid） */
  public ChatHistory: Map<number, IFriendChatHistory> = new Map();

  constructor(uid: number) {
    // 调用父类构造函数
    // 注意：Map 类型不需要配置为数组字段，因为 Map 的 set/delete 操作会触发顶层属性变化
    super(
      uid,
      [], // 额外的黑名单字段
      []  // 数组字段（FriendList 等是简单数组，不需要深度监听）
    );
    
    this.Uid = uid;

    // 返回 Proxy 包装的对象，实现自动保存
    return this.createProxy(this);
  }

  /**
   * 立即保存到数据库
   */
  public async save(): Promise<void> {
    try {
      await DatabaseHelper.Instance.SaveFriendData(this);
      Logger.Debug(`[FriendData] 自动保存成功: uid=${this.Uid}`);
    } catch (error) {
      Logger.Error(`[FriendData] 自动保存失败: uid=${this.Uid}`, error as Error);
    }
  }

  /**
   * 从数据库行创建 FriendData
   */
  public static FromRow(row: any): FriendData {
    const data = new FriendData(row.owner_id);
    
    // 解析 JSON 字段
    data.FriendList = row.friend_list ? JSON.parse(row.friend_list) : [];
    data.BlackList = row.black_list ? JSON.parse(row.black_list) : [];
    data.SendApplyList = row.send_apply_list ? JSON.parse(row.send_apply_list) : [];
    data.ReceiveApplyList = row.receive_apply_list ? JSON.parse(row.receive_apply_list) : [];
    data.ChatHistory = row.chat_history ? new Map(Object.entries(JSON.parse(row.chat_history))) : new Map();
    
    return data;
  }

  /**
   * 转换为数据库行
   */
  public ToRow(): any {
    return {
      owner_id: this.Uid,
      friend_list: JSON.stringify(this.FriendList),
      black_list: JSON.stringify(this.BlackList),
      send_apply_list: JSON.stringify(this.SendApplyList),
      receive_apply_list: JSON.stringify(this.ReceiveApplyList),
      chat_history: JSON.stringify(Object.fromEntries(this.ChatHistory))
    };
  }
}
