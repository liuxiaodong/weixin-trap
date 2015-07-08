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
var router = express.Router();
var crypto = require('crypto');
var getBody = require('raw-body');
var xml2js = require('xml2js');
var _s = require('underscore.string');
var _ = require('underscore');
var async = require('async');
var WXBizMsgCrypt = require('wechat-crypto');
var debug = require('debug')('weixin');

var trap = module.exports = function(){
  var self = this;
  var text_handlers = [], click_handlers = {}, regex_media_id = /^[\w\_\-]{64}$/, __slice = [].slice;
  var parserOptions = {
    async: true,
    explicitArray: true,
    normalize: true,
    trim: true
  };
  /**
    * 微信各种事件的消息回复函数
    */
  var reply = function(req) {
    var message, self = this, data = req.body, query = req.query;
    // 组装message xml
    if (req.crypter) {
      message = function(message) { // 需要加密
        var encrypt = req.crypter.encrypt('<xml><ToUserName><![CDATA[' + data.from_user_name + ']]></ToUserName><FromUserName><![CDATA[' + data.to_user_name + ']]></FromUserName><CreateTime>' + (~~(Date.now() / 1000)) + '</CreateTime>' + message + '</xml>');
        var signature = req.crypter.getSignature(query.timestamp, query.nonce, encrypt);
        return '<xml><Encrypt><![CDATA[' + encrypt + ']]></Encrypt><MsgSignature><![CDATA[' + signature + ']]></MsgSignature><TimeStamp>' + query.timestamp + '</TimeStamp><Nonce><![CDATA[' + query.nonce + ']]></Nonce></xml>';
      };
    } else { // 不需要加密
      message = function(message) {
        return '<xml><ToUserName><![CDATA[' + data.from_user_name + ']]></ToUserName><FromUserName><![CDATA[' + data.to_user_name + ']]></FromUserName><CreateTime>' + (~~(Date.now() / 1000)) + '</CreateTime>' + message + '</xml>';
      };
    }

    return {

      // 文本消息回复
      text: function(text) {
        return this.send(message('<MsgType><![CDATA[text]]></MsgType><Content><![CDATA[' + text + ']]></Content>'));
      },

      // 图片消息回复
      image: function(image) {
        var self = this;
        var send = function(image) {
          return self.send(message('<MsgType><![CDATA[image]]></MsgType><Image><MediaId><![CDATA[' + image + ']]></MediaId></Image>'));
        };
        if (typeof image === 'string' && image.match(regex_media_id)) { // image 微信素材id，则直接发送
          return send(image);
        } else { // image为文件路径地址，需要上传图片素材
          return self.uploadMedia(image, 'image', function(err, res) {
            if (image = res != null ? res.media_id : void 0) {
              return send(image);
            } else {
              debug(err || res);
              return self.status(500).end();
            }
          });
        }
      },

      // 音频回复
      voice: function(voice) {
        var self = this;
        var send = function(voice) {
          return self.send(message('<MsgType><![CDATA[voice]]></MsgType><Voice><MediaId><![CDATA[' + voice + ']]></MediaId></Voice>'));
        };
        if (voice.match(regex_media_id)) { // voice 微信素材id，则直接发送
          return send(voice);
        } else { // voice 为文件路径地址，需要上传音频素材
          return self.uploadMedia(voice, 'voice', function(err, res) {
            if (!(voice = res != null ? res.media_id : void 0)) {
              return self.status(500).end();
            }
            return send(voice);
          });
        }
      },

      // 视频回复
      video: function(video) {
        var self = this;
        var send = function(_arg1) {
          var video = _arg1.video, title = _arg1.title, description = _arg1.description;
          return self.send(message('<MsgType><![CDATA[video]]></MsgType><Video><MediaId><![CDATA[' + video + ']]></MediaId><Title><![CDATA[' + title + ']]></Title><Description><![CDATA[' + description + ']]></Description></Video>'));
        };
        if (video.video.match(regex_media_id)) { // video 微信素材id，则直接发送
          return send(video);
        } else { // video 为文件路径地址，需要上传视频素材
          return self.uploadMedia(video.video, 'video', function(err, res) {
            if (!(video.video = res != null ? res.media_id : void 0)) {
              return self.status(500).end();
            }
            return send(video);
          });
        }
      },

      // 音乐回复
      music: function(music) {
        var self = this;
        var send = function(_arg1) {
          var title = _arg1.title, description = _arg1.description, music_url = _arg1.music_url, hq_music_url = _arg1.hq_music_url, thumb_media = _arg1.thumb_media;
          return self.send(message('<MsgType><![CDATA[music]]></MsgType><Music><Title><![CDATA[' + title + ']]></Title><Description><![CDATA[' + description + ']]></Description><MusicUrl><![CDATA[' + music_url + ']]></MusicUrl><HQMusicUrl><![CDATA[' + hq_music_url + ']]></HQMusicUrl><ThumbMediaId><![CDATA[' + thumb_media + ']]></ThumbMediaId></Music>'));
        };
        if (music.thumb_media.match(regex_media_id)) { // music 微信素材id，则直接发送
          return send(music);
        } else { // music 为文件路径地址，需要上传音频素材
          return self.uploadMedia(music.thumb_media, 'thumb', function(err, res) {
            if (!(music.thumb_media = res != null ? res.thumb_media_id : void 0)) {
              return self.status(500).end();
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
        return this.send(message('<MsgType><![CDATA[device_text]]></MsgType><DeviceType><![CDATA[' + data.device_type + ']]></DeviceType><DeviceID><![CDATA[' + data.device_id + ']]></DeviceID><SessionID>' + data.session_id + '</SessionID><Content><![CDATA[' + content + ']]></Content>'));
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
  if(self.getBody){
    router.use(function(req, res, next){
      req.weixin = req.weixin || {};
      getBody(req, {
        limit: '100kb',
        length: req.headers['content-length'],
        encoding: 'utf8'
      }, function (err, buf) {
        if(err){
          return next(err);
        }
        req.rawBuf = buf;
        req.body = buf;
        next();
      });
    });
  }

  /**
    * 解析 xml 数据
    * 数据必须在 req.body 里面
    */
  if(self.parseXml){
    router.use(function(req, res, next){
      if(!req.body || typeof req.body !== 'string') {
        debug('xml data invalid:  ', req.body);
        return next();
      }
      xml2js.parseString(req.body, parserOptions, function(err, xml) {
        if (err) {
          err.status = 400;
          return next(err);
        }

        var data = Object.keys(xml.xml).reduce(function(memo, k){
          memo[_s.underscored(k)] = xml.xml[k][0];
          return memo;
        }, {});

        req.body = data;
        next();
      });
    });
  }

  /**
    * 
    * 微信托管 url 路由的中间件，检测消息是否合法（需要 to_user_name 微信号id 来获取配置信息）
    * 在配置微信路由规则时的校验，没有传 to_user_name 参数，这里不做校验，但其他请求都要校验
    *
    */
  router.use(function(req, res, next) {
    var data = req.query;
    var id = req.body ? req.body.to_user_name : '';
    if(id){ // 有微信号id时需要校验消息是否合法
      self.util.getConfig(id, function(err, config){
        config = config || {};
        req.config = config;        
        if (data.encrypt_type === 'aes' && config.token && config.encryptkey && config.appid) {
          req.crypter = new WXBizMsgCrypt(config.token, config.encryptkey, config.appid);
        }
        var token = config.token;
        if(!token) return res.status(401).end();
        var message = [token, data.timestamp, data.nonce].sort().join('');
        if (data.signature === crypto.createHash('sha1').update(message).digest('hex')) {
          return next();
        }else {
          return next('data invalid');
        }
      });

    }else if(req.method === 'POST'){
      return next('data invalid');
    }else { // 没有微信号id是直接通过
      return next();
    }
  });

  /**
    * 解密 xml 数据
    */
  if(self.decrypt){
    router.use(function(req, res, next){
      if(req.query.encrypt_type !== 'aes'){
        debug('Not need decrypt');
        return next();
      }

      if(!req.body.encrypt){
        debug('No encrypt data');
        return next();
      }

      var id = req.body.to_user_name;
      if(!id) {
        debug('No wechat id, Can found config');
        return next();
      }

      if(req.crypter){
        var encrypt = req.body.encrypt;
        var message = req.crypter.decrypt(encrypt).message;
        xml2js.parseString(message, parserOptions, function(err, ret){
          if(err){
            return next(err);
          }
          var result = Object.keys(ret.xml).reduce(function(memo, k){
            memo[_s.underscored(k)] = ret.xml[k][0];
            return memo;
          }, {});
          req.body = result;
          next();
        });       
      }
    });
  }

  /**
    * 配置微信 url 规则时微信发的确认请求
    */
  router.get('/', function(req, res) {
    return res.send(req.query.echostr);
  });

  /**
    * 微信的消息推送请求入口
    */
  router.post('/', function(req, res, next) {
    var process_message = function(user) {
      // 异常处理
      if(!req.body || !req.body.msg_type) {
        return res.status(500).end();
      }

      var handlers, msg_type;
      // 把微信用户信息放在 req.user 中
      _.extend(req.user != null ? req.user : req.user = {}, user);
      // res 帮上微信的消息回复函数
      _.extend(res, reply(req));

      // 各种消息的分类处理
      switch (msg_type = req.body.msg_type.toLowerCase()) {

        // 文本消息
        case 'text':
          return async.eachSeries(text_handlers, function(_arg1, callback) {
            var match, pattern = _arg1[0], handlers = _arg1[1];
            if (match = req.body.content.trim().match(pattern)) {
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

        // 图片，音频，视频，地理位置，连接，设备消息的处理
        case 'image':
        case 'voice':
        case 'video':
        case 'location':
        case 'link':
        case 'device_text':
          return async.eachSeries(self['' + msg_type + '_handlers'] || [], function(handler, callback) {
            return handler(req, res, callback);
          }, function(err) {
            if (err) debug(err);
            self.trapHandle(req, res);
          });

        // 时间为 event 时的处理
        case 'event':
          switch (req.body.event.toLowerCase()) {

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

            // 菜单点击
            case 'click':
              if (handlers = click_handlers[req.body.event_key]) {
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
              req.body.chosen_beacon = Object.keys(req.body.chosen_beacon).reduce(function(memo, k){
                memo[_s.underscored(k)] = req.body.chosen_beacon[k][0];
                return memo;
              }, {});
              req.body.around_beacons = (req.body.around_beacons.AroundBeacon || []).reduce(function(memo, v){
                var obj = Object.keys(v).reduce(function(memo, k){
                  memo[_s.underscored(k)] = v[k][0];
                  console.log('1111', memo);                  
                  return memo;
                }, {});
                memo = memo.concat([obj]);
                return memo;
              }, []);
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
    if (self.populate_user && ((req.body.event != null ? req.body.event.toLowerCase() : void 0) !== 'unsubscribe')) {
      return self.api.getUser(req.body.to_user_name, req.body.from_user_name, function(err, user) {
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
    * 绑定到 router 上
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
      var image_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.image_handlers = image_handlers;
      return self;
    },
    voice: function() {
      var voice_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.voice_handlers = voice_handlers;
      return self;
    },
    video: function() {
      var video_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.video_handlers = video_handlers;
      return self;
    },
    location: function() {
      var location_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.location_handlers = location_handlers;
      return self;
    },
    link: function() {
      var link_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.link_handlers = link_handlers;
      return self;
    },
    device: function() {
      var device_text_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.device_text_handlers = device_text_handlers;
      return self;
    },
    subscribe: function() {
      var subscribe_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.subscribe_handlers = subscribe_handlers;
      return self;
    },
    unsubscribe: function() {
      var unsubscribe_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.unsubscribe_handlers = unsubscribe_handlers;
      return self;
    },
    card: function() {
      var card_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.card_handlers = card_handlers;
      return self;
    },
    templatesendjobfinish: function() {
      var templatesendjobfinish_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.templatesendjobfinish_handlers = templatesendjobfinish_handlers;
      return self;
    },
    click: function() {
      var key = arguments[0];
      var handlers = ((2 <= arguments.length) ? __slice.call(arguments, 1) : []);
      click_handlers[key] = handlers;
      return self;
    },
    shakearound: function() {
      var shakearound_handlers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.shakearound_handlers = shakearound_handlers;
      return self;
    }
  });

};
