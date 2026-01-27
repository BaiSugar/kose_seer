/**
 * CommandMeta - 命令元数据系统
 * 
 * 此文件已重构为模块化结构，原有的大文件已拆分为：
 * - meta/CommandMetaRegistry.ts - 核心注册表类
 * - meta/login.meta.ts - 登录相关元数据
 * - meta/server.meta.ts - 服务器相关元数据
 * - meta/map.meta.ts - 地图相关元数据
 * - meta/chat.meta.ts - 聊天相关元数据
 * 
 * 为了保持向后兼容，此文件重新导出所有内容
 */

// 重新导出所有内容
export * from './meta';
