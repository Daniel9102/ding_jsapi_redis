# ding_jsapi_redis
> 钉钉Node.js SDK,基于redis缓存access_token 和 ticket

### 开始
首先安装npm包
```
npm install --save ding_jsapi_redis
```

### 引用
config.js
```
//dingTalk基本配置，其中prefix为自定义的前缀，方便在redis中区分
exports.ding = {
	corpId:"<INPUT YOUR DINGTALK CORPID>",
    secret:"<INPUT YOUR DINGTALK CORPSECRET>",
    prefix:"<INPUT YOUR PREFIX>"
};
exports.redis = {
	port:6379,
    host :'192.168.1.218',
    auth:{}
};
```
在需要调用的地方
```
var ding = require("ding_jsapi_redis");
var config = require(PATH+"/config");
//传入参数
ding.conf.ding = config.ding;
ding.conf.redis = config.redis;

```
### 使用
通用get请求
```
//通用get请求
ding.httpGetFunc({
	action:"department/get",
	params:{}
}).then()
```
参数说明：
dingTalk中一般的get请求方式为：
https://oapi.dingtalk.com/department/list?access_token=ACCESS_TOKEN
其中，https://oapi.dingtalk.com为通用部分，故在这里统一封装，在调用时直接将department/list作为调用的方法名以参数形式传入，access_token为实际参数
action:string
params:{} 为可选，默认为{}

通用post请求
```
ding.httpPostFunc({
      action : "",
      params:{}
  }).then()

```
获取ticket方法
```
//url形如http://192.168.1.6
ding.getSignature(url).then(function(data){
    /*
    {
        corpId:"",
        timeStamp:"",
        nonceStr:"",
        signature:""
    }
    */
})

```


### 举个栗子
dingTalk文档中
```
https://oapi.dingtalk.com/department/get?access_token=ACCESS_TOKEN&id=2
```
获取部门详情 department/get
实际调用时
```
ding.httpGetFunc({
	action:"department/get",
	params:{id:1}
}).then()
```



