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
function setKeyValue(key, value) {
    client.set(key, value, function (err, reply) {
        if (!err) {
            console.log(reply);
        }
    });
    return redis_types_1.RedisInteraction.OK;
}
exports.setKeyValue = setKeyValue;
