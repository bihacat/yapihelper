# YapiHello
## 使用方法
在ts文件中输入接口文档的链接，鼠标悬停在链接上，可以自动填充请求和响应interface。

## 配置

### Cookie

登录[https://yapi.hellobike.cn](https://yapi.hellobike.cn)后，在控制台找到四个Cookie，并填充到设置中。

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