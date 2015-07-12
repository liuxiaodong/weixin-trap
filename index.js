/*!
 * weixin
 * Copyright(c) 2015-2015 leaf <liuxiaodong1989@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */
var api = require('./lib/api');
var _ = require('underscore');
var util = require('./lib/util');
var trap = require('./lib/trap');
var debug = require('debug')('weixin');

/**
  * 微信对外接口封装
  * api 微信 API 接口
  * util 工具集，一般用不上
  * trap 路由事件处理，对接微信的回调 url 处理微信推送到服务器的消息
  * options: {
  *   populate_user: false, # 是否扩展出用户信息，默认 false
  *   saveToken: Funtion, # 保存 accessToken 默认保存在内存（不推荐这样做） 
  *   getToken: Funtion, # 获取accessToken 的方法，若定义了 saveToken 则最好也同事定义 getToken 函数，不然默认方法可能获取不到对应的 accessToken
  *   config: Array # 微信相关配置数据 
  * }
  *
  * 微信相关配置数据
  * config: {
  *   id: '' # 公众号id
  *   appid: '' # 公众号的 app_id
  *   app_secret: '' # 公众号的 app_secret
  *   token: '' # 公众号配置的token
  *   encryptkey: '' # 公众号配置的加密秘钥 
  * }
  */
function Weixin(options){
  if (!(this instanceof Weixin)) {
    return new Weixin(options);
  }

  this.api = {__proto__: api, weixin: this};
  this.util = {__proto__: util, weixin: this};

  var defaultOptions = {
    getBody: true,
    parseXml: true,
    decrypt: true,
    attrNameProcessors: 'keep',
    populate_user: false,
    trapHandle: this.util.trapHandle
  };
  options = options || {};
  _.extend(defaultOptions, options);


  this.trap = trap.call({
    // 微信实例
    weixin: this,
    // 微信事件的默认是处理函数
    trapHandle: defaultOptions.trapHandle,
    // 是否需要从 req 中获取数据流
    getBody: defaultOptions.getBody,
    // 是否需要解析 xml
    parseXml: defaultOptions.parseXml,
    // 是否需要解密数据
    decrypt: defaultOptions.decrypt,
    // 微信数据格式化
    attrNameProcessors: defaultOptions.attrNameProcessors,
    // 微信推送时间过来是，如果带有 openid，是否扩展出用户信息
    populate_user: defaultOptions.populate_user
  });

  // accessToken 的管理默认用 util 中的函数
  this.api.saveToken = this.util.saveToken;
  this.api.getToken = this.util.getToken;

  // oauth2 授权后获取到的 accessToken 等信息的管理 的默认函数
  this.api.saveOauthToken = this.util.saveOauthToken;
  this.api.getOauthToken = this.util.getOauthToken;

  // ticket 的默认管理函数
  this.api.getTicketToken = this.util.getTicketToken;
  this.api.saveTicketToken = this.util.saveTicketToken;

  
  //this.trap.trapHandle = this.util.trapHandle;

  // 用户自定义 config 管理函数
  if(typeof defaultOptions.saveConfig === 'function') this.util.saveConfig = defaultOptions.saveConfig;
  if(typeof defaultOptions.getConfig === 'function') this.util.getConfig = defaultOptions.getConfig;    
  if(typeof defaultOptions.setConfig === 'function') this.util.setConfig = defaultOptions.setConfig;

  // 用户可以自定义 accessToken 管理的函数
  if(typeof defaultOptions.saveToken === 'function') this.api.saveToken = defaultOptions.saveToken;
  if(typeof defaultOptions.getToken === 'function') this.api.getToken = defaultOptions.getToken;    

  // 用户自定义 oauth2 授权的取得的 accessToken 等信息管理函数
  if(typeof defaultOptions.saveOauthToken === 'function') this.api.saveOauthToken = defaultOptions.saveOauthToken;
  if(typeof defaultOptions.getOauthToken === 'function') this.api.getOauthToken = defaultOptions.getOauthToken;    

  // 用户自定义 ticket 管理函数
  if(typeof defaultOptions.getTicketToken === 'function') this.api.getTicketToken = defaultOptions.getTicketToken;
  if(typeof defaultOptions.saveTicketToken === 'function') this.api.saveTicketToken = defaultOptions.saveTicketToken;    

  if(defaultOptions.config) this.util.saveConfig(defaultOptions.config);  
}

module.exports = Weixin;
