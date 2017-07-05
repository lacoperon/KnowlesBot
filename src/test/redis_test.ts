import {expect, assert} from 'chai';
import 'mocha';

import * as RedisInteraction from '../redis_interaction';
import {RedisResponse} from '../redis_types';

describe("Redis IO Works as expected", function() {
  describe("Can GET/SET", function() {
    it('Should be able to SET {Key, Value} Pair', function() {
      var result = RedisInteraction.setKeyValue("key","value");
      expect(result).to.equal(RedisResponse.OK);
    });

    it('Should be able to GET Value from Key', function() {
      const response = RedisInteraction.getValueFromKey("key");
      const value = response[0];
      const redis_resp = response[1];
      expect(value).to.equal("value");
      expect(redis_resp).to.equal(RedisResponse.OK);
    });
  });
  describe("Can DEL", function() {
    before(function() {
      RedisInteraction.setKeyValue("key_to_delete","value");
    });
    it("Should be able to DEL Key from Redis DB", function() {
      expect(RedisInteraction.deleteKeyFromRedis("key_to_delete"))
      .to.equal(RedisResponse.OK);
    });
  });
});
