var should = require('should');
var Helper = require('./helper');
var config = require('./config');

var openid = 'ovKXbsxcjA05QLUcShoQkAMfkECE';

describe('attrNameProcessors', function(){
  context('with function', function(){
    it('success', function(done){
      var helper = new Helper({attrNameProcessors: function(attr){ return 'attr-test-' + attr;} });

      var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[ShakearoundUserShake]]></Event><ChosenBeacon><Uuid><![CDATA[121212121212]]></Uuid><Major>1111</Major><Minor>1111</Minor><Distance>0.057</Distance></ChosenBeacon><AroundBeacons><AroundBeacon><Uuid><![CDATA[121212121212]]></Uuid><Major>2222</Major><Minor>2222</Minor><Distance>166.816</Distance></AroundBeacon><AroundBeacon><Uuid><![CDATA[121212121212]]></Uuid><Major>3333</Major><Minor>3333</Minor><Distance>15.013</Distance></AroundBeacon></AroundBeacons>';

      var p1 = helper.trapWrapper('shakeAround', function(req, res){
        req.body['attr-test-ChosenBeacon']['attr-test-Uuid'].should.equal('121212121212');
        res.text('shakearoundusershake');
      });

      var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
        should.not.exist(err);
        ret.content.should.equal('shakearoundusershake');
      });

      helper.doneWapper(p1, p2, done);

    });
  });

  context('underscored', function(){
    it('success', function(done){
      var helper = new Helper({attrNameProcessors: 'underscored' });

      var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[ShakearoundUserShake]]></Event><ChosenBeacon><Uuid><![CDATA[121212121212]]></Uuid><Major>1111</Major><Minor>1111</Minor><Distance>0.057</Distance></ChosenBeacon><AroundBeacons><AroundBeacon><Uuid><![CDATA[121212121212]]></Uuid><Major>2222</Major><Minor>2222</Minor><Distance>166.816</Distance></AroundBeacon><AroundBeacon><Uuid><![CDATA[121212121212]]></Uuid><Major>3333</Major><Minor>3333</Minor><Distance>15.013</Distance></AroundBeacon></AroundBeacons>';

      var p1 = helper.trapWrapper('shakeAround', function(req, res){
        req.body['chosen_beacon']['uuid'].should.equal('121212121212');
        res.text('shakearoundusershake');
      });

      var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
        should.not.exist(err);
        ret.content.should.equal('shakearoundusershake');
      });

      helper.doneWapper(p1, p2, done);

    });
  });

  context('invalid', function(){
    it('success', function(done){
      var helper = new Helper({attrNameProcessors: 'underscored11' });

      var msg = '<MsgType><![CDATA[event]]></MsgType><Event><![CDATA[ShakearoundUserShake]]></Event><ChosenBeacon><Uuid><![CDATA[121212121212]]></Uuid><Major>1111</Major><Minor>1111</Minor><Distance>0.057</Distance></ChosenBeacon><AroundBeacons><AroundBeacon><Uuid><![CDATA[121212121212]]></Uuid><Major>2222</Major><Minor>2222</Minor><Distance>166.816</Distance></AroundBeacon><AroundBeacon><Uuid><![CDATA[121212121212]]></Uuid><Major>3333</Major><Minor>3333</Minor><Distance>15.013</Distance></AroundBeacon></AroundBeacons>';

      var p1 = helper.trapWrapper('shakeAround', function(req, res){
        req.body.ChosenBeacon.Uuid.should.equal('121212121212');
        res.text('shakearoundusershake');
      });

      var p2 = helper.requestWrapper('post', config[0], openid, msg, true, function(err, ret){
        should.not.exist(err);
        ret.content.should.equal('shakearoundusershake');
      });

      helper.doneWapper(p1, p2, done);

    });
  });

});
