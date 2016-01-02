var should = require('should');
var Helper = require('./helper');
var config = require('./config');

var openid = 'ovKXbsxcjA05QLUcShoQkAMfkECE';

var helper;
before(function(){
  helper = new Helper();
});

describe('Shakearoundusershake Message', function(){

  // 模板消息,未监听
  it('shake', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[TEMPLATESENDJOBFINISH]]></Event><MsgID>200163840</MsgID> <Status><![CDATA[failed: system failed]]></Status>';

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      console.log(err, ret);
      ret.should.equal('');
    });

    helper.doneWapper(p2, done);
  }); 


  // 模板消息
  it('shake', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[TEMPLATESENDJOBFINISH]]></Event><MsgID>200163840</MsgID> <Status><![CDATA[failed: system failed]]></Status>';

    var p1 = helper.trapWrapper('template', function(req, res){
      req.body.MsgID.should.equal('200163840');
      res.text('templatesendjobfinish');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('templatesendjobfinish');
    });

    helper.doneWapper(p1, p2, done);
  });    

});