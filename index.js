/**
 * Created by shimng on 2017/3/11.
 */
var Q = require("q");
var async = require("async");
var auth = require("./lib/auth");
var config = require("./config")
module.exports = {
    conf: config,
    //获取token
    getAccessToken:function(){
        var q = Q.defer();
        auth.getAccessToken().then(function (data) {
            q.resolve(data);
        }).catch(function (err) {
            q.reject(err);
        })
        return q.promise;
    },
    //get公用方法
    httpGetFunc:function (args) {
        var q = Q.defer();
        async.waterfall([
            function (cb) {
                if(args.type === 1){
                    auth.getChannelAccessToken().then(function (data) {
                        cb(null,data);
                    }).catch(function (err) {
                        cb(err)
                    });
                }else{
                    auth.getAccessToken().then(function (data) {
                        cb(null,data);
                    }).catch(function (err) {
                        cb(err)
                    });
                }
            },
            function (token,cb) {
                var params = args.params || {} ;
                params["access_token"] = token[config.ding.prefix].token ;
                auth.commonHttpGet({
                    action:args.action,
                    params:params
                }).then(function(data){
                    cb(null,data);
                }).catch(function (err) {
                    cb(err);
                })
            }
        ],function (err,result) {
            if(err){
                q.reject(err);
            }else{
                q.resolve(result);
            }
        })
        return q.promise;
    },
    //公共post请求方法
    httpPostFunc:function (args) {
        var q = Q.defer();
        async.waterfall([
            function (cb) {
                if(args.type === 1){
                    auth.getChannelAccessToken().then(function (data) {
                        cb(null,data);
                    }).catch(function (err) {
                        cb(err)
                    });
                }else{
                    auth.getAccessToken().then(function (data) {
                        cb(null,data);
                    }).catch(function (err) {
                        cb(err)
                    });
                }
            },
            function (token,cb) {
                var params = args.params || {} ;
                // params["access_token"] = token[config.ding.prefix].token ;
                auth.commonHttpPost({
                    action:args.action,
                    access_token :token[config.ding.prefix].token ,
                    params:params
                }).then(function(data){
                    cb(null,data);
                }).catch(function (err) {
                    cb(err);
                })
            }
        ],function (err,result) {
            if(err){
                q.reject(err);
            }else{
                q.resolve(result);
            }
        })
        return q.promise;
    },
    //获取部门列表
    getDepartmentList:function () {
        var q = Q.defer();
        async.waterfall([
            function (cb) {
                auth.getAccessToken().then(function (data) {
                    cb(null,data);
                }).catch(function (err) {
                    cb(err)
                });
            },
            function (token,cb) {
                auth.commonHttpGet({action:"department/list",params:{access_token:token[config.ding.prefix].token}}).then(function(data){
                    cb(null,data);
                }).catch(function (err) {
                    cb(err);
                })
            }
        ],function (err,result) {
            if(err){
                q.reject(err);
            }else{
                q.resolve(result);
            }
        })
        return q.promise;
    },
    getSignature:function(url){
        var q = Q.defer();
        auth.getSignature(url).then(function (data) {
            q.resolve(data);
        }).catch(function (err) {
            q.reject(err);
        })
        return q.promise;
    },

    getChannelAccessToken:function(){
        var q = Q.defer();
        auth.getChannelAccessToken().then(function (data) {
            q.resolve(data);
        }).catch(function (err) {
            q.reject(err);
        })
        return q.promise;
    },
    getChannelSignature:function(url){
        var q = Q.defer();
        auth.getChannelSignature(url).then(function (data) {
            q.resolve(data);
        }).catch(function (err) {
            q.reject(err);
        })
        return q.promise;
    },
}