/**!
  * weixin
  * Copyright(c) 2015-2015 leaf
  * MIT Licensed
  */

/**
  * 公众号的 api 部分
  * 使用了开源模块 wechat-api
  * 并重写了其中一部分代码
  * 对所有 api 进行了包装，使能够满足多账号托管的需求
  */

'use strict';
var WechatAPI = require('wechat-api');
var _ = require('underscore');
var debug = require('debug')('weixin');
var util = require('wechat-api/lib/util');
var wrapper = util.wrapper;
var postJSON = util.postJSON;

/*!
 * 需要access token的接口调用如果采用preRequest进行封装后，就可以直接调用。
 * 无需依赖getAccessToken为前置调用。
 * 应用开发者无需直接调用此API。
 *
 * Examples:
 * ```
 * api.preRequest(method, arguments);
 * ```
 * @param {Function} method 需要封装的方法
 * @param {Array} args 方法需要的参数
 * 这里不校验 token 是否过期
 */
WechatAPI.prototype.preRequest = function (method, args, retryed) {
  var that = this;
  var callback = args[args.length - 1];
  // 调用用户传入的获取token的异步方法，获得token之后使用（并缓存它）。

  if(typeof callback !== 'function') callback = function(){};
  that.getToken(function (err, token) {
    if (err) {
      return callback(err);
    }

    // 有token并且token有效直接调用
    if (token) {
      // 暂时保存token
      that.token = token;
      if (!retryed) {
        var retryHandle = function (err, data, res) {
          // 40001 重试
          if (data && data.errcode && (data.errcode === 40001 ||
          data.errcode === 40014 || data.errcode === 42001)) {
            return that.getAccessToken(function (err) {
              if (err) {
                return callback(err);
              }
              return that.preRequest(method, args, true);
            });
          }
          callback(err, data, res);
        };
        // 替换callback
        var newargs = Array.prototype.slice.call(args, 0, -1);
        newargs.push(retryHandle);
        method.apply(that, newargs);
      } else {
        method.apply(that, args);
      }
    } else {
      // 使用appid/appsecret获取token
      that.getAccessToken(function (err, token) {
        // 如遇错误，通过回调函数传出
        if (err) {
          return callback(err);
        }
        // 暂时保存token
        that.token = token;
        method.apply(that, args);
      });
    }
  });
};

/**
  * 重写了 getAccessToken 接口
  * 源代码对返回的 token 做了处理
  * 此处不作处理直接传给 saveToken 函数
  */
WechatAPI.prototype.getAccessToken = function (callback) {
  var that = this;
  var url = this.endpoint + '/cgi-bin/token?grant_type=client_credential&appid=' + this.appid + '&secret=' + this.appsecret;
  this.request(url, {dataType: 'json'}, wrapper(function (err, data) {
    if (err) {
      return callback(err);
    }
    var token = {accessToken: data.access_token, expireTime: data.expires_in};
    that.saveToken(token, function (err) {
      if (err) {
        return callback(err);
      }
      callback(err, token);
    });
  }));
  return this;
};

/**
 * Overwrite
 * 获取最新的token
 *
 * Examples:
 * ```
 * api.getLatestToken(callback);
 * ```
 * Callback:
 *
 * - `err`, 获取access token出现异常时的异常对象
 * - `token`, 获取的token
 *
 * @param {Function} method 需要封装的方法
 * @param {Array} args 方法需要的参数
 */
WechatAPI.prototype.getLatestToken = function (callback) {
  var that = this;
  // 调用用户传入的获取token的异步方法，获得token之后使用（并缓存它）。
  that.getToken(function (err, token) {
    if (err) {
      return callback(err);
    }
    // 有token并且token有效直接调用
    if (token) {
      callback(null, token);
    } else {
      // 使用appid/appsecret获取token
      that.getAccessToken(callback);
    }
  });
};

/**
  * 重写获取ticket函数
  * 在调用存储 ticket 的方法时加上 appid 参数
  */
WechatAPI.prototype._getTicket = function (type, callback) {
  if (typeof type === 'function') {
    callback = type;
    type = 'jsapi';
  }
  var that = this;
  var url = this.endpoint + '/cgi-bin/ticket/getticket?access_token=' + this.token.accessToken + '&type=' + type;
  this.request(url, {dataType: 'json'}, wrapper(function(err, data) {
    if (err) {
      return callback(err, data);
    }
    if (!data) {
      return callback({message: 'Not get ticket'});
    }
    var ticket = {ticket: data.ticket, expireTime: data.expires_in};
    that.saveTicketToken(that.appid, type, ticket, function (err) {
      if (err) {
        return callback(err);
      }
      callback(err, ticket);
    });
  }));
};


WechatAPI.mixin(require('./api/oauth'));

var api = module.exports = new WechatAPI();

/**
  * 返回 api 执行需要的执行环境 context
  */
api.contextWrapper = function(config) {
  var context = function(){};

  _.extend(context.__proto__, this.__proto__);
  _.extend(context, this);

  if (_.isObject(config) && !_.isArray(config)) {
    _.extend(context, config);
  }

  return context;
};

/**
  * wechat-api 接口包装，支持多系统处理多个公众号的 API 调用情况
  */
var apiWrapper = function(fn) {
  return function(){
    var args = [].slice.call(arguments, 0), id = args[0], config, argLen = args.length, fnLen = fn.length;
    var callback = _.last(args);
    var that = this;
    if (typeof id === 'string' && !httpReg.test(id)) {
      this.weixin.util.getConfig(id, function(err, config) {
        if(config){
          debug('get config by id:  ' + id);
          args.shift();
        }else if(argLen > fnLen){
          debug('Not found config by id:  ' + id);
          args.shift();
          return callback({message: 'No permission'});
        }
        var context = that.contextWrapper(config);
        fn.apply(context, args);
      });
    } else {
      var context = that.contextWrapper();
      fn.apply(context, args);
    }
  };
};

/**
  * 对 wechat-api 所有接口进行的包装
  * 调用 api 方法的第一个参数必须是公众号的 id
  * 通过公众号id获取到该公众号的相关配置
  * 然后再调用 wechat-api 的方法
  */
var httpReg = /http(s)?\/\//;
_.each(WechatAPI.prototype, function(fn, n) {
  if (n.indexOf('_') === 0) return;
  api[n] = apiWrapper(fn);
});

api.wrapper = wrapper;
api.postJSON = postJSON;
api.apiWrapper = apiWrapper;

/**
  * API 重写或扩展时可以使用此方法
  *
  * Example:
  * weixinTrap.api.make(weixinTrap.api, 'test', function(arg1, arg2, callback){
  *   var url = 'https://api.weixin.qq.com/card/location/batchadd?access_token=' + this.token.accessToken;
  *   var data = {};
  *   this.request(url, this.postJSON(data), this.wrapper(callback));
  * })
  */
api.make = function(host, name, fn) {
  host[name] = apiWrapper(function () {
    this.preRequest(this['_' + name], arguments);
  });
  host['_' + name] = fn;
};


