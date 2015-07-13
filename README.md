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


## Credit

weixin-trap 大量借鉴了 <a href="https://github.com/baoshan/wx">wx</a> 的源码内容，改写为可以托管多个公众号服务的模块

weixin-trap 的 API 部分使用了 <a href="https://github.com/node-webot/wechat-api">wechat-api</a> 模块，但为了适应系统的多公众号托管，对原接口进行了包装。这部分接口还没有测试 :><