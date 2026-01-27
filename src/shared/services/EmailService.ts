/**
 * 邮件服务 (SMTP)
 * 负责发送真实电子邮件 (验证码、通知等)
 * 注意: 这不是游戏内邮件系统，游戏内邮件由 EmailServer 处理
 */
import * as nodemailer from 'nodemailer';
import { Logger } from '../utils';
import { ConfigLoader } from '../config';

/**
 * 邮件服务配置
 */
export interface IEmailServiceConfig {
  enabled: boolean;           // 是否启用邮件发送
  smtp: {
    host: string;             // SMTP服务器地址
    port: number;             // SMTP端口
    secure: boolean;          // 是否使用SSL
    auth: {
      user: string;           // 用户名
      pass: string;           // 密码
    };
  };
  from: string;               // 发件人地址
  templateSubject: string;    // 邮件主题模板
  templateBody: string;       // 邮件正文模板
}

/**
 * 默认配置
 */
const DefaultConfig: IEmailServiceConfig = {
  enabled: false,
  smtp: {
    host: 'smtp.example.com',
    port: 465,
    secure: true,
    auth: {
      user: '',
      pass: '',
    },
  },
  from: 'noreply@seer.com',
  templateSubject: '【赛尔号】邮箱验证码',
  templateBody: '您的验证码是: {code}，有效期5分钟。请勿将验证码告诉他人。',
};

/**
 * 邮件服务 (单例)
 */
export class EmailService {
  private static _instance: EmailService;
  private _config: IEmailServiceConfig;
  private _transporter: nodemailer.Transporter | null = null;

  private constructor() {
    this._config = ConfigLoader.Load('email-service.json', DefaultConfig);
    this.Initialize();
  }

  /**
   * 获取单例实例
   */
  public static get Instance(): EmailService {
    if (!EmailService._instance) {
      EmailService._instance = new EmailService();
    }
    return EmailService._instance;
  }

  /**
   * 初始化邮件传输器
   */
  private Initialize(): void {
    if (!this._config.enabled) {
      Logger.Info('[EmailService] 邮件服务未启用，验证码将只记录到日志');
      return;
    }

    try {
      this._transporter = nodemailer.createTransport({
        host: this._config.smtp.host,
        port: this._config.smtp.port,
        secure: this._config.smtp.secure,
        auth: {
          user: this._config.smtp.auth.user,
          pass: this._config.smtp.auth.pass,
        },
      });

      Logger.Info(`[EmailService] 邮件服务已初始化: ${this._config.smtp.host}:${this._config.smtp.port}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[EmailService] 初始化邮件服务失败', error);
    }
  }

  /**
   * 发送验证码邮件
   * @param to 收件人邮箱
   * @param code 验证码
   * @returns 是否发送成功
   */
  public async SendVerificationCode(to: string, code: string): Promise<boolean> {
    // 如果未启用邮件服务，只记录日志
    if (!this._config.enabled || !this._transporter) {
      Logger.Info(`[EmailService] 模拟发送验证码: to=${to}, code=${code}`);
      return true;
    }

    try {
      const subject = this._config.templateSubject;
      const body = this._config.templateBody.replace('{code}', code);

      await this._transporter.sendMail({
        from: this._config.from,
        to,
        subject,
        text: body,
        html: `<p>${body}</p>`,
      });

      Logger.Info(`[EmailService] 验证码邮件已发送: to=${to}`);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[EmailService] 发送验证码邮件失败: to=${to}`, error);
      return false;
    }
  }

  /**
   * 是否已启用
   */
  public get IsEnabled(): boolean {
    return this._config.enabled && this._transporter !== null;
  }
}
