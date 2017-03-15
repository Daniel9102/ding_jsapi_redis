/**
 * Created by nico on 2017/3/12.
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
var dingToken = {} ;
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
            if(_.has(keys,"access_token")){
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
        console.log("start post");
        var q = Q.defer() ;
        var options = {
            method:"POST",
            url:"https://"+dingHost+"/"+args.action+"?access_token="+args.access_token,
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(args.params)
        }
        console.log(args.access_token);
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
    }
}