var request = require('supertest');
var WXBizMsgCrypt = require('wechat-crypto');
var crypto = require('crypto');
var xml2js = require('xml2js');
var _s = require('underscore.string');


/*
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

var createXml = function (config, openid, msg, timestamp, need_encrypt){
  var xml = '<xml><ToUserName><![CDATA[' + config.id + ']]></ToUserName><FromUserName><![CDATA[' + openid + ']]></FromUserName><CreateTime>' + timestamp + '</CreateTime>' + msg + '</xml>';
  if(!need_encrypt) return xml;
  var crypter = new WXBizMsgCrypt(config.token, config.encrypt_key, config.app_id);
  var encrypt = crypter.encrypt(xml);
  xml = '<xml><ToUserName><![CDATA[' + config.id + ']]></ToUserName><Encrypt><![CDATA[' + encrypt + ']]></Encrypt></xml>';
  return xml;
};

var createSign = function(token, timestamp, nonce){
  var str = [token, timestamp, nonce].sort().join('');
  return crypto.createHash('sha1').update(str).digest('hex');
};

var options = {
  async: true,
  explicitArray: true,
  normalize: true,
  trim: true
};

var formatStr = function(str){
  return str.trim().replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
};

var _format = function(data){
  if(data){
    for(var p in data){
      var prot = p;
      if(typeof prot === 'string') prot = formatStr(prot);
      if(prot !== p){
        data[prot] = data[p];
        delete data[p];
      }
      if(typeof data[prot] === 'object') {
        if((Object.prototype.toString.call(data[prot]) === '[object Array]') && data[prot].length === 1){
          data[prot] = data[prot][0];
        }
        _format(data[prot]);        
      }
    }
  }
};

var get = function (token, echostr, callback){
  if(typeof echostr === 'callback') {
    callback = echostr;
    echostr = createNonceStr();
  }
  var timestamp = createTimestamp();
  var nonce = createNonceStr();
  var signature = createSign(token, timestamp, nonce);
  this.request.get('/wechat?signature=' + signature + '&timestamp=' + timestamp + '&nonce=' + nonce + '&echostr=' +echostr)
  .end(function(err, res){
    if(err) return callback(err);
    if(res.text !== echostr) return callback('echostr error');
    return callback(null, res.text);
  });
};

var post = function (config, openid, msg, need_encrypt, callback){
  if(typeof need_encrypt === 'function'){
    callback = need_encrypt;
    need_encrypt = false;
  }
  var timestamp = createTimestamp();
  var nonce = createNonceStr();
  var signature = createSign(config.token, timestamp, nonce);
  var xml = createXml(config, openid, msg, timestamp, need_encrypt);
  var url = '/wechat?signature=' + signature + '&timestamp=' + timestamp + '&nonce=' + nonce;
  if(need_encrypt) url += '&encrypt_type=aes';
  this.request.post(url)
  .set('Content-Type', 'application/xml')
  .send(xml)
  .end(function(err, res){
    if(err) return callback(err);
    var xml = res.text;
    xml2js.parseString(xml, options, function(err, ret){
      if(err || !ret || !ret.xml) return callback(null, xml);
      var result = ret.xml;
      _format(result);
      if(!result.encrypt) return callback(null, result);
      if(result.encrypt){
        var crypter = new WXBizMsgCrypt(config.token, config.encrypt_key, config.app_id);
        var message = crypter.decrypt(result.encrypt).message;
        if(!message) return callback(result);
        xml2js.parseString(message, options, function(err, ret){
          if(err || !ret || !ret.xml) return callback(null, result);
          var data = ret.xml;
          _format(data);
          return callback(null, data);
        });
      }
    });        
  });
};


var Request = module.exports = function(base){
  if (!(this instanceof Request)) {
    return new Request(base);
  }

  this.request = request(base);
  this.post = post;
  this.get = get;
};

