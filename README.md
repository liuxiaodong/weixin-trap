weixin-trap
==========
[![Build Status](https://travis-ci.org/liuxiaodong/weixin-trap.png)](https://travis-ci.org/liuxiaodong/weixin-trap)
[![Coverage Status](https://coveralls.io/repos/liuxiaodong/weixin-trap/badge.png)](https://coveralls.io/github/liuxiaodong/weixin-trap)

托管多个公众号

## Installation

```
$ npm install weixin-trap --save
```

## Usage

```
var options = {
	attrNameProcessors: 'underscored'
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

`decrypt:`  若数据加密，是否解密数据，default ture

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

	* 设置此函数则可不用 config 参数，但获取到的数据格式为如下第一种样式  

`config:` 微信公众号的配置 json 数据  
	
	```
	{
		"id": "gh_956b2584a111",
		"token": "swechatcardtest",
	 	"app_id": "wx309678780eb63111",
		"app_secret": "f65a2f757b92787f137c359fa5699111",
		"encrypt_key": "5iteleZLwN1UplKO08L7Fa57H5EuwPaTqnjvO85u111"
	}

	或者

	[
		{
    		"id": "gh_956b2584a111",
    		"token": "swechatcardtest",
   	 		"app_id": "wx309678780eb63111",
    		"app_secret": "f65a2f757b92787f137c359fa5699111",
    		"encrypt_key": "5iteleZLwN1UplKO08L7Fa57H5EuwPaTqnjvO85u111"
  		},
  		{
    		"id": "gh_ff831e3e9222",
    		"token": "swechatcardtest",
    		"app_id": "wxd1fbffa91579f222",
    		"app_secret": "f11dcaf01dab462589cdeb43aeade222",
    		"encrypt_key": "5iteleZLwN1UplKO08L7Fa57H5EuwPaTqnjvO85u222"      
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

* api 部分没有测试

<a href="https://github.com/node-webot/wechat-api">wechat-api</a> 


## Credit

weixin-trap 大量借鉴了 <a href="https://github.com/baoshan/wx">wx</a> 的源码内容，改写为可以托管多个公众号服务的模块

weixin-trap 的 API 部分使用了 <a href="https://github.com/node-webot/wechat-api">wechat-api</a> 模块，但为了适应系统的多公众号托管，对原接口进行了包装。这部分接口还没有测试 :><
