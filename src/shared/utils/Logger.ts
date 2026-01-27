// ANSI 颜色码
export const Colors = {
  Reset: '\x1b[0m',

  // 前景色
  Black: '\x1b[30m',
  Red: '\x1b[31m',
  Green: '\x1b[32m',
  Yellow: '\x1b[33m',
  Blue: '\x1b[34m',
  Magenta: '\x1b[35m',
  Cyan: '\x1b[36m',
  White: '\x1b[37m',

  // 亮色
  BrightBlack: '\x1b[90m',
  BrightRed: '\x1b[91m',
  BrightGreen: '\x1b[92m',
  BrightYellow: '\x1b[93m',
  BrightBlue: '\x1b[94m',
  BrightMagenta: '\x1b[95m',
  BrightCyan: '\x1b[96m',
  BrightWhite: '\x1b[97m',
} as const;

// 日志级别
export enum LogLevel {
  Debug = 'DEBUG',
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR',
}

// 日志级别映射
const LogLevelMap: Record<string, LogLevel> = {
  'debug': LogLevel.Debug,
  'info': LogLevel.Info,
  'warn': LogLevel.Warn,
  'error': LogLevel.Error,
};

// 日志级别对应的颜色
const LevelColors: Record<LogLevel, string> = {
  [LogLevel.Debug]: Colors.BrightBlack,
  [LogLevel.Info]: Colors.BrightGreen,
  [LogLevel.Warn]: Colors.BrightYellow,
  [LogLevel.Error]: Colors.BrightRed,
};

// 获取调用栈信息
interface IStackInfo {
  FilePath: string;
  Line: number;
  MethodName: string;
  IsInternal?: boolean;
}

function ParseStackLine(line: string): IStackInfo | null {
  const match = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):\d+\)?/);
  if (!match)
    return null;

  const methodName = match[1] || 'anonymous';
  const filePath = match[2] || 'unknown';
  const lineNum = parseInt(match[3], 10) || 0;

  const isInternal = filePath.startsWith('node:') ||
                     filePath.includes('node_modules') ||
                     filePath.includes('internal/') ||
                     methodName.includes('Object.') ||
                     methodName.includes('Module.') ||
                     methodName.includes('Wrapper');

  const fileName = filePath.split(/[/\\]/).pop() || filePath;

  return {
    FilePath: fileName,
    Line: lineNum,
    MethodName: methodName,
    IsInternal: isInternal,
  };
}

function IsValidMethodName(name: string): boolean {
  if (!name) return false;
  if (name === 'anonymous') return false;
  if (name.includes('<')) return false;
  if (name.includes('Object.')) return false;
  if (name.includes('Module.')) return false;
  if (name.includes('Wrapper')) return false;
  if (name.includes('process.')) return false;
  return true;
}

function GetStackInfo(stackIndex: number = 3): IStackInfo {
  const stack = new Error().stack;
  if (!stack)
    return { FilePath: 'unknown', Line: 0, MethodName: 'unknown' };

  const lines = stack.split('\n');
  if (lines.length <= stackIndex)
    return { FilePath: 'unknown', Line: 0, MethodName: 'unknown' };

  const targetInfo = ParseStackLine(lines[stackIndex]);
  if (!targetInfo)
    return { FilePath: 'unknown', Line: 0, MethodName: 'unknown' };

  if (!IsValidMethodName(targetInfo.MethodName)) {
    for (let i = stackIndex + 1; i < lines.length; i++) {
      const info = ParseStackLine(lines[i]);
      if (info && !info.IsInternal && IsValidMethodName(info.MethodName)) {
        targetInfo.MethodName = info.MethodName;
        break;
      }
    }
    if (!IsValidMethodName(targetInfo.MethodName)) {
      targetInfo.MethodName = targetInfo.FilePath.replace(/\.[^.]+$/, '');
    }
  }

  return targetInfo;
}

function FormatTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

function FormatMessage(level: LogLevel, message: string, stackInfo: IStackInfo, tag?: string): string {
  const time = FormatTime();
  const levelColor = LevelColors[level];
  const methodName = tag || stackInfo.MethodName;

  return `${Colors.BrightBlack}[${time}]${Colors.Reset} ` +
         `${levelColor}[${level.padEnd(5)}]${Colors.Reset} ` +
         `${Colors.Cyan}[${stackInfo.FilePath}:${stackInfo.Line}]${Colors.Reset} ` +
         `${Colors.Magenta}[${methodName}]${Colors.Reset} ` +
         `${Colors.White}${message}${Colors.Reset}`;
}

function FormatStack(error: Error): string {
  if (!error.stack)
    return '';

  const lines = error.stack.split('\n').slice(1);
  return lines.map(line => `${Colors.BrightBlack}${line}${Colors.Reset}`).join('\n');
}

interface ILogOptions {
  Tag?: string;
}

export class Logger {
  private static _minLevel: LogLevel = LogLevel.Info;

  /**
   * 初始化日志系统（从配置加载）
   */
  public static Initialize(configLevel?: string): void {
    if (configLevel) {
      const level = LogLevelMap[configLevel.toLowerCase()] || LogLevel.Info;
      Logger._minLevel = level;
      Logger.Info(`[Logger] 日志级别设置为: ${configLevel.toUpperCase()}`);
    }
  }

  public static SetMinLevel(level: LogLevel): void {
    Logger._minLevel = level;
  }

  private static ShouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error];
    return levels.indexOf(level) >= levels.indexOf(Logger._minLevel);
  }

  public static Debug(message: string, options?: ILogOptions): void {
    if (!Logger.ShouldLog(LogLevel.Debug))
      return;
    const stackInfo = GetStackInfo();
    const formattedMessage = FormatMessage(LogLevel.Debug, message, stackInfo, options?.Tag);
    console.log(formattedMessage);
  }

  public static Info(message: string, options?: ILogOptions): void {
    if (!Logger.ShouldLog(LogLevel.Info))
      return;
    const stackInfo = GetStackInfo();
    const formattedMessage = FormatMessage(LogLevel.Info, message, stackInfo, options?.Tag);
    console.log(formattedMessage);
  }

  public static Warn(message: string, options?: ILogOptions): void {
    if (!Logger.ShouldLog(LogLevel.Warn))
      return;
    const stackInfo = GetStackInfo();
    const formattedMessage = FormatMessage(LogLevel.Warn, message, stackInfo, options?.Tag);
    console.warn(formattedMessage);
  }

  public static Error(message: string, error?: Error, options?: ILogOptions): void {
    if (!Logger.ShouldLog(LogLevel.Error))
      return;
    const stackInfo = GetStackInfo();
    const formattedMessage = FormatMessage(LogLevel.Error, message, stackInfo, options?.Tag);
    console.error(formattedMessage);

    if (error) {
      console.error(FormatStack(error));
    }
  }
}
