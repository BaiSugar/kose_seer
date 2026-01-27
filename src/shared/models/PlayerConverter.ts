/**
 * 玩家数据模型转换器
 * 负责在内部数据模型(IPlayerInfo)和Proto之间转换
 */

import { IPlayerInfo } from './PlayerModel';
import { LoginRspProto } from '../proto';
import { IClothInfo } from './PlayerModel';

/**
 * 将IPlayerInfo转换为LoginRspProto
 * 用于游戏登录响应
 */
export function PlayerInfoToLoginProto(player: IPlayerInfo, sessionKey?: string): LoginRspProto {
  const proto = new LoginRspProto();
  
  // 基础信息
  proto.userId = player.userID;
  proto.setSession(sessionKey);
  proto.setNickname(player.nick);
  
  // 等级和经验（暂时使用固定值，后续可以从player中获取）
  proto.level = 1;
  proto.exp = 0;
  
  // 货币
  proto.coins = player.coins;
  proto.energy = player.energy;
  
  // VIP信息
  proto.vipLevel = player.vipLevel;
  proto.vipValue = player.vipValue;
  
  // 服装信息
  proto.clothCount = player.clothCount;
  proto.clothes = player.clothes.map(cloth => ({ id: cloth.id }));
  
  // 精灵信息（暂时使用固定值）
  proto.currentPetId = 0;
  proto.catchId = 0;
  
  // 地图信息
  proto.mapId = player.mapID;
  proto.posX = player.posX;
  proto.posY = player.posY;
  
  return proto;
}

/**
 * 从LoginRspProto提取基础玩家信息
 * 用于更新IPlayerInfo的部分字段
 */
export function LoginProtoToPlayerInfo(proto: LoginRspProto, existingPlayer: IPlayerInfo): IPlayerInfo {
  return {
    ...existingPlayer,
    userID: proto.userId,
    nick: proto.nickname,
    coins: proto.coins,
    energy: proto.energy,
    vipLevel: proto.vipLevel,
    vipValue: proto.vipValue,
    clothCount: proto.clothCount,
    clothes: proto.clothes.map(cloth => ({ id: cloth.id, level: 0 })),
    mapID: proto.mapId,
    posX: proto.posX,
    posY: proto.posY
  };
}

/**
 * 创建简化的服装信息列表
 * 用于Proto序列化
 */
export function SimplifyClothes(clothes: IClothInfo[]): Array<{ id: number }> {
  return clothes.map(cloth => ({ id: cloth.id }));
}
