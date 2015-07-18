/**!
  * weixin 工具集
  */

var _ = require('underscore');
var crypto = require('crypto');
var debug = require('debug')('weixin');

'use strict';

/**
  *  对传入的微信配置数据做处理
  *  统一转换成 appid appsecret 这种形式，去除_ ，转为小写
  */
var parseConfig = function(config){
  return _.compact(_.map(config, function(c){
    var o = {};
    if(c){
      _.each(c, function(v, k){
        k = k.replace(/[-|_|\.]+/ig, '');
        k = k ? k.toLowerCase() : null;
        if(!k) {
          o = null;
        } else if(o){
          o[k] = v;
        }
      });
      return o;
    }else {
      return null;
    }
  }));
};

/*!
 * 生成随机字符串
 */
var createNonceStr = function () {
  return Math.random().toString(36).substr(2, 15);
};

/*!
 * 生成时间戳
 */
var createTimestamp = function () {
  return parseInt(new Date().getTime() / 1000, 0) + '';
};

/*!
 * 排序查询字符串
 */
var raw = function (args) {
  var keys = Object.keys(args);
  keys = keys.sort();
  var newArgs = {};
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key];
  });

  var string = '';
  for(var k in newArgs) {
    string += '&' + k + '=' + newArgs[k];
  }
  return string.substr(1);
};

var signCardExt = function(api_ticket, card_id, timestamp, nonceStr, code, openid) {
  var values = [api_ticket, card_id, timestamp, nonceStr, code || '',  openid || ''];
  values.sort();

  var string = values.join('');
  var shasum = crypto.createHash('sha1');
  shasum.update(string);
  return shasum.digest('hex');
};

/**
  * 存储微信的配置参数到内存
  * TODO 自定义 saveConfig
  */
exports.saveConfig = function(config){
  if(!config) return;
  if(!Array.isArray(config)){
    config = [config];
  }
  this.config = parseConfig(config);
};

/**
  * 设置微信的配置数据
  */
exports.setConfig = function(config){
  if(!this.config) this.config = [];  
  if(!config) return null;
  if(!Array.isArray(config)){
    config = [config];
  }
  _.each(parseConfig(config), function(c){
    if(!c.appid || !c.appsecret) {
      debug('losing appid or appsecret');
    }else {
      if(!_.find(this.config , function(c1){ return c1.appid === c.appid; })){
        this.config.push(c);
      }
    }
  }, this);
};

/**
  * 获取某公众号的配置
  * id 可以为 appid(type === 'appid') 也可以为 公众号ID (type === 'id')
  */
exports.getConfig = function(id, callback){
  if(typeof id !== 'string') callback();
  var c = _.find(this.config, function(c){ return c.id === id; });
  if(!c) c = _.find(this.config, function(c){ return c.appid === id; });
  callback(null, c);
};

/**
  * 存储 accessToken 的默认函数
  */
exports.saveToken = function(token, callback){
  if(!this.tokenStore) this.tokenStore = {};
  this.tokenStore[this.appid] = {
    accessToken: token.accessToken,
    expireTime: (new Date().getTime()) + (token.expireTime - 10) * 1000 // 过期时间，因网络延迟等，将实际过期时间提前10秒，以防止临界点
  };
  if (process.env.NODE_ENV === 'production') {
    debug('Dont save accessToken in memory, when cluster or multi-computer!');
  }
  if(typeof callback === 'function') callback(null, this.tokenStore[this.appid]);
  return this.tokenStore[this.appid];
};

/**
  * 获取 accessToken 的默认函数
  */
exports.getToken = function(callback){
  var token = this.tokenStore ? this.tokenStore[this.appid] : null;
  if(token){
    if((new Date().getTime()) < token.expireTime) {
      callback(null, token.accessToken);
    }else {
      this.getAccessToken(callback);
    }
  }else {
    this.getAccessToken(callback);
  }
};

/**
  * 存储微信 oauth2 授权后通过 code 获取到的信息
  * accessToken  接口凭证
  * expireTime  接口凭证过期时间
  * refreshToken  刷新接口凭证参数
  * openid  用户唯一标识，请注意，在未关注公众号时，用户访问公众号的网页，也会产生一个用户和公众号唯一的OpenID
  * scope  用户授权的作用域，使用逗号（,）分隔
  * unionid  只有在用户将公众号绑定到微信开放平台帐号后，才会出现该字段
  *
  */
exports.saveOauthToken = function(token, callback){
  if(!this.oauthTokenStore) this.oauthTokenStore = {};
  this.oauthTokenStore[this.appid] = {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    openid: token.openid,
    scope: token.scope,
    unionid: token.unionid,
    expireTime: (new Date().getTime()) + (token.expireTime - 10) * 1000 // 过期时间，因网络延迟等，将实际过期时间提前10秒，以防止临界点
  };
  if (process.env.NODE_ENV === 'production') {
    debug('Dont save oauth accessToken in memory, when cluster or multi-computer!');
  }
  if(typeof callback === 'function') callback(null, this.oauthTokenStore[this.appid]);
  return this.oauthTokenStore[this.appid];
};

/**
  * 获取微信 oauth2 授权后通过 code 获取到的信息
  */
exports.getOauthToken = function(callback){
  var token = this.oauthTokenStore ? this.oauthTokenStore[this.appid] : null;
  if(token){
    if((new Date().getTime()) < token.expireTime) {
      callback(null, token);
    }else {
      this.refreshOauthAccessToken(refreshToken, callback);
    }
  }else {
    this.refreshOauthAccessToken(refreshToken, callback);
  }
};

/**
  * 存储 ticket 函数
  */
exports.saveTicketToken = function(type, ticketToken, callback){
  if (typeof ticketToken === 'function') {
    callback = ticketToken;
    ticketToken = type;
    type = 'jsapi';
  }

  if(!this.ticketStore) this.ticketStore = {};
  if(!this.ticketStore[this.appid]) this.ticketStore[this.appid] = {};

  this.ticketStore[this.appid][type] = {
    ticket: ticketToken.ticket,
    expireTime: (new Date().getTime()) + (ticketToken.expireTime - 10) * 1000 // 过期时间，因网络延迟等，将实际过期时间提前10秒，以防止临界点
  };
  if (process.env.NODE_ENV === 'production') {
    debug('Dont save ticket in memory, when cluster or multi-computer!');
  }
  callback(null, this.ticketStore[this.appid][type]);
  return this.ticketStore[this.appid][type];
};

/**
  * 获取 ticket
  */
exports.getTicketToken = function(type, callback){
  if (typeof type === 'function') {
    callback = type;
    type = 'jsapi';
  }
  var ticketToken = (this.ticketToken && this.ticketStore[this.appid]) ? this.ticketStore[this.appid][type] : null;
  if(_.isEmpty(ticketToken)){
    if((new Date().getTime()) < ticketToken.expireTime){
      callback(null, ticketToken);
    }else {
      this.getTicket(type, callback);
    }
  }else {
    this.getTicket(type, callback);
  }
};

/**
  * jssdk 签名
  */
exports.getJsConfig = function(ticket, url){
  var ret = {
    jsapi_ticket: ticket,
    nonceStr: createNonceStr(),
    timestamp: createTimestamp(),
    url: url
  };
  var string = raw(ret);
  var shasum = crypto.createHash('sha1');
  shasum.update(string);
  ret.signature = shasum.digest('hex');
  delete ret.jsapi_ticket;
  return ret;
};

/**
  * 卡券签名
  */
exports.getCardExt = function(ticket, card_id, card_code, openid){
  var timestamp = createTimestamp();
  var nonceStr = createNonceStr();
  var signature = signCardExt(ticket, card_id, timestamp, nonceStr, card_code, openid);
  var result = {
    timestamp: timestamp,
    nonceStr: nonceStr,
    signature: signature,
    card_id: card_id
  };

  if(card_code) result.card_code = card_code;
  if(openid) result.openid = openid;
  return result;
};

/**
  * 微信事件的默认处理函数
  */
exports.trapHandle = function(req, res){
  res.ok();
};


/**
  * 字符串格式化
  * keep: 保持不变
  * lowerCase: 转为消息
  * underscored: 转为下划线形式
  */
var defaultFormatStr = {
  keep: function(str){
    return str.trim();
  },
  lowerCase: function(str){
    return str.trim().toLowerCase();
  },
  underscored: function(str){
    return str.trim().replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
  }
};
exports.formatStr = function(type){
  return defaultFormatStr[type];
};

/**
  * 错误包装
  */
exports.error = function(msg){
  var err = new Error(msg);
  err.name = 'WeixinError';
  err.code = '-2';
  return err;
};
