var should = require('should');
var Helper = require('./helper');
var config = require('./config');

var openid = 'ovKXbsxcjA05QLUcShoQkAMfkECE';
var media_id = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_-a';
var video = {video: media_id, title:'video title', description: 'video description'};
var music = {title: 'music title', description: 'music description', music_url: 'music url', hq_music_url: 'hq music url', thumb_media: media_id};
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


var helper;
beforeEach(function(){
  helper = new Helper();
});

describe('General Message', function(){

  // 文本消息
  it('text msg', function(done){
    var msg = '<MsgType><![CDATA[text]]></MsgType><Content><![CDATA[this is a test]]></Content><MsgId>1234567890123456</MsgId>';

    var textReg = /.*/ig;
    var p1 = helper.trapWrapper('text', textReg, function(req, res){
      req.body.Content.should.equal('this is a test');
      res.should.have.property('text');
      res.text('text');
    });
    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('text');
    });
    helper.doneWapper(p1, p2, done);

  });

  // 图片消息
  it('image msg', function(done){
    var msg = '<MsgType><![CDATA[image]]></MsgType><PicUrl><![CDATA[http://www.pic.com/url]]></PicUrl><MediaId><![CDATA[123456]]></MediaId><MsgId>1234567890123456</MsgId>';
    
    var p1 = helper.trapWrapper('image', function(req, res){
      req.body.PicUrl.should.equal('http://www.pic.com/url');
      req.body.MediaId.should.equal('123456');
      res.should.have.property('image');
      res.image(media_id);
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.image.media_id.should.equal(media_id);
    });

    helper.doneWapper(p1, p2, done);

  });

  // 录音
  it('voice msg', function(done){
    var helper = new Helper();

    var msg = '<MsgType><![CDATA[voice]]></MsgType><MediaId><![CDATA[123456]]></MediaId><Format><![CDATA[amr]]></Format><MsgId>1234567890123456</MsgId>';

    var p1 = helper.trapWrapper('voice', function(req, res){
      req.body.MediaId.should.equal('123456');
      res.should.have.property('voice');
      res.voice(media_id);
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.voice.media_id.should.equal(media_id);
    });

    helper.doneWapper(p1, p2, done);
  });

  // 视频
  it('video msg', function(done){
    var helper = new Helper();

    var msg = '<MsgType><![CDATA[video]]></MsgType><MediaId><![CDATA[123457]]></MediaId><ThumbMediaId><![CDATA[123]]></ThumbMediaId><MsgId>1234567890123456</MsgId>';

    var p1 = helper.trapWrapper('video', function(req, res){
      req.body.MediaId.should.equal('123457');
      res.should.have.property('video');
      res.video(video);
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.video.media_id.should.equal(video.video);
      ret.video.title.should.equal(video.title);
      ret.video.description.should.equal(video.description);
    });

    helper.doneWapper(p1, p2, done);  
  });

  // 小视屏
  it('shortvideo msg', function(done){
    var helper = new Helper();

    var msg = '<MsgType><![CDATA[shortvideo]]></MsgType><MediaId><![CDATA[123456]]></MediaId><ThumbMediaId><![CDATA[123]]></ThumbMediaId><MsgId>1234567890123456</MsgId>';

    var p1 = helper.trapWrapper('shortvideo', function(req, res){
      req.body.MediaId.should.equal('123456');
      res.should.have.property('music');
      res.music(music);
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, function(err, ret){
      should.not.exist(err);
      ret.music.title.should.equal(music.title);
      ret.music.description.should.equal(music.description);
      ret.music.music_url.should.equal(music.music_url);
      ret.music.hqmusic_url.should.equal(music.hq_music_url);
      ret.music.thumb_media_id.should.equal(music.thumb_media);
    });

    helper.doneWapper(p1, p2, done);
  });

  // 地理位置
  it('location msg', function(done){
    var helper = new Helper();
   
    var msg = '<MsgType><![CDATA[location]]></MsgType><Location_X>23.134521</Location_X><Location_Y>113.358803</Location_Y><Scale>20</Scale><Label><![CDATA[位置信息]]></Label><MsgId>1234567890123456</MsgId>';

    var p1 = helper.trapWrapper('location', function(req, res){
      req.body.Label.should.equal('位置信息');
      res.should.have.property('news');
      res.news(news);
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, function(err, ret){
      should.not.exist(err);
      ret.articles.item.should.have.lengthOf(2);
    });

    helper.doneWapper(p1, p2, done);
  });  

  // 连接
  it('link msg', function(done){
    var helper = new Helper();

    var msg = '<MsgType><![CDATA[link]]></MsgType><Title><![CDATA[公众平台官网链接]]></Title><Description><![CDATA[公众平台官网链接]]></Description><Url><![CDATA[http://www.url.com]]></Url><MsgId>1234567890123456</MsgId>';

    var p1 = helper.trapWrapper('link', function(req, res){
      req.body.Title.should.equal('公众平台官网链接');
      res.text('link');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('link');
    });

    helper.doneWapper(p1, p2, done);
  });          

});