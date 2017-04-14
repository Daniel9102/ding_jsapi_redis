/**
 * Created by shimng on 2017/3/12.
 */
var querystring = require("querystring");
var moment = require("moment");
var request = require('request');
var http = require("https");
var _ = require("underscore");
var Q= require("q");
var redis = require('redis');
var config = require("../config");
var async = require("async");
var crypto = require("crypto");
var dingToken = {} ;
var dingTicket = {} ;
var dingChannelToken = {} ;
var dingChannelTicket = {} ;
//钉钉API请求Host
var dingHost = "oapi.dingtalk.com" ;
function getToken(cb){
    var tokenUrl = "https://"+dingHost+"/gettoken?"+querystring.stringify({
            corpid:config.ding.corpId,
            corpsecret:config.ding.secret
        });
    request.get(tokenUrl,function(err,res,body){
        if(err){
            cb("getToken err",err);
        }else{
            try {
                var token = JSON.parse(body).access_token;
                cb(null, token);
            }
            catch (e) {
                cb("getToken error", e);
            }
        }
    })
}
function tryGetToken(cb){
    var now = moment().unix();
    if(!dingToken[config.ding.prefix] || !dingToken[config.ding.prefix].token || (now-dingToken[config.ding.prefix].time>7200)){
        async.waterfall([
            function (cb) {
                getToken(cb);
            }
        ],function(err,result){
            if(err){
                cb(err,err)
            }else{
                dingToken[config.ding.prefix] = {
                    token:result,
                    time:now+7200
                };
                var client = redis.createClient(config.redis.port,config.redis.host,config.redis.auth);
                client.set(config.ding.prefix +"access_token",'{"access_token":"'+result+'","expire_time":'+(+now+7000)+'}',redis.print);
                client.quit();//必须关闭
                cb(null,dingToken);
            }
        })
    }else{
        cb(null,dingToken);
    }
}
function getAccessToken(cb){
    //判断内存中是否有缓存
    var now = moment().unix();
    if(!dingToken ||!dingToken[config.ding.prefix] || !dingToken[config.ding.prefix].token ||  (now-dingToken[config.ding.prefix].time>7200)){
        var client = redis.createClient(config.redis.port,config.redis.host,config.redis.auth);
        client.get(config.ding.prefix+"access_token",function(err,keys){
            var key = JSON.parse(keys);
            if(_.has(key,"access_token")){
                dingToken[config.ding.prefix] = {
                    token:key.access_token,
                    time:key.expire_time
                }
            }
            client.quit();
            tryGetToken(cb);
        })
    }else{
        tryGetToken(cb)
    }
}

function getTicket(token,cb){
    var tokenUrl = "https://"+dingHost+"/get_jsapi_ticket?"+querystring.stringify({
            access_token:token[config.ding.prefix].token
        });
    request.get(tokenUrl,function(err,res,body){
        if(err){
            cb("getTicket err",err);
        }else{
            try {
                var ticket = JSON.parse(body).ticket;
                cb(null, ticket);
            }
            catch (e) {
                cb("getTicket error", e);
            }
        }
    })
}
function tryGetTicket(token,url,cb){
    var now = moment().unix();
    var timestamp = getTimesTamp();
    var noncestr = getNonceStr();
    if(!dingTicket[config.ding.prefix] || !dingTicket[config.ding.prefix].ticket || (now-dingTicket[config.ding.prefix].time>7200)){
        async.waterfall([
            function (cb) {
                getTicket(token,cb);
            }
        ],function(err,result){
            if(err){
                cb(err,err)
            }else{
                dingTicket[config.ding.prefix] = {
                    ticket:result,
                    time:now+7200
                };
                var client = redis.createClient(config.redis.port,config.redis.host,config.redis.auth);
                client.set(config.ding.prefix +"ticket",'{"ticket":"'+result+'","expire_time":'+(+now+7000)+'}',redis.print);
                client.quit();//必须关闭
                var str = 'jsapi_ticket=' + dingTicket[config.ding.prefix].ticket + '&noncestr=' + noncestr + '&timestamp=' + timestamp + '&url=' + url;
                var signature = crypto.createHash('sha1').update(str).digest('hex');
                cb(null, {
                    corpId: config.ding.corpId,
                    timeStamp: timestamp,
                    nonceStr: noncestr,
                    signature: signature
                });
                // cb(null,dingTicket);
            }
        })
    }else{
        var str = 'jsapi_ticket=' + dingTicket[config.ding.prefix].ticket + '&noncestr=' + noncestr + '&timestamp=' + timestamp + '&url=' + url;
        var signature = crypto.createHash('sha1').update(str,'utf8').digest('hex');
        cb(null, {
            corpId: config.ding.corpId,
            timeStamp: timestamp,
            nonceStr: noncestr,
            signature: signature
        });
        // cb(null,dingTicket);
    }
}
function getJsTicket(token,url,cb){
    //判断内存中是否有缓存
    var now = moment().unix();
    if(!dingTicket ||!dingTicket[config.ding.prefix] || !dingTicket[config.ding.prefix].ticket ||  (now-dingTicket[config.ding.prefix].time>7200)){
        var client = redis.createClient(config.redis.port,config.redis.host,config.redis.auth);
        client.get(config.ding.prefix+"ticket",function(err,keys){
            var key = JSON.parse(keys);
            if(_.has(key,"ticket")){
                dingTicket[config.ding.prefix] = {
                    ticket:key.ticket,
                    time:key.expire_time
                }
            }
            client.quit();
            tryGetTicket(token,url,cb);
        })
    }else{
        tryGetTicket(token,url,cb)
    }
}

function getChannelToken(cb){
    var tokenUrl = "https://"+dingHost+"/channel/get_channel_token?"+querystring.stringify({
            corpid:config.ding.corpId,
            channel_secret:config.ding.channelSecret
        });
    request.get(tokenUrl,function(err,res,body){
        if(err){
            cb("getChannelToken err",err);
        }else{
            try {
                var token = JSON.parse(body).access_token;
                cb(null, token);
            }
            catch (e) {
                cb("getChannelToken error", e);
            }
        }
    })
}
function tryGetChannelToken(cb){
    var now = moment().unix();
    if(!dingChannelToken[config.ding.prefix] || !dingChannelToken[config.ding.prefix].token || (now - dingChannelToken[config.ding.prefix].time>7200)){
        async.waterfall([
            function (cb) {
                getChannelToken(cb);
            }
        ],function(err,result){
            if(err){
                cb(err,err)
            }else{
                dingChannelToken[config.ding.prefix] = {
                    token:result,
                    time:now+7200
                };
                var client = redis.createClient(config.redis.port,config.redis.host,config.redis.auth);
                client.set(config.ding.prefix +"channel_access_token",'{"access_token":"'+result+'","expire_time":'+(+now+7000)+'}',redis.print);
                client.quit();//必须关闭
                cb(null,dingChannelToken);
            }
        })
    }else{
        cb(null,dingChannelToken);
    }
}
function getChannelAccessToken(cb){
    //判断内存中是否有缓存
    var now = moment().unix();
    if(!dingChannelToken ||!dingChannelToken[config.ding.prefix] || !dingChannelToken[config.ding.prefix].token ||  (now-dingChannelToken[config.ding.prefix].time>7200)){
        var client = redis.createClient(config.redis.port,config.redis.host,config.redis.auth);
        client.get(config.ding.prefix+"channel_access_token",function(err,keys){
            var key = JSON.parse(keys);
            if(_.has(key,"access_token")){
                dingChannelToken[config.ding.prefix] = {
                    token:key.access_token,
                    time:key.expire_time
                }
            }
            client.quit();
            tryGetChannelToken(cb);
        })
    }else{
        tryGetChannelToken(cb)
    }
}

function getChannelTicket(token,cb){
    console.log(token);
    var tokenUrl = "https://"+dingHost+"/channel/get_channel_jsapi_ticket?"+querystring.stringify({
            access_token:token[config.ding.prefix].token
        });
    request.get(tokenUrl,function(err,res,body){
        if(err){
            cb("getTicket err",err);
        }else{
            try {
                console.log(JSON.parse(body));
                var ticket = JSON.parse(body).ticket;
                console.log(JSON.parse(body));
                cb(null, ticket);
            }
            catch (e) {
                cb("getTicket error", e);
            }
        }
    })
}
function tryGetChannelTicket(token,url,cb){
    var now = moment().unix();
    var timestamp = getTimesTamp();
    var noncestr = getNonceStr();
    if(!dingChannelTicket[config.ding.prefix] || !dingChannelTicket[config.ding.prefix].ticket || (now-dingChannelTicket[config.ding.prefix].time>7200)){
        console.log(dingChannelTicket);
        console.log(dingChannelTicket[config.ding.prefix]);
        async.waterfall([
            function (cb) {
                getChannelTicket(token,cb);
            }
        ],function(err,result){
            if(err){
                console.log(err);
                cb(err,err)
            }else{
                dingChannelTicket[config.ding.prefix] = {
                    ticket:result,
                    time:now+7200
                };
                var client = redis.createClient(config.redis.port,config.redis.host,config.redis.auth);
                client.set(config.ding.prefix +"channel_ticket",'{"ticket":"'+result+'","expire_time":'+(+now+7000)+'}',redis.print);
                client.quit();//必须关闭
                var str = 'jsapi_ticket=' + dingChannelTicket[config.ding.prefix].ticket + '&noncestr=' + noncestr + '&timestamp=' + timestamp + '&url=' + url;
                console.log(str);
                var signature = crypto.createHash('sha1').update(str).digest('hex');
                cb(null, {
                    corpId: config.ding.corpId,
                    timeStamp: timestamp,
                    nonceStr: noncestr,
                    signature: signature
                });
                // cb(null,dingTicket);
            }
        })
    }else{
        var str = 'jsapi_ticket=' + dingChannelTicket[config.ding.prefix].ticket + '&noncestr=' + noncestr + '&timestamp=' + timestamp + '&url=' + url;
        console.log(str);
        var signature = crypto.createHash('sha1').update(str,'utf8').digest('hex');
        cb(null, {
            corpId: config.ding.corpId,
            timeStamp: timestamp,
            nonceStr: noncestr,
            signature: signature
        });
        // cb(null,dingTicket);
    }
}
function getJsChannelTicket(token,url,cb){
    //判断内存中是否有缓存
    var now = moment().unix();
    console.log("获取ticket开始");
    if(!dingChannelTicket ||!dingChannelTicket[config.ding.prefix] || !dingChannelTicket[config.ding.prefix].ticket ||  (now-dingChannelTicket[config.ding.prefix].time>7200)){
        console.log("dingTicket不存在");
        var client = redis.createClient(config.redis.port,config.redis.host,config.redis.auth);
        console.log(config.ding.prefix);
        client.get(config.ding.prefix+"channel_ticket",function(err,keys){
            console.log(keys);
            var key = JSON.parse(keys);
            if(_.has(key,"ticket")){
                console.log("redis中获取到");
                dingChannelTicket[config.ding.prefix] = {
                    ticket:key.ticket,
                    time:key.expire_time
                }
            }
            console.log(dingTicket);
            client.quit();
            tryGetChannelTicket(token,url,cb);
        })
    }else{
        tryGetChannelTicket(token,url,cb)
    }
}

function getTimesTamp() {
    return parseInt(new Date().getTime() / 1000) + '';
}
function getNonceStr() {
    return Math.random().toString(36).substr(2, 15);
}
function sign(params) {

}
module.exports = {
    getAccessToken :function () {
        var q = Q.defer();
        async.waterfall([
            function(cb){
                getAccessToken(cb);
            }
        ],function(err,result){
            if(err){
                q.reject(err);
            }else{
                q.resolve(result);
            }
        });
        return q.promise;
    },
    commonHttpGet:function (args) {
        var q = Q.defer() ;
        var tokenUrl = "https://"+dingHost+"/"+args.action+"?"+querystring.stringify(args.params);
        request.get(tokenUrl,function(err,res,body){
            if(err){
                q.reject(err);
            }else{
                try {
                    q.resolve(JSON.parse(body));
                }
                catch (e) {
                    q.reject(e);
                }
            }
        })
        return q.promise;
    },
    commonHttpPost:function (args) {
        var q = Q.defer() ;
        var options = {
            method:"POST",
            url:"https://"+dingHost+"/"+args.action+"?access_token="+args.access_token,
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(args.params)
        }
        request(options,function(err,res,body){
            if(err){
                q.reject(err);
            }else{
                try {
                    q.resolve(JSON.parse(body));
                }
                catch (e) {
                    q.reject(e);
                }
            }
        })
        return q.promise;
    },
    getTicket:function () {
        var q = Q.defer();
        async.waterfall([
            function(cb){
                getAccessToken(cb);
            },
            function (token,cb) {
                getJsTicket(token,cb)
            },
        ],function(err,result){
            if(err){
                q.reject(err);
            }else{
                q.resolve(result);
            }
        });
        return q.promise;
    },
    getSignature:function (url) {
        var q = Q.defer();
        async.waterfall([
            function(cb){
                getAccessToken(cb);
            },
            function (token,cb) {
                getJsTicket(token,url,cb)
            }
        ],function(err,result){
            if(err){
                q.reject(err);
            }else{
                q.resolve(result);
            }
        });
        return q.promise;
    },
    getChannelAccessToken:function () {
        var q = Q.defer();
        async.waterfall([
            function(cb){
                getChannelAccessToken(cb);
            }
        ],function(err,result){
            if(err){
                q.reject(err);
            }else{
                q.resolve(result);
            }
        });
        return q.promise;
    },
    getChannelTicket:function () {
        var q = Q.defer();
        async.waterfall([
            function(cb){
                getChannelAccessToken(cb);
            },
            function (token,cb) {
                console.log("获取channel_token")
                console.log(token);
                getJsChannelTicket(token,cb)
            },
        ],function(err,result){
            if(err){
                q.reject(err);
            }else{
                q.resolve(result);
            }
        });
        return q.promise;
    },
    getChannelSignature:function (url) {
        var q = Q.defer();
        async.waterfall([
            function(cb){
                getChannelAccessToken(cb);
            },
            function (token,cb) {
                console.log("获取channel_token")
                console.log(token);
                getJsChannelTicket(token,url,cb)
            }
        ],function(err,result){
            if(err){
                q.reject(err);
            }else{
                q.resolve(result);
            }
        });
        return q.promise;
    },
}