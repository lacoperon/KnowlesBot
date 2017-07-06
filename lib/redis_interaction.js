"use strict";
exports.__esModule = true;
var redis = require("redis");
var redis_types_1 = require("./redis_types");
var client = redis.createClient("6379", "127.0.0.1");
client.on('connect', function () {
    console.log('connected');
});
client.set('framework', 'angularjs', function (err, reply) {
    console.log(reply);
});
var variable = "";
client.get('framework', function (err, reply) {
    variable = reply;
    console.log(variable);
});
// 'Setter' Function for Key Value Pairs within Redis Database
function setKeyValue(key, value) {
    client.set(key, value, function (err, reply) {
        if (!err) {
            return redis_types_1.RedisResponse.OK;
        }
    });
    return redis_types_1.RedisResponse.Fail;
}
exports.setKeyValue = setKeyValue;
// 'Getter' Function for Key Value Pairs within Redis Database
function getValueFromKey(key) {
    client.get(key, function (err, reply) {
        if (!err) {
            return [reply, redis_types_1.RedisResponse.OK];
        }
    });
}
exports.getValueFromKey = getValueFromKey;
// 'Delete' Function for Removing Keys from within Redis Database
function deleteKeyFromRedis(key) {
    client.del(key, function (err, reply) {
        if (!err) {
            if (reply) {
                return redis_types_1.RedisResponse.OK;
            }
        }
    });
    return redis_types_1.RedisResponse.Fail;
}
exports.deleteKeyFromRedis = deleteKeyFromRedis;
