weixin-trap
==========
[![Build Status](https://travis-ci.org/liuxiaodong/weixin-trap.png)](https://travis-ci.org/liuxiaodong/weixin-trap)
[![Coverage Status](https://coveralls.io/repos/liuxiaodong/weixin-trap/badge.svg?branch=master&service=github)](https://coveralls.io/github/liuxiaodong/weixin-trap?branch=master)

托管多个公众号

## Installation

```
$ npm install weixin-trap --save
```

## Usage

```
var options = {
	attrNameProcessors: 'underscored',
	getConfig: function(id, callback){ // id 可能是 appid 或者是 wechat_id, 也可能是其他任何值
	  getConfigFun(id, function(err, ret){
	      config = {};
	      config.id = ret.wechat_id;
	      config.appid = ret.appid;
	      config.encryptkey = ret.encrypt_key;
	      config.appsecret = ret.appsecret;
	      config.token = ret.token;
		  callback(null, config);
	  });
	},
	saveToken: function(token, callback){
      var exp = token.expireTime - 120;
      var appid = this.appid;
      db.setex('ACCESS_TOKEN:' + appid, exp, token.accessToken, function(err){
        callback(err, token);
      });
	}
	getToken: function(){
      var appid = this.appid;
      db.get('ACCESS_TOKEN:' + appid, function(err, accessToken){
        if(err) return callback(err);
        if(!accessToken) return callback();
        var token = {
          accessToken: accessToken
        };
        db.ttl('ACCESS_TOKEN:' + appid, function(err, exp){
          if(err) return callback(err);
          token.expireTime = exp;
          callback(err, token);
        });
      });		
	}
};

var weixin = require('weixin-trap')(options);
var trap = weixin.trap;

app.use('/wechat', trap);

trap.text('hi', function(req, res){
	res.text('hello');
});


```

## Options

`getBody:`  是否 req 中的数据流，default true  

`parseXml:` 是否解析 xml 为 json 数据，defalut true

`decrypt:`  若数据加密，是否解密数据，default true

`attrNameProcessors:` 数据的格式化，例：{AppId:'123'} -> {app_id: '123'}，default 'keep'    

	* keep  保持不变  {AppId: '123'} -> {AppId: '123'}       
	* lowerCase 转小写  {AppId: '123'} -> {appid: '123'}      
	* underscored 转小写并以下划线间隔 {AppId: '123'} -> {app_id: '123'}    

`populate_user:` 微信推送来的消息是否自动扩张出用户信息，默认 false  

	* 只能获取关注用户的用户信息  

`trapHandle:` 对微信推送事件消息的默认处理函数，默认回复空字符串  

`saveToken:` 存储 accessToken 的函数，默认存储在内存中。

`getToken:` 获取 accessToken 函数。若配置了 saveToken 则必须要配置此函数，不然会找不到 accessToken 

`getConfig:` 获取微信公众号的配置信息的函数  

* getConfig 第一个参数为 appid 或公众号 id 或其他任何值，需要函数自己判断是否需要返回 config 信息。  

* 设置此函数则可不用配置 config 参数，但获取到的数据格式为如下第一种样式  

`config:` 微信公众号的配置 json 数据  
	
	```
	{
		"id": "gh_956b2584a111",
		"token": "swechatcardtest",
	 	"appid": "wx309678780eb63111",
		"appsecret": "f65a2f757b92787f137c359fa5699111",
		"encryptkey": "5iteleZLwN1UplKO08L7Fa57H5EuwPaTqnjvO85u111"
	}

	或者

	[
		{
    		"id": "gh_956b2584a111",
    		"token": "swechatcardtest",
   	 		"appid": "wx309678780eb63111",
    		"appsecret": "f65a2f757b92787f137c359fa5699111",
    		"encryptkey": "5iteleZLwN1UplKO08L7Fa57H5EuwPaTqnjvO85u111"
  		},
  		{
    		"id": "gh_ff831e3e9222",
    		"token": "swechatcardtest",
    		"appid": "wxd1fbffa91579f222",
    		"appsecret": "f11dcaf01dab462589cdeb43aeade222",
    		"encryptkey": "5iteleZLwN1UplKO08L7Fa57H5EuwPaTqnjvO85u222"      
  		}
	]
	```



##消息处理
=====


#### 文本消息

```
trap.text('hi', function(req, res){
	res.text('hello');
});
```

#### 图片

```
trap.image(function(req, res){
	res.image(media_id);
});
```

#### 录音

```
trap.voice(function(req, res){
	res.voice(media_id);
});
```

#### 视屏

```
trap.video(function(req, res){
	res.video({title:'video title', video: media_id, description: 'video description'});
});
```

#### 小视屏

```
trap.shortvideo(function(req, res){
	res.text('shortvideo');
});
```

#### 地理位置

```
trap.location(function(req, res){
	res.text('location');
});
```

#### 连接

```
trap.link(function(req, res){
	res.text('link');
});
```

#### 关注公众号 或 用户未关注时，扫描带参数二维码事件

```
trap.subscribe(function(req, res){
	res.text('subscribe');
});
```

#### 取消关注公众号

```
trap.unsubscribe(function(req, res){
	res.text('unsubscribe');
});
```

#### 用户以关注公众号，扫描带参数二维码事件

```
trap.scan(function(req, res){
	res.text('subscribe');
});
```

#### 上报地理位置

```
trap.reportedLocation(function(req, res){
	res.text('reportedLocation');
});
```

#### 菜单栏点击事件

```
trap.click('buttonA', function(req, res){
	res.text('click');
});
```

#### 菜单栏页面跳转

```
trap.view(function(req, res){
	res.text('click');
});
```

#### 卡券事件

```
trap.card(function(req, res){
	switch(req.Event){
		case 'card_pass_check': 
			return handle();
		case 'card_not_pass_check':
			return handle();
		defalut:
			res.text('no handle')
	}
});
```

#### IOT 设备事件

```
trap.device(function(req, res){
	res.device('commmand');
});
```

#### 摇周边

```
trap.shakeAround(function(req, res){
	handle();
});
```

##消息回复
=====

#### 回复文本

```
res.text('text');
```

#### 回复图片

```
res.image(media_id);
```

#### 回复录音

```
res.voice(media_id);
```

#### 回复视屏

```
res.video({title:'video title', video: media_id, description: 'video description'})
```

#### 回复音乐

```
var data = {
	title: 'music title',
	description: 'music description',
	music_url: 'music url',
	hq_music_url: 'hq music url',
	thumb_media: media_id
};

res.music(data);
```

#### 回复图文消息

```
var news = [
  {
    title: 'news title',
    description: 'news description',
    pic_url: 'news pic url',
    url: 'news url'
  },
  {
    title: 'news title 1',
    description: 'news description 1',
    pic_url: 'news pic url 1',
    url: 'news url 1'
  }  
];
	
res.news(news);	
```

#### 回复 IOT 设备消息

```
res.device('command text');
```
## API 

* api 部分对 wechat-api 进行了包装，在调用任何 API 时第一个参数可以传一个 appid 或微信公众号 id。 实现托管多个公众号时对微信 API 的调用   
* api 部分没有测试，如果遇到任何问题，请提 issues 或 PR    

`例子:`  

```
	// 给用户发消息

	weixin.api.sendText(appid, openid, text, callback);

``` 

* 若某个微信 API wechat-api 没有提供，自己可以通过 weixin.api.make 函数扩展  

`例子:`  

```
	// 批量获取用户基本信息

	weixin.api.make(weixin.api, 'batchGetUsers', function (openids, callback) {
	  var url = 'https://api.weixin.qq.com/cgi-bin/user/info/batchget?access_token=' + this.token.accessToken;
	  var data = {};
	  data.user_list = [];
	  var openidsLength = openids.length;
	  for(var i = 0; i < openidsLength; i++){
	    data.user_list.push({openid: openids[i], language: 'zh-CN'});
	  }
	  this.request(url, this.postJSON(data), this.wrapper(callback));
	});

	* 此方法经过测试，若微信用户数据有特殊字符会导致 urllib 的 JSON.parse 抛出异常。  
	* 可以接收返回 String 类型数据然后在自己处理    


	* 调用此接口  weixin.api.batchGetUsers(appid, openids, callback);
```
