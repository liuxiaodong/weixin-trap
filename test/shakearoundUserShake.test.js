var should = require('should');
var Helper = require('./helper');
var config = require('./config');

var openid = 'ovKXbsxcjA05QLUcShoQkAMfkECE';

var helper;
before(function(){
  helper = new Helper();
});

describe('Shakearoundusershake Message', function(){

  // 摇周边事件推送
  it('shake', function(done){
    var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[ShakearoundUserShake]]></Event><ChosenBeacon><Uuid><![CDATA[121212121212]]></Uuid><Major>1111</Major><Minor>1111</Minor><Distance>0.057</Distance></ChosenBeacon><AroundBeacons><AroundBeacon><Uuid><![CDATA[121212121212]]></Uuid><Major>2222</Major><Minor>2222</Minor><Distance>166.816</Distance></AroundBeacon><AroundBeacon><Uuid><![CDATA[121212121212]]></Uuid><Major>3333</Major><Minor>3333</Minor><Distance>15.013</Distance></AroundBeacon></AroundBeacons>';

    var p1 = helper.trapWrapper('shakearound', function(req, res){
      req.body.ChosenBeacon.Uuid.should.equal('121212121212');
      req.body.ChosenBeacon.Major.should.equal('1111');
      req.body.ChosenBeacon.Minor.should.equal('1111');
      req.body.ChosenBeacon.Distance.should.equal('0.057');
      req.body.AroundBeacons.AroundBeacon.should.have.lengthOf(2);
      res.text('shakearoundusershake');
    });

    var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
      should.not.exist(err);
      ret.content.should.equal('shakearoundusershake');
    });

    helper.doneWapper(p1, p2, done);
  });  

});