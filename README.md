# YapiHelper
## 使用方法
复制出yapi的JSONSchema，粘贴到ts文件中。

全选JSONSchema，右键选择【转换为类型】。

## 配置

### 类型映射
默认值
```js
{
  "number": ["number", "integer", "long", "int", "bigdecimal"],
  "string": ["string"],
  "boolean": ["boolean"]
}
```
key是生成的interface中的类型，value数组是在yapi中看到的类型。
例如，想把Date类型映射为number，就在number数组中填入Date。