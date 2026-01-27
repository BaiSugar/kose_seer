/**
 * Flash Socket Policy 处理器
 */
import { Socket } from 'net';
import { Logger } from '../shared/utils';

/**
 * Flash Socket Policy 响应
 */
const POLICY_RESPONSE = `<?xml version="1.0"?>
<cross-domain-policy>
  <allow-access-from domain="*" to-ports="*" />
</cross-domain-policy>\0`;

/**
 * Policy处理器
 */
export class PolicyHandler {
  /**
   * 处理Policy请求
   * @returns true 如果是Policy请求并已处理
   */
  public static Handle(socket: Socket, data: Buffer, address: string): boolean {
    const dataStr = data.toString('utf8');
    
    if (dataStr.startsWith('<policy-file-request/>')) {
      Logger.Info(`[Gateway] 收到Policy请求: ${address}`);
      socket.write(POLICY_RESPONSE);
      return true;
    }
    
    return false;
  }
}
