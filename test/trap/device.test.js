var should = require('should');
var Helper = require('./helper');
var config = require('./config');

var openid = 'ovKXbsxcjA05QLUcShoQkAMfkECE';

var helper;
before(function(){
  helper = new Helper();
});

describe('Device Message', function(){

  // 设备消息
  it('text', function(done){
    var msg = '<MsgType><![CDATA[device_text]]></MsgType><DeviceType><![CDATA[' + config[0].id + ']]></DeviceType><DeviceID><![CDATA[123456]]></DeviceID><SessionID>001122334455</SessionID><Content><![CDATA[device_text_test]]></Content>';

    var p1 = helper.trapWrapper('device', function(req, res){
      req.body.DeviceType.should.equal(config[0].id);
      req.body.DeviceID.should.equal('123456');
      req.body.Content.should.equal('device_text_test');
      res.should.have.property('device');
      res.device('reply device text');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('cmVwbHkgZGV2aWNlIHRleHQ='); // ‘reply device text’ base64 编码后的内容
    });

    helper.doneWapper(p1, p2, done);
  });  

});