import * as redis from 'redis';
var client = redis.createClient(process.env.REDISCLOUD_URL);


/* testing out the redis client */
export function redisTest() {
  client.set("Key","Value");
  client.get("Key", function(err, reply) {
    console.log(reply);
  });

}
