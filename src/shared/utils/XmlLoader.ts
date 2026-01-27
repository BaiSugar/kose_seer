import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './Logger';

/**
 * XML节点属性
 */
export interface IXmlAttributes {
  [key: string]: string;
}

/**
 * XML节点
 */
export interface IXmlNode {
  name: string;
  attributes: IXmlAttributes;
  children: IXmlNode[];
  text?: string;
}

/**
 * XML加载器
 * 简单的XML解析器，用于加载游戏配置文件
 */
export class XmlLoader {
  /**
   * 加载XML文件
   * @param filePath 文件路径（相对于项目根目录）
   */
  public static Load(filePath: string): IXmlNode | null {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      
      if (!fs.existsSync(fullPath)) {
        Logger.Error(`[XmlLoader] 文件不存在: ${fullPath}`);
        return null;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      return this.Parse(content);

    } catch (error) {
      Logger.Error(`[XmlLoader] 加载XML失败: ${error}`);
      return null;
    }
  }

  /**
   * 解析XML字符串
   */
  public static Parse(xmlContent: string): IXmlNode | null {
    try {
      // 移除注释
      xmlContent = xmlContent.replace(/<!--[\s\S]*?-->/g, '');
      
      // 移除XML声明
      xmlContent = xmlContent.replace(/<\?xml[^?]*\?>/g, '');
      
      // 解析根节点
      const root = this.ParseNode(xmlContent.trim());
      return root;

    } catch (error) {
      Logger.Error(`[XmlLoader] 解析XML失败: ${error}`);
      return null;
    }
  }

  /**
   * 解析单个节点
   */
  private static ParseNode(xml: string): IXmlNode | null {
    // 匹配开始标签
    const startTagMatch = xml.match(/^<([a-zA-Z0-9_]+)([^>]*)>/);
    if (!startTagMatch) return null;

    const tagName = startTagMatch[1];
    const attributesStr = startTagMatch[2];
    
    // 解析属性
    const attributes = this.ParseAttributes(attributesStr);

    // 检查是否是自闭合标签
    if (attributesStr.trim().endsWith('/')) {
      return {
        name: tagName,
        attributes,
        children: []
      };
    }

    // 查找结束标签
    const endTag = `</${tagName}>`;
    const endTagIndex = xml.lastIndexOf(endTag);
    
    if (endTagIndex === -1) {
      // 可能是自闭合标签
      return {
        name: tagName,
        attributes,
        children: []
      };
    }

    // 提取内容
    const content = xml.substring(startTagMatch[0].length, endTagIndex).trim();
    
    // 解析子节点
    const children = this.ParseChildren(content);

    return {
      name: tagName,
      attributes,
      children,
      text: children.length === 0 ? content : undefined
    };
  }

  /**
   * 解析属性
   */
  private static ParseAttributes(attrStr: string): IXmlAttributes {
    const attributes: IXmlAttributes = {};
    
    // 匹配所有属性 (key="value" 或 key='value')
    const attrRegex = /([a-zA-Z0-9_]+)\s*=\s*["']([^"']*)["']/g;
    let match;
    
    while ((match = attrRegex.exec(attrStr)) !== null) {
      attributes[match[1]] = match[2];
    }

    return attributes;
  }

  /**
   * 解析子节点
   */
  private static ParseChildren(content: string): IXmlNode[] {
    const children: IXmlNode[] = [];
    
    if (!content || content.trim().length === 0) {
      return children;
    }

    let remaining = content.trim();
    
    while (remaining.length > 0) {
      // 查找下一个标签
      const tagMatch = remaining.match(/^<([a-zA-Z0-9_]+)([^>]*)>/);
      
      if (!tagMatch) {
        // 没有更多标签了
        break;
      }

      const tagName = tagMatch[1];
      const attributesStr = tagMatch[2];
      
      // 检查是否是自闭合标签
      if (attributesStr.trim().endsWith('/')) {
        const attributes = this.ParseAttributes(attributesStr);
        children.push({
          name: tagName,
          attributes,
          children: []
        });
        
        remaining = remaining.substring(tagMatch[0].length).trim();
        continue;
      }

      // 查找对应的结束标签
      const endTag = `</${tagName}>`;
      let depth = 1;
      let endIndex = tagMatch[0].length;
      
      while (depth > 0 && endIndex < remaining.length) {
        const nextStart = remaining.indexOf(`<${tagName}`, endIndex);
        const nextEnd = remaining.indexOf(endTag, endIndex);
        
        if (nextEnd === -1) {
          break;
        }
        
        if (nextStart !== -1 && nextStart < nextEnd) {
          depth++;
          endIndex = nextStart + tagName.length + 1;
        } else {
          depth--;
          endIndex = nextEnd + endTag.length;
        }
      }

      if (depth === 0) {
        // 提取完整节点
        const nodeXml = remaining.substring(0, endIndex);
        const node = this.ParseNode(nodeXml);
        
        if (node) {
          children.push(node);
        }
        
        remaining = remaining.substring(endIndex).trim();
      } else {
        // 无法找到匹配的结束标签
        break;
      }
    }

    return children;
  }

  /**
   * 查找子节点
   */
  public static FindChild(node: IXmlNode, childName: string): IXmlNode | null {
    for (const child of node.children) {
      if (child.name === childName) {
        return child;
      }
    }
    return null;
  }

  /**
   * 查找所有子节点
   */
  public static FindChildren(node: IXmlNode, childName: string): IXmlNode[] {
    return node.children.filter(child => child.name === childName);
  }
}
