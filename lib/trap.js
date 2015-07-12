/**!
  * weixin
  * Copyright(c) 2015-2015 leaf
  * MIT Licensed
  */

/**
  * 对微信推送消息，时间的处理
  * 借鉴于 wx 开源库
  * 能进行多账号的托管
  */


'use strict';

var express = require('express');
var crypto = require('crypto');
var getBody = require('raw-body');
var xml2js = require('xml2js');
var _ = require('underscore');
var async = require('async');
var WXBizMsgCrypt = require('wechat-crypto');
var debug = require('debug')('weixin');

var Trap = module.exports = function(){
  var router = express.Router();
  var self = this;
  var text_handlers = [], click_handlers = {}, regex_media_id = /^[\w\_\-]{64}$/,
      __slice = [].slice, attrNameProcessors,
      wechat_id, msg_type, event, openid, encrypt;
  var parserOptions = {
    async: true,
    explicitArray: true,
    normalize: true,
    trim: true
  };

  /**
    * 默认消息处理函数
    */
  if(typeof this.trapHandle !== 'function'){
    throw new Error({message: 'trapHandle should be a function'});
  }

  /**
    * 定义对 微信事件消息数据的 KEY 的转换函数
    */
  if(typeof this.attrNameProcessors === 'function'){
    attrNameProcessors = this.attrNameProcessors;
  }else {
    attrNameProcessors = this.weixin.util.formatStr(this.attrNameProcessors);
    if(!attrNameProcessors){
      console.warn('formatStr should be `keep`  `lowerCase`  `underscored` or a function but got a ' + this.formatStr);
      console.warn('change formatStr to `keep`');
      attrNameProcessors = this.weixin.util.formatStr('keep');
    }
  }

  /**
    * 获取到 ToUserName MsgType Event FromUserName对应的字符串，下文要用
    */
    wechat_id = attrNameProcessors('ToUserName');
    msg_type = attrNameProcessors('MsgType');
    event = attrNameProcessors('Event');
    openid = attrNameProcessors('FromUserName');
    encrypt = attrNameProcessors('Encrypt');

  /**
    * 对微信事件消息数据的 KEY 的转换
    */
  var _format = function(data){   
    if(data){
      _.each(data, function(value, p){
        var prot = p;
        if(_.isString(prot)) prot = attrNameProcessors(prot);
        if(prot !== p){
          data[prot] = value;
          delete data[p];
        }
        if(_.isArray(value) || _.isObject(value)) {
          if(_.isArray(value) && value.length === 1){
            data[prot] = value[0];
          }
          _format(data[prot]);
        }
      });
    }
  };

  /**
    * 微信各种事件的消息回复函数
    */
  var reply = function(req) {
    var message, data = req.body, query = req.query;
    // 组装message xml
    if (req.crypter) {
      message = function(message) { // 需要加密
        var encrypt = req.crypter.encrypt('<xml><ToUserName><![CDATA[' + data[openid] + ']]></ToUserName><FromUserName><![CDATA[' + data[wechat_id] + ']]></FromUserName><CreateTime>' + (~~(Date.now() / 1000)) + '</CreateTime>' + message + '</xml>');
        var signature = req.crypter.getSignature(query.timestamp, query.nonce, encrypt);
        return '<xml><Encrypt><![CDATA[' + encrypt + ']]></Encrypt><MsgSignature><![CDATA[' + signature + ']]></MsgSignature><TimeStamp>' + query.timestamp + '</TimeStamp><Nonce><![CDATA[' + query.nonce + ']]></Nonce></xml>';
      };
    } else { // 不需要加密
      message = function(message) {
        return '<xml><ToUserName><![CDATA[' + data[openid] + ']]></ToUserName><FromUserName><![CDATA[' + data[wechat_id] + ']]></FromUserName><CreateTime>' + (~~(Date.now() / 1000)) + '</CreateTime>' + message + '</xml>';
      };
    }

    return {

      // 文本消息回复
      text: function(text) {
        return this.send(message('<MsgType><![CDATA[text]]></MsgType><Content><![CDATA[' + text + ']]></Content>'));
      },

      // 图片消息回复
      image: function(image) {
        var that = this;
        var send = function(image) {
          return that.send(message('<MsgType><![CDATA[image]]></MsgType><Image><MediaId><![CDATA[' + image + ']]></MediaId></Image>'));
        };
        if (typeof image === 'string' && image.match(regex_media_id)) { // image 微信素材id，则直接发送
          return send(image);
        } else { // image为文件路径地址，需要上传图片素材
          return self.weixin.api.uploadMedia(image, 'image', function(err, res) {
            if (image = res != null ? res.media_id : void 0) {
              return send(image);
            } else {
              debug(err || res);
              return that.status(500).end();
            }
          });
        }
      },

      // 音频回复
      voice: function(voice) {
        var that = this;
        var send = function(voice) {
          return that.send(message('<MsgType><![CDATA[voice]]></MsgType><Voice><MediaId><![CDATA[' + voice + ']]></MediaId></Voice>'));
        };
        if (voice.match(regex_media_id)) { // voice 微信素材id，则直接发送
          return send(voice);
        } else { // voice 为文件路径地址，需要上传音频素材
          return self.weixin.api.uploadMedia(voice, 'voice', function(err, res) {
            if (!(voice = res != null ? res.media_id : void 0)) {
              return that.status(500).end();
            }
            return send(voice);
          });
        }
      },

      // 视频回复
      video: function(video) {
        var that = this;
        var send = function(data) {
          var video = data.video, title = data.title, description = data.description;
          return that.send(message('<MsgType><![CDATA[video]]></MsgType><Video><MediaId><![CDATA[' + video + ']]></MediaId><Title><![CDATA[' + title + ']]></Title><Description><![CDATA[' + description + ']]></Description></Video>'));
        };
        if (video.video.match(regex_media_id)) { // video 微信素材id，则直接发送
          return send(video);
        } else { // video 为文件路径地址，需要上传视频素材
          return self.weixin.api.uploadMedia(video.video, 'video', function(err, res) {
            if (!(video.video = res != null ? res.media_id : void 0)) {
              return that.status(500).end();
            }
            return send(video);
          });
        }
      },

      // 音乐回复
      music: function(music) {
        var that = this;
        var send = function(data) {
          var title = data.title, description = data.description, music_url = data.music_url, hq_music_url = data.hq_music_url, thumb_media = data.thumb_media;
          return that.send(message('<MsgType><![CDATA[music]]></MsgType><Music><Title><![CDATA[' + title + ']]></Title><Description><![CDATA[' + description + ']]></Description><MusicUrl><![CDATA[' + music_url + ']]></MusicUrl><HQMusicUrl><![CDATA[' + hq_music_url + ']]></HQMusicUrl><ThumbMediaId><![CDATA[' + thumb_media + ']]></ThumbMediaId></Music>'));
        };
        if (music.thumb_media.match(regex_media_id)) { // music 微信素材id，则直接发送
          return send(music);
        } else { // music 为文件路径地址，需要上传音频素材
          return self.weixin.api.uploadMedia(music.thumb_media, 'thumb', function(err, res) {
            if (!(music.thumb_media = res != null ? res.thumb_media_id : void 0)) {
              return that.status(500).end();
            }
            return send(music);
          });
        }
      },

      // 图文消息
      news: function(articles) {
        articles = [].concat(articles).map(function(a) {
          var title = a.title || '', description = a.description || '', pic_url = a.pic_url || '', url = a.url || '';
          return '<item><Title><![CDATA[' + title + ']]></Title><Description><![CDATA[' + description + ']]></Description><PicUrl><![CDATA[' + pic_url + ']]></PicUrl><Url><![CDATA[' + url + ']]></Url></item>';
        });
        return this.send(message('<MsgType><![CDATA[news]]></MsgType><ArticleCount>' + articles.length + '</ArticleCount><Articles>' + (articles.join('')) + '</Articles>'));
      },

      // 客服
      transfer: function() {
        return this.send(message('<MsgType><![CDATA[transfer_customer_service]]></MsgType>'));
      },

      // 设备消息回复
      device: function(content) {
        content = (new Buffer(content)).toString('base64');
        return this.send(message('<MsgType><![CDATA[device_text]]></MsgType><DeviceType><![CDATA[' + data[attrNameProcessors('DeviceType')] + ']]></DeviceType><DeviceID><![CDATA[' + data[attrNameProcessors('DeviceID')] + ']]></DeviceID><SessionID>' + data[attrNameProcessors('SessionID')] + '</SessionID><Content><![CDATA[' + content + ']]></Content>'));
      },

      // 回复空消息，表示收到请求
      ok: function() {
        return this.status(200).end();
      }
    };
  };


  /**
    * 获取 req 里面的数据
    */
  var getReqBody = function(req, callback){
    if(!self.getBody) return callback();
    getBody(req, {
      limit: '100kb',
      length: req.headers['content-length'],
      encoding: 'utf8'
    }, function (err, buf) {
      if(err) return callback(err);
      req.rawBuf = buf;
      req.body = buf;
      callback();
    });
  };

  /**
    * 解析 xml 数据
    * 数据必须在 req.body 里面
    */

  var parseXml = function(req, callback){
    if(!self.parseXml) return callback();

    if(!req.body || typeof req.body !== 'string') {
      debug('xml data invalid:  ', req.body);
      return callback();
    }

    xml2js.parseString(req.body, parserOptions, function(err, xml) {
      if (err) return callback(err);
      _format(xml.xml);
      req.body = xml.xml;
      callback();
    });
  };

  /**
    * 获取公众号的配置数据
    * 如果数据加密则生成解密器
    */
  var getConfigAndCrypter = function(req, callback){
    var id = req.body ? req.body[wechat_id] : '';
    if(!id) return callback();
    self.weixin.util.getConfig(id, function(err, config){
      if(err) return callback(err);
      config = config || {};
      req.config = config;        
      if (req.query.encrypt_type === 'aes' && config.token && config.encryptkey && config.appid) {
        req.crypter = new WXBizMsgCrypt(config.token, config.encryptkey, config.appid);
      }
      callback();
    });
  };

  /**
    * 解密 xml 数据
    */
  var decrypt = function(req, callback){

    if(!self.decrypt) return callback();

    if(req.query.encrypt_type !== 'aes'){
      debug('Not need decrypt');
      return callback();
    }

    if(!req.body[encrypt]){
      debug('No encrypt data');
      return callback();
    }

    if(!req.crypter) {
      debug('Not found crypter');
      return callback();
    }

    var encryptData = req.body[encrypt];
    var message = req.crypter.decrypt(encryptData).message;
    xml2js.parseString(message, parserOptions, function(err, ret){
      if(err) return callback(err);
      _format(ret.xml);
      req.body = ret.xml;
      callback();
    });
  };

  /**
    * 
    * 微信托管 url 路由的中间件
    * 检测消息是否合法（需要 to_user_name 微信号id 来获取配置信息）
    * 在配置微信路由规则时的校验，没有传 to_user_name 参数，这里不做校验，但其他请求都要校验
    *
    */
  router.use('/', function(req, res, next) {

    async.waterfall([
      function _getReqBody(callback){
        getReqBody(req, callback);
      },
      function _parseXml(callback){
        parseXml(req, callback);
      },
      function _getConfigAndCrypter(callback){
        getConfigAndCrypter(req, callback);
      },
      function _decrypt(callback){
        decrypt(req, callback);
      }
    ], function(err){
      if(err){
        debug(err);
        return next(err);
      }
      var query = req.query;
      var id = req.body ? req.body[wechat_id] : '';
      if(req.config){ // 有微信号配置数据时需要校验数据签名
        var token = req.config.token;
        if(!token) {
          req.weixin_signature_failure = true;
          return next();
        }
        var message = [token, query.timestamp, query.nonce].sort().join('');
        if (query.signature === crypto.createHash('sha1').update(message).digest('hex')) {
          return next();
        }else {
          req.weixin_signature_failure = true;
          return next();
        }
      }else if(req.method === 'POST'){
        req.weixin_signature_failure = true;
        return next();
      }else { // 没有微信号id是直接通过
        return next();
      }
    });
  });

  /**
    * 配置微信 url 规则时微信发的确认请求
    */
  router.get('/', function(req, res) {
    // 数据签名错误
    if(req.weixin_signature_failure){
      return res.status(400).send('data invalid');
    }    
    return res.send(req.query.echostr);
  });

  /**
    * 微信的消息推送请求入口
    */
  router.post('/', function(req, res, next) {
    // 数据签名错误
    if(req.weixin_signature_failure){
      return res.status(400).send('data invalid');
    }

    var process_message = function(user) {

      // 异常处理
      if(!req.body || !req.body[msg_type]) {
        return res.status(500).end();
      }

      var handlers, _msg_type;
      // 把微信用户信息放在 req.user 中
      _.extend(req.user != null ? req.user : req.user = {}, user);
      // res 帮上微信的消息回复函数
      _.extend(res, reply(req));

      // 各种消息的分类处理
      switch (_msg_type = req.body[msg_type].toLowerCase()) {

        // 文本消息
        case 'text':
          return async.eachSeries(text_handlers, function(_arg1, callback) {
            var match, pattern = _arg1[0], handlers = _arg1[1];
            if (match = req.body[attrNameProcessors('Content')].trim().match(pattern)) {
              _(req.params).extend(match);
              return async.eachSeries(handlers, function(handler, callback) {
                return handler(req, res, callback);
              }, callback);
            } else {
              return callback();
            }
          }, function(err) {
            if (err) debug(err);
            self.trapHandle(req, res);
          });

        // 图片，音频，视频，小视屏，地理位置，连接，设备消息的处理
        case 'image':
        case 'voice':
        case 'video':
        case 'shortvideo':
        case 'location':
        case 'link':
        case 'device_text':
          return async.eachSeries(self['' + _msg_type + '_handlers'] || [], function(handler, callback) {
            return handler(req, res, callback);
          }, function(err) {
            if (err) debug(err);
            self.trapHandle(req, res);
          });

        // 时间为 event 时的处理
        case 'event':
          switch (req.body[event].toLowerCase()) {

            // 关注
            case 'subscribe':
              return async.eachSeries(self.subscribe_handlers || [], function(handler, callback) {
                return handler(req, res, callback);
              }, function(err) {
                if (err) debug(err);
                self.trapHandle(req, res);
              });

            // 取消关注
            case 'unsubscribe':
              return async.eachSeries(self.unsubscribe_handlers || [], function(handler, callback) {
                return handler(req, res, callback);
              }, function(err) {
                if (err) debug(err);
                self.trapHandle(req, res);
              });

            // 扫描带参数二维码事件
            case 'scan':
              return async.eachSeries(self.scan_handlers || [], function(handler, callback) {
                return handler(req, res, callback);
              }, function(err) {
                if (err) debug(err);
                self.trapHandle(req, res);
              });

            // 上报地理位置
            case 'location':
              return async.eachSeries(self.reportedlocation_handlers || [], function(handler, callback) {
                return handler(req, res, callback);
              }, function(err) {
                if (err) debug(err);
                self.trapHandle(req, res);
              });

            // 菜单点击
            case 'click':
              if (handlers = click_handlers[req.body[attrNameProcessors('EventKey')]]) {
                return async.eachSeries(handlers, function(handler, callback) {
                  return handler(req, res, callback);
                }, function(err) {
                  if (err) debug(err);
                  self.trapHandle(req, res);
                });
              } else {
                self.trapHandle(req, res);
              }
              break;

            // 菜单页面跳转
            case 'view':
              return async.eachSeries(self.view_handlers || [], function(handler, callback) {
                return handler(req, res, callback);
              }, function(err) {
                if (err) debug(err);
                self.trapHandle(req, res);
              });

            // 模板消息
            case 'templatesendjobfinish':
              return async.eachSeries(this.templatesendjobfinish_handlers || [], function(handler, callback) {
                return handler(req, res, callback);
              }, function(err) {
                if (err) debug(err);
                self.trapHandle(req, res);
              });

            // 卡券 审核通过，审核未通过，用户领取卡券，用户删除卡券，核销卡券，进入会员卡，用户从卡券进入公众号会话
            case 'card_pass_check':
            case 'card_not_pass_check':
            case 'user_get_card':
            case 'user_del_card':
            case 'user_consume_card':
            case 'user_view_card':
            case 'user_enter_session_from_card':
              return async.eachSeries(self.card_handlers || [], function(handler, callback) {
                return handler(req, res, callback);
              }, function(err) {
                if (err) debug(err);
                self.trapHandle(req, res);
              });
            case 'shakearoundusershake':
              return async.eachSeries(self.shakearound_handlers || [], function(handler, callback) {
                return handler(req, res, callback);
              }, function(err) {
                if (err) debug(err);
                self.trapHandle(req, res);
              });              
            default:
              self.trapHandle(req, res);
          }
          break;
        default:
          self.trapHandle(req, res);
      }
    };

    // 根据配置 populate_user 参数确定是否需要扩展出用户信息，默认为false
    if (self.populate_user && ((req.body[event] != null ? req.body[event].toLowerCase() : void 0) !== 'unsubscribe')) {
      return self.api.getUser(req.body[wechat_id], req.body[openid], function(err, user) {
        if (err) debug(err);
        return process_message(user);
      });
    } else {
      return process_message();
    }
  });

  /**
    *
    * 注册各种消息的处理函数接口入口
    * 
    */
  return _.extend(router, {
    text: function() {
      var handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      var pattern = _.first(handlers);
      if (_.isRegExp(pattern)) {
        pattern = handlers.shift();
      } else if (_.isFunction(pattern)) {
        pattern = /.*/;
      } else if (_.isString(pattern)) {
        pattern = new RegExp(handlers.shift(), 'i');
      }
      text_handlers = _.filter(text_handlers, function(_arg1) {
        var pattern_exist;
        pattern_exist = _arg1[0];
        return pattern.toString() !== pattern_exist.toString();
      });
      text_handlers.push([pattern, handlers]);
      return self;
    },
    image: function() {
      self.image_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    voice: function() {
      self.voice_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    video: function() {
      self.video_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    shortvideo: function() {
      self.shortvideo_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    location: function() {
      self.location_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    link: function() {
      self.link_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    device: function() {
      self.device_text_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    subscribe: function() {
      self.subscribe_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    unsubscribe: function() {
      self.unsubscribe_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    scan: function() {
      self.scan_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    reportedlocation: function(){
      self.reportedlocation_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    card: function() {
      self.card_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    templatesendjobfinish: function() {
      self.templatesendjobfinish_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    },
    click: function() {
      var key = arguments[0];
      var handlers = ((2 <= arguments.length) ? __slice.call(arguments, 1) : []);
      click_handlers[key] = handlers;
      return self;
    },
    view: function() {
      self.view_handlers = ((1 <= arguments.length) ? __slice.call(arguments, 0) : []);
      return self;
    },
    shakearound: function() {
      self.shakearound_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return self;
    }
  });

};
