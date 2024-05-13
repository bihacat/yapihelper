import { PropertiesType, PropertiesValType, PropertyItemsType, TypeMapType } from './interface';

let ignoredType: string[] = [];
let _yapiTypeMap: TypeMapType;
let _extTypeMap: TypeMapType;
/** 根据空格数量缩进 */
const indentSpace = (num: number) => {
  return [...Array(num)].map((_) => ' ').join('');
};

/** 构建单条属性，如果接口没有备注，则不显示注释 */
const makeSingleProperty=(opt: {indent: number, key: string, description: string, other: string, remark?: string}) => {
  const {
    indent, key, description, other, remark,
  } = opt;
  return `${description && `\n${indentSpace(indent)}/** ${description} */`}
${indentSpace(indent)}${key}: ${other};${remark ? ` // ${remark}` : ''}`;
};

/** 根据类型不同构建单条属性，如果是对象，会递归到数字、字符串、布尔才停止 */
const parseObj2Type = (val: PropertyItemsType | PropertiesValType, key: string, indent: number, description: string) => {
  const {type} = val;
  const lowerType = type.toLowerCase();
  /** 如果是对象 */
  if (lowerType === 'object') {
    const {properties: objProperties} = val as PropertyItemsType;
    if (!objProperties || !Object.keys(objProperties).length) {
      return makeSingleProperty({indent, key, description, other: 'Record<string, unknown>'});
    }
    return makeSingleProperty({indent, key, description, other: `{${properties2Type({properties: objProperties, indent: indent+2})}\n${indentSpace(indent)}}`}).slice(0, -1);
  }
  const typeStr = _yapiTypeMap[lowerType];
  if (typeStr) {
    return makeSingleProperty({indent, key, description, other:typeStr});
  }
  const extTypeStr = _extTypeMap[lowerType];
  if (extTypeStr) {
    return makeSingleProperty({indent, key, description, other:extTypeStr, remark: `${type}=>${extTypeStr}`});
  }
  ignoredType.push(type);
  return makeSingleProperty({indent, key, description, other: 'unknown', remark: type});
};

/** 遍历全部属性 */
const properties2Type = (options: {
  properties: PropertiesType,
  indent?: number,
  typeMap?: TypeMapType,
  extTypeMap?: TypeMapType,
  name?: string,
}) => {
  const {
    properties,
    indent = 2,
    typeMap,
    extTypeMap,
  } = options;
  if (typeMap) {_yapiTypeMap = typeMap;}
  if (extTypeMap) {_extTypeMap = extTypeMap;}
  const keys = Object.keys(properties);
  return keys.map((key) => {
    const val = properties[key];
    const {type, description = ''} = val;
    let currentResult = '';
    if (type === 'array') {// 数组需要特殊做处理
      const {items} = val;
      currentResult += `${parseObj2Type(items!, key, indent, description)}[];`;
    } else {
      currentResult += parseObj2Type(val, key, indent, description);
    }
    return currentResult;
  }).join('');
};

export {
  properties2Type,
};