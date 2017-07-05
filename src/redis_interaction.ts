import * as redis from 'redis';
import {RedisResponse} from './redis_types';
var client = redis.createClient(process.env.REDISCLOUD_URL);


/* testing out the redis client */
export function redisTest() {
  client.set("Key","Value", function() {
    client.get("Key", function(err, reply) {
      console.log(reply);
    });
  });
}

// 'Setter' Function for Key Value Pairs within Redis Database
export function setKeyValue(key : string, value : string): RedisResponse {
  client.set(key, value, function(err, reply) {
    if(!err) {
      if(reply.trim() == "OK") {
        return RedisResponse.OK;
      }
    }
  });
  return RedisResponse.Fail;
}

// 'Getter' Function for Key Value Pairs within Redis Database
export function getValueFromKey(key : string) : [string, RedisResponse] {
  client.get(key, function(err, reply) {
    if(!err) {
      return[reply, RedisResponse.OK];
    }
  });
  return["", RedisResponse.Fail];
}

// 'Delete' Function for Removing Keys from within Redis Database
export function deleteKeyFromRedis(key : string) : RedisResponse {
  client.del(key, function(err, reply) {
    if(!err) {
      if(reply) {
        return RedisResponse.OK;
      }
    }
  });
  return RedisResponse.Fail;
}
