"use strict";
exports.__esModule = true;
var redis = require("redis");
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
