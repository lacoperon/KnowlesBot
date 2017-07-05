"use strict";
exports.__esModule = true;
var chai_1 = require("chai");
require("mocha");
var RedisInteraction = require("../redis_interaction");
var redis_types_1 = require("../redis_types");
describe("Redis IO Works as expected", function () {
    describe("Can GET/SET", function () {
        it('Should be able to SET {Key, Value} Pair', function () {
            var result = RedisInteraction.setKeyValue("key", "value");
            chai_1.expect(result).to.equal(redis_types_1.RedisResponse.OK);
        });
        it('Should be able to GET Value from Key', function () {
            var response = RedisInteraction.getValueFromKey("key");
            var value = response[0];
            var redis_resp = response[1];
            chai_1.expect(value).to.equal("value");
            chai_1.expect(redis_resp).to.equal(redis_types_1.RedisResponse.OK);
        });
    });
    describe("Can DEL", function () {
        before(function () {
            RedisInteraction.setKeyValue("key_to_delete", "value");
        });
        it("Should be able to DEL Key from Redis DB", function () {
            chai_1.expect(RedisInteraction.deleteKeyFromRedis("key_to_delete"))
                .to.equal(redis_types_1.RedisResponse.OK);
        });
    });
});
