var should = require('should');
var Helper = require('./helper');
var config = require('./config');

var openid = 'ovKXbsxcjA05QLUcShoQkAMfkECE';

describe('trapHandle', function(){
  context('not a function', function(){
    it('throw error', function(){
      (function(){
        new Helper({trapHandle: 'aaa'});
      }).should.throw();
    });
  });
});
