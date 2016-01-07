var should = require('should');
var Helper = require('./helper');
var config = require('./config');

var openid = 'ovKXbsxcjA05QLUcShoQkAMfkECE';

var helper;
before(function(){
  helper = new Helper();
});

describe('Menu', function(){

  // 点击菜单事件，未监听此事件
  it('click not listen', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[CLICK]]></Event><EventKey><![CDATA[EVENTKEY]]></EventKey>';

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.should.equal('');
    });

    helper.doneWapper(p2, done);
  }); 


  // 点击菜单事件，未监听此事件
  it('click listen incorrect', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[CLICK]]></Event><EventKey><![CDATA[EVENTKEY]]></EventKey>';

    var funInvoke = false;
    var fun = function(req, res){
      funInvoke = true;
      req.body.EventKey.should.equal('EVENTKEY');
      res.text('click');
    };
    var p1 = helper.trapWrapper('click', 'EVENTKEY111', fun);

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){      
      should.not.exist(err);
      funInvoke.should.equal(false);
      ret.should.equal('');
    });

    helper.doneWapper(p2, done);
  }); 


  // 点击菜单事件
  it('click', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[CLICK]]></Event><EventKey><![CDATA[EVENTKEY]]></EventKey>';

    var p1 = helper.trapWrapper('click', 'EVENTKEY', function(req, res){
      req.body.EventKey.should.equal('EVENTKEY');
      res.text('click');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('click');
    });

    helper.doneWapper(p1, p2, done);
  });  

  // 点击菜单事件
  it('click with two function listen', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[CLICK]]></Event><EventKey><![CDATA[EVENTKEY]]></EventKey>';

    var p1Invoke = false, p2Invoke = false;
    var p1 = helper.trapWrapper('click', 'EVENTKEY', function(req, res, next){
      req.body.EventKey.should.equal('EVENTKEY');
      p1Invoke = true;
      next();
    },  function(req, res, next){
      req.body.EventKey.should.equal('EVENTKEY');
      p2Invoke = true;
      next();
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      p1Invoke.should.equal(true);
      p2Invoke.should.equal(true);
      should.not.exist(err);
      ret.should.equal('');
    });

    helper.doneWapper(p1, p2, done);
  }); 

  // 其他事件
  it('other event', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[AAAA]]></Event><EventKey><![CDATA[EVENTKEY]]></EventKey>';

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.should.equal('');
    });

    helper.doneWapper(p2, done);
  });

  // 其他事件
  it('other msgType', function(done){
    var msg = '<MsgType><![CDATA[bbbb]]></MsgType><Event><![CDATA[AAAA]]></Event><EventKey><![CDATA[EVENTKEY]]></EventKey>';

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.should.equal('');
    });

    helper.doneWapper(p2, done);
  });   

  // 点击菜单事件
  it('click with decrypt=false', function(done){
    helper = new Helper({decrypt: false});
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[CLICK]]></Event><EventKey><![CDATA[EVENTKEY]]></EventKey>';

    var p1Invoke = false;
    var p1 = helper.trapWrapper('click', 'EVENTKEY', function(req, res){
      p1Invoke = true;
      req.body.EventKey.should.equal('EVENTKEY');
      res.text('click');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      p1Invoke.should.equal(false);
    });

    helper.doneWapper(p2, done);
  });  

  // 点击菜单事件
  it('click without crypter', function(done){
    helper = new Helper({config: {}});
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[CLICK]]></Event><EventKey><![CDATA[EVENTKEY]]></EventKey>';

    var p1Invoke = false;
    var p1 = helper.trapWrapper('click', 'EVENTKEY', function(req, res){
      p1Invoke = true;
      req.body.EventKey.should.equal('EVENTKEY');
      res.text('click');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      p1Invoke.should.equal(false);
    });

    helper.doneWapper(p2, done);
  });   

  // 点击菜单事件
  it('click populate_user=true', function(done){
    helper = new Helper({populate_user: true});
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[CLICK]]></Event><EventKey><![CDATA[EVENTKEY]]></EventKey>';

    var p1 = helper.trapWrapper('click', 'EVENTKEY', function(req, res){
      req.body.EventKey.should.equal('EVENTKEY');
      res.text('click');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      console.log(err, ret);
    });

    helper.doneWapper(p1, p2, done);
  });    

});