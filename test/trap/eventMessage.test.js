var should = require('should');
var sinon = require('sinon');
var Helper = require('./helper');
var config = require('./config');

var openid = 'ovKXbsxcjA05QLUcShoQkAMfkECE';

var helper;
before(function(){
  helper = new Helper();
});

describe('Event Message', function(){

  // 关注公众号
  it('subscribe', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[subscribe]]></Event>';

    var p1 = helper.trapWrapper('subscribe', function(req, res){
      req.body.Event.should.equal('subscribe');
      req.body.FromUserName.should.equal(openid);
      res.text('subscribe success');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('subscribe success');
    });
    helper.doneWapper(p1, p2, done);
  });
  
  // 取消关注
  it('unsubscribe', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[unsubscribe]]></Event>';

    var p1 = helper.trapWrapper('unsubscribe', function(req, res){
      req.body.Event.should.equal('unsubscribe');
      req.body.FromUserName.should.equal(openid);
      res.text('unsubscribe success');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('unsubscribe success');
    });
    helper.doneWapper(p1, p2, done);
  });

  // 用户未关注时，扫描带参数二维码事件
  it('scan and subscribe', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[subscribe]]></Event><EventKey><![CDATA[qrscene_123123]]></EventKey><Ticket><![CDATA[TICKET]]></Ticket>';

    var p1 = helper.trapWrapper('subscribe', function(req, res){
      req.body.Event.should.equal('subscribe');
      req.body.FromUserName.should.equal(openid);
      req.body.EventKey.should.equal('qrscene_123123');
      res.text('scan and subscribe success');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('scan and subscribe success');
    });
    helper.doneWapper(p1, p2, done);
  });

  // 扫描带参数二维码事件
  it('scan', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[SCAN]]></Event><EventKey><![CDATA[SCENE_VALUE]]></EventKey><Ticket><![CDATA[TICKET]]></Ticket>';

    var p1 = helper.trapWrapper('scan', function(req, res){
      req.body.Event.should.equal('SCAN');
      req.body.FromUserName.should.equal(openid);
      req.body.EventKey.should.equal('SCENE_VALUE');
      res.text('scan success');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('scan success');
    });
    helper.doneWapper(p1, p2, done);
  });  

  // 上报地理位置， 经纬度
  it('reported location', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[LOCATION]]></Event><Latitude>23.137466</Latitude><Longitude>113.352425</Longitude><Precision>119.385040</Precision>';

    var p1 = helper.trapWrapper('reportedLocation', function(req, res){
      req.body.Event.should.equal('LOCATION');
      req.body.Latitude.should.equal('23.137466');
      res.text('reported location');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('reported location');
    });

    helper.doneWapper(p1, p2, done);
  });

  // 菜单栏点击事件
  it('menu click', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[CLICK]]></Event><EventKey><![CDATA[click_test]]></EventKey>';

    var p1 = helper.trapWrapper('click', 'click_test', function(req, res){
      req.body.Event.should.equal('CLICK');
      req.body.EventKey.should.equal('click_test');
      res.text('click');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('click');
    });

    helper.doneWapper(p1, p2, done);
  });

  // 菜单栏页面跳转
  it('menu view', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[VIEW]]></Event><EventKey><![CDATA[http://www.example.com]]></EventKey>';

    var p1 = helper.trapWrapper('view', function(req, res){
      req.body.Event.should.equal('VIEW');
      req.body.EventKey.should.equal('http://www.example.com');
      res.text('view');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('view');
    });

    helper.doneWapper(p1, p2, done);
  });  

  // 菜单栏页面跳转，公众号给用户推送一个图片消息
  it('apply image but get access_token failure', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[VIEW]]></Event><EventKey><![CDATA[http://www.example.com]]></EventKey>';

    var p1 = helper.trapWrapper('view', function(req, res){
      req.body.Event.should.equal('VIEW');
      req.body.EventKey.should.equal('http://www.example.com');
      res.image('http://www.asdf.com/a.jpg');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      ret = ret || '';
      ret.should.equal('');
    });

    helper.doneWapper(p1, p2, done);
  });

  // 菜单栏页面跳转，公众号给用户推送一个图片消息
  it('apply image but image file not exits', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[VIEW]]></Event><EventKey><![CDATA[http://www.example.com]]></EventKey>';

    helper = new Helper({
      getToken: function(callback){
        callback(null, {accessToken: '1234568'});
      }
    });
    var p1 = helper.trapWrapper('view', function(req, res){
      req.body.Event.should.equal('VIEW');
      req.body.EventKey.should.equal('http://www.example.com');
      res.image('http://www.asdf.com/a.jpg');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      ret = ret || '';      
      ret.should.equal('');
    });

    helper.doneWapper(p1, p2, done);
  });  

  // 菜单栏页面跳转，公众号给用户推送一个图片消息
  it('apply image but upload image failure', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[VIEW]]></Event><EventKey><![CDATA[http://www.example.com]]></EventKey>';

    helper = new Helper({
      getToken: function(callback){
        callback(null, {accessToken: '1234568'});
      }
    });
    var p1 = helper.trapWrapper('view', function(req, res){
      req.body.Event.should.equal('VIEW');
      req.body.EventKey.should.equal('http://www.example.com');
      var file = __dirname + '/a0.jpg';
      console.log(file);
      res.image(file);
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      ret = ret || '';      
      ret.should.equal('');
    });

    helper.doneWapper(p1, p2, done);
  });   

  // 菜单栏页面跳转，公众号给用户推送一个音频消息
  it('apply voice but upload voice failure', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[VIEW]]></Event><EventKey><![CDATA[http://www.example.com]]></EventKey>';

    helper = new Helper({
      getToken: function(callback){
        callback(null, {accessToken: '1234568'});
      }
    });
    var p1 = helper.trapWrapper('view', function(req, res){
      req.body.Event.should.equal('VIEW');
      req.body.EventKey.should.equal('http://www.example.com');
      res.voice('asdfasdf');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      ret = ret || '';      
      ret.should.equal('');
    });

    helper.doneWapper(p1, p2, done);
  }); 

  // 菜单栏页面跳转，公众号给用户推送一个视频消息
  it('apply video but upload video failure', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[VIEW]]></Event><EventKey><![CDATA[http://www.example.com]]></EventKey>';

    helper = new Helper({
      getToken: function(callback){
        callback(null, {accessToken: '1234568'});
      }
    });
    var video = {video: 'asdfklajsfd', title:'video title', description: 'video description'};
    var p1 = helper.trapWrapper('view', function(req, res){
      req.body.Event.should.equal('VIEW');
      req.body.EventKey.should.equal('http://www.example.com');
      res.video(video);
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      ret = ret || '';      
      ret.should.equal('');
    });

    helper.doneWapper(p1, p2, done);
  });

  // 菜单栏页面跳转，公众号给用户推送一断音乐
  it('apply music but upload music failure', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[VIEW]]></Event><EventKey><![CDATA[http://www.example.com]]></EventKey>';

    helper = new Helper({
      getToken: function(callback){
        callback(null, {accessToken: '1234568'});
      }
    });
    var music = {title: 'music title', description: 'music description', music_url: 'music url', hq_music_url: 'hq music url', thumb_media: 'asdfklajsfd'};
    var p1 = helper.trapWrapper('view', function(req, res){
      req.body.Event.should.equal('VIEW');
      req.body.EventKey.should.equal('http://www.example.com');
      res.music(music);
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      ret = ret || '';      
      ret.should.equal('');
    });

    helper.doneWapper(p1, p2, done);
  });   

  // 菜单栏页面跳转，转客服
  it('transfer failure', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[VIEW]]></Event><EventKey><![CDATA[http://www.example.com]]></EventKey>';

    helper = new Helper({
      getToken: function(callback){
        callback(null, {accessToken: '1234568'});
      }
    });
    var music = {title: 'music title', description: 'music description', music_url: 'music url', hq_music_url: 'hq music url', thumb_media: 'asdfklajsfd'};
    var p1 = helper.trapWrapper('view', function(req, res){
      req.body.Event.should.equal('VIEW');
      req.body.EventKey.should.equal('http://www.example.com');
      res.transfer();
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      ret.msg_type.should.equal('transfer_customer_service');
    });

    helper.doneWapper(p1, p2, done);
  });   

  // 菜单栏页面跳转，空回复
  it('empty apply', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[VIEW]]></Event><EventKey><![CDATA[http://www.example.com]]></EventKey>';

    helper = new Helper({
      getToken: function(callback){
        callback(null, {accessToken: '1234568'});
      }
    });
    var music = {title: 'music title', description: 'music description', music_url: 'music url', hq_music_url: 'hq music url', thumb_media: 'asdfklajsfd'};
    var p1 = helper.trapWrapper('view', function(req, res){
      req.body.Event.should.equal('VIEW');
      req.body.EventKey.should.equal('http://www.example.com');
      res.ok();
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      ret.should.equal('');
    });

    helper.doneWapper(p1, p2, done);
  });    

});