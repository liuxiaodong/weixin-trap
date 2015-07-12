var should = require('should');
var Helper = require('./helper');
var config = require('./config');

var openid = 'ovKXbsxcjA05QLUcShoQkAMfkECE';

var helper;
beforeEach(function(){
  helper = new Helper();
});

describe('Card Message', function(){

  // 卡券审核同通过
  it('card_pass_check', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[card_pass_check]]></Event><CardId><![CDATA[123456789]]></CardId>';

    var p1 = helper.trapWrapper('card', function(req, res){
      req.body.CardId.should.equal('123456789');
      res.text('card_pass_check success');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('card_pass_check success');
    });
    helper.doneWapper(p1, p2, done);
  });
  
  // 审核未通过
  it('card_not_pass_check', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[card_not_pass_check]]></Event><CardId><![CDATA[123456789]]></CardId>';

    var p1 = helper.trapWrapper('card', function(req, res){
      req.body.CardId.should.equal('123456789');
      res.text('card_not_pass_check');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('card_not_pass_check');
    });
    helper.doneWapper(p1, p2, done);
  });

  // 用户领取卡券
  it('user_get_card', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[user_get_card]]></Event><CardId><![CDATA[123456789]]></CardId><IsGiveByFriend>1</IsGiveByFriend><UserCardCode><![CDATA[12312312]]></UserCardCode><OuterId>0</OuterId>';

    var p1 = helper.trapWrapper('card', function(req, res){
      req.body.CardId.should.equal('123456789');
      req.body.UserCardCode.should.equal('12312312');
      res.text('user_get_card');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('user_get_card');
    });
    helper.doneWapper(p1, p2, done);
  });  

  // 删除卡券
  it('user_del_card', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[user_del_card]]></Event><CardId><![CDATA[123456789]]></CardId><UserCardCode><![CDATA[12312312]]></UserCardCode>';

    var p1 = helper.trapWrapper('card', function(req, res){
      req.body.CardId.should.equal('123456789');
      req.body.UserCardCode.should.equal('12312312');
      res.text('user_del_card');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('user_del_card');
    });
    helper.doneWapper(p1, p2, done);
  });

  // 用户核销卡券
  it('user_consume_card', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[user_consume_card]]></Event><CardId><![CDATA[123456789]]></CardId><UserCardCode><![CDATA[12312312]]></UserCardCode><ConsumeSource><![CDATA[FROM_API]]></ConsumeSource>';

    var p1 = helper.trapWrapper('card', function(req, res){
      req.body.CardId.should.equal('123456789');
      req.body.UserCardCode.should.equal('12312312');
      req.body.ConsumeSource.should.equal('FROM_API');
      res.text('user_consume_card');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('user_consume_card');
    });
    helper.doneWapper(p1, p2, done);
  });

  // 进入会员卡事件推送
  it('user_view_card', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[user_view_card]]></Event><CardId><![CDATA[123456789]]></CardId><UserCardCode><![CDATA[12312312]]></UserCardCode>';

    var p1 = helper.trapWrapper('card', function(req, res){
      req.body.CardId.should.equal('123456789');
      req.body.UserCardCode.should.equal('12312312');
      res.text('user_view_card');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('user_view_card');
    });
    helper.doneWapper(p1, p2, done);
  });

  // 从卡券进入公众号会话事件推送
  it('user_enter_session_from_card', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[user_enter_session_from_card]]></Event><CardId><![CDATA[123456789]]></CardId><UserCardCode><![CDATA[12312312]]></UserCardCode>';

    var p1 = helper.trapWrapper('card', function(req, res){
      req.body.CardId.should.equal('123456789');
      req.body.UserCardCode.should.equal('12312312');
      res.text('user_enter_session_from_card');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('user_enter_session_from_card');
    });
    helper.doneWapper(p1, p2, done);
  });   

});