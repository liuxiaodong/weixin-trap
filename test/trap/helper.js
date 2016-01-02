var Q = require('q');
var _ = require('underscore');
var config =require('./config');
var util = require('../../lib/util');
var Weixin = require('../../');
var Request = require('./request');

var __slice = [].slice;
var Helper = module.exports = function(options){
  var defaultOptions = {
    getBody: true,
    parseXml: true,
    decrypt: true,
    attrNameProcessors: 'keep',
    populate_user: false,
    trapHandle: util.trapHandle,
    config: config
  };
  options = options || {};
  _.extend(defaultOptions, options);
  var app = require('express')();

  this.request = new Request(app);  
  var weixin = new Weixin(defaultOptions);
  this.trap = weixin.trap;
  this.weixin = weixin;
  app.use('/wechat', this.trap);
};

Helper.prototype.trapWrapper = function(fname, arg1, cb){
  if(typeof arg1 === 'function' && typeof cb !== 'function'){
    cb = arg1;
    arg1 = undefined;
  }
  var deferred = Q.defer();
  var callbackWrapper = function(){
    try{
      cb.apply({}, arguments);
    }catch(e){
      return deferred.reject(e);
    }
    return deferred.resolve();
  };

  if(arg1){
    if (arguments.length === 3) {
      this.trap[fname](arg1, callbackWrapper);
    } else {
      var handlers = _.map(__slice.call(arguments, 2), function(f){ 
        return function(){
          try{
            this.f.apply({}, arguments);
          }catch(e){
            return deferred.reject(e);
          }
          return deferred.resolve();
        }.bind({f: f});
      });
      handlers.unshift(arg1);
      this.trap[fname].apply(this, handlers);
    }
  }else {
    this.trap[fname](callbackWrapper);
  }
  return deferred.promise;
};

Helper.prototype.requestWrapper = function(){
  var deferred = Q.defer();
  var args = __slice.call(arguments);
  var method = args.shift();
  var cb = args.pop();

  var callbackWrapper = function(){
    try{
      cb.apply({}, arguments);
    }catch(e){
      return deferred.reject(e);
    }
    return deferred.resolve();
  };

  args.push(callbackWrapper);
  this.request[method].apply(this.request, args);
  return deferred.promise;
};

Helper.prototype.doneWapper = function(){
  var args = __slice.call(arguments);
  var done = args.pop();
  Q.all(args).then(function(){
    done();
  }, function(err){
    done(err);
  });  
};