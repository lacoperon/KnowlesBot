import * as redis from 'redis';
import {RedisInteraction} from './redis_types';
var client = redis.createClient(process.env.REDISCLOUD_URL);


/* testing out the redis client */
export function redisTest() {
  client.set("Key","Value", function() {
    client.get("Key", function(err, reply) {
      console.log(reply);
    });
  });
}

export function setKeyValue(key : string, value : string) : RedisInteraction {

  client.set(key, value, function(err, reply) {
    if(!err) {
      console.log(reply);
    }
  });
  return RedisInteraction.OK;
}
