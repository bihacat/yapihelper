import * as vscode from 'vscode';
import { ApiDataType, PropertiesType, PropertiesValType, PropertyItemsType, PropertyType, TypeMapType } from './interface';

let ignoredType: string[] = [];
/** 根据空格数量缩进 */
const indentSpace = (num: number) => {
  return [...Array(num)].map((_) => ' ').join('');
}

/** 构建单条属性，如果接口没有备注，则不显示注释 */
const makeSingleProperty=(indent: number, key: string, description: string, other: string) => {
  return `${description && `\n${indentSpace(indent)}/** ${description} */`}
${indentSpace(indent)}${key}: ${other};`
}

/** 转换Query */
const query2Type = (queries: {name: string, desc: string}[]) => {
  return queries.map((query) => makeSingleProperty(2, query.name, query.desc, 'string')).join(',')
}

/** 接口title提取注释部分 */
const markFromApiData = (apiData: ApiDataType) => {
  const {title} = apiData;
  const [, mark] = title.match(/\((.*?)\)/) || [];
  return mark;
}

const typeMap = () => {
  const config = vscode.workspace.getConfiguration('yapihello');
  const typeMap = config.typeMap as TypeMapType;
  return Object.entries(typeMap).reduce((prev, [val, keys]) => ({
    ...prev,
    ...keys.map((key) => ({
      [key]: val,
    })).reduce((prev, cur) => ({
      ...prev,
      ...cur,
    }), {}),
  }), {} as Record<string, string>);
}

/** 根据类型不同构建单条属性，如果是对象，会递归到数字、字符串、布尔才停止 */
const parseObj2Type = (val: PropertyItemsType | PropertiesValType, key: string, indent: number, description: string) => {
  const {type} = val;
  const lowerType = type.toLowerCase();
  /** 如果是对象 */
  if (lowerType === 'object') {
    const {properties: objProperties} = val as PropertyItemsType;
    if (!objProperties || !Object.keys(objProperties).length) {
      return makeSingleProperty(indent, key, description, 'Record<string, unknown>');
    }
    return makeSingleProperty(indent, key, description, `{${properties2Type(objProperties, indent+2)}\n${indentSpace(indent)}}`).slice(0, -1);
  }
  const typeStr = typeMap()[lowerType];
  if (typeStr) {
    return makeSingleProperty(indent, key, description, typeStr)
  }
  ignoredType.push(type);
  return makeSingleProperty(indent, key, description, 'unknown');
}

/** 遍历全部属性 */
const properties2Type = (properties: PropertiesType, indent=2) => {
  const keys = Object.keys(properties);
  return keys.map((key) => {
    const val = properties[key];
    const {type, description = ''} = val;
    let currentResult = '';
    if (type === 'array') {// 数组需要特殊做处理
      const {items} = val;
      currentResult += `${parseObj2Type(items!, key, indent, description)}[];`
    } else {
      currentResult += parseObj2Type(val, key, indent, description);
    }
    return currentResult
  }).join('');
}

const genYapiInterface = (options: {apiData: ApiDataType, name?: string, indent?: number}) => {
  const { apiData, indent } = options;
  const name = pathToInterfaceName(apiData)
  const { req_body_other = '{}', res_body = '{}', req_query = [] } = apiData;
  const { properties: reqProperties = [] } = JSON.parse(req_body_other);
  const { properties: resProperties = [] } = JSON.parse(res_body);
  ignoredType = [];
  const reqText = `\
${req_query.length > 0 ? `\
/** ${markFromApiData(apiData)}请求参数 */
export interface ${name}ParamsType {
 ${query2Type(req_query)}
}\n` : ''}\
/** ${markFromApiData(apiData)}请求参数 */
export interface ${name}ParamsType {${properties2Type(reqProperties, indent)}
}
`
  const reqignoredType = [...ignoredType];

  ignoredType = [];
  const respText = `\
/** ${markFromApiData(apiData)}响应参数 */
export interface ${name}Type {${properties2Type(resProperties, indent)}
}
`;
  const respignoredType = [...ignoredType];

  return {
    req: {
      text: reqText,
      ignoredType: reqignoredType,
    },
    resp: {
      text: respText,
      ignoredType: respignoredType,
    },
  }
}

/** 接口数据提取action（不一定准确） */
const actionFromApiData = (apiData: ApiDataType) => {
  const {title, path} = apiData;
  let action = '';
  if (title.includes('.')) {
    [, action] = title.match(/(.*?)\(/) || [];
  }
  if (path.includes('.')) {
    action = path;
  }
  return action
}

/** 接口path转化为interface名 */
const pathToInterfaceName = (apiData: ApiDataType, platform='pmsadmin') => {
  if (['pmsweb', 'pmsh5', 'rentcarh5'].includes(platform)) {
    return actionFromApiData(apiData).split('.').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  }
  if (platform === 'pmsadmin') {
    return apiData.path.split('/').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  }
}

export {
  pathToInterfaceName,
  genYapiInterface,
}