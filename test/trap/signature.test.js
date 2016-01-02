var should = require('should');
var config = require('./config');
var Helper = require('./helper');



describe('Signature', function(){

  it('verify', function(done){
    var helper = new Helper();
    var p = helper.requestWrapper('get', config[0].token, 'echostr', function(err, ret){
      should.not.exist(err);
      ret.should.equal('echostr');
    });
    helper.doneWapper(p, done);
  });

  it('without token', function(done){
    var helper = new Helper();
    var p = helper.requestWrapper('get', '', 'echostr', function(err, ret){
      should.not.exist(err);
      ret.should.equal('echostr');
    });
    helper.doneWapper(p, done);
  });  

});
