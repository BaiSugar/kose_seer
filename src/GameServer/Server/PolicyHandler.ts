import { Socket } from 'net';
import { Logger } from '../../shared/utils';

// Flash Socket Policy 响应
const POLICY_RESPONSE = '<?xml version="1.0"?><!DOCTYPE cross-domain-policy SYSTEM "http://www.adobe.com/xml/dtds/cross-domain-policy.dtd"><cross-domain-policy><allow-access-from domain="*" to-ports="*"/></cross-domain-policy>\0';

/**
 * Flash Socket Policy 处理器
 */
export class PolicyHandler {
  /**
   * 检查并处理策略文件请求
   * @returns true 如果是策略请求并已处理，false 否则
   */
  public static Handle(socket: Socket, data: Buffer, address: string): boolean {
    const dataStr = data.toString('utf8');

    if (dataStr.startsWith('<policy-file-request/>')) {
      Logger.Info(`发送策略文件响应: ${address}`);
      socket.write(POLICY_RESPONSE);
      return true;
    }

    return false;
  }
}
