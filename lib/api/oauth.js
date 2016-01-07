/**!
  * weixin
  * Copyright(c) 2015-2015 leaf
  * MIT Licensed
  */

/**
  * oauth 授权部分
  */

'use strict';
var util = require('wechat-api/lib/util');
var wrapper = util.wrapper;
var postJSON = util.postJSON;
var make = util.make;

/**
  * 通过 code 获取网页授权的 accessToken
  */
make(exports, 'getOauthAccessToken', function(code, callback){
  var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + this.appid + '&secret=' + this.appsecret + '&code=' + code + '&grant_type=authorization_code';
  var that = this;
  this.request(url, {dataType: 'json'}, wrapper(function(err, data){
    if (err) {
      return callback(err);
    }
    var token = {
      accessToken: data.access_token,
      expireTime: data.expires_in,
      refreshToken: data.refresh_token,
      openid: data.openid,
      scope: data.scope,
      unionid: data.unionid
    };
    that.saveOauthToken(that.appid, token, function (err) {
      if (err) {
        return callback(err);
      }
      callback(err, token);
    });
  }));
});

/**
  * 通过 refreshToken 重新获取 accessToken
  */
make(exports, 'refreshOauthAccessToken', function(refresh_token, callback){
  var url = 'https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=' + this.appid + '&grant_type=refresh_token&refresh_token=' + refresh_token;
  var that = this;
  this.request(url, {dataType: 'json'}, wrapper(function(err, data){
    if (err) {
      return callback(err);
    }
    var token = {
      accessToken: data.access_token,
      expireTime: data.expires_in,
      refreshToken: data.refresh_token,
      openid: data.openid,
      scope: data.scope
    };
    that.saveOauthToken(that.appid, token, function (err) {
      if (err) {
        return callback(err);
      }
      callback(err, token);
    });
  }));
});

/**
  * 通过网页收取后获取到的accessToken 去获取用户信息
  */
make(exports, 'getSnsUserinfo', function(openid, callback){
  var that = this;
  this.getOauthToken(wrapper(function(err, oauthToken){
    if(err) return callback(err);
    if(!oauthToken) return callback({message: 'Get error'});
    var url = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + oauthToken.accessToken + '&openid=' + openid + '&lang=zh_CN';
    that.request(url, {dataType: 'json'}, wrapper(callback));
  }));
});
