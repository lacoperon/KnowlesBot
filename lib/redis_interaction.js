"use strict";
exports.__esModule = true;
var redis = require("redis");
var redis_types_1 = require("./redis_types");
var client = redis.createClient(process.env.REDISCLOUD_URL);
/* testing out the redis client */
function redisTest() {
    client.set("Key", "Value", function () {
        client.get("Key", function (err, reply) {
            console.log(reply);
        });
    });
}
exports.redisTest = redisTest;
// 'Setter' Function for Key Value Pairs within Redis Database
function setKeyValue(key, value) {
    client.set(key, value, function (err, reply) {
        if (!err) {
            if (reply.trim() == "OK") {
                return redis_types_1.RedisResponse.OK;
            }
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
    return ["", redis_types_1.RedisResponse.Fail];
}
exports.getValueFromKey = getValueFromKey;
