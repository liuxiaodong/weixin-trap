var should = require('should');
var config = require('./config');
var Helper = require('./helper');


var helper;
beforeEach(function(){
  helper = new Helper();
});

describe('Signature', function(){

  it('verify', function(done){
    var p = helper.requestWrapper('get', config[0].token, 'echostr', function(err, ret){
      //should.not.exist(err);
      //ret.should.equal('echostr');
    });
    helper.doneWapper(p, done);
  });

});