import * as redis from 'redis';
var client = redis.createClient(process.env.REDISCLOUD_URL);

export interface Member {
  first_name : string;
  full_name : string;
  year : string;
  default_part : string;
}

export interface Song {
  name : string;
  ready_score : number;
  parts : Part[];
}

export interface Part {
  name : string;
  people : Member[];
}

enum OperationStatus {

}


export function addToGroup(member : Member) {
  client.hset(`user:${member.first_name}`, `full_name`, member.full_name, function() {
      client.hset(`user:${member.first_name}`, 'year', member.year, function() {
          client.hset(`user:${member.first_name}`, 'default_part', member.default_part, function() {
              console.log(`Member ${member.first_name} has been added to the Group`);
          });

      });
  });


}

export function removeFromGroup(member : Member) {
  client.hdel(`user:${member.first_name}`, `full_name`, function() {
      client.hdel(`user:${member.first_name}`, 'year', function() {
          client.hdel(`user:${member.first_name}`, 'default_part', function() {
            console.log(`Member ${member.first_name} has been removed from the group.\n
                         Here's hoping that they graduated.`);
          });
      });
  });
}


export function addToRepertoire(song : Song) {
  client.hset(`song:${song.name}`,'ready_score', (song.ready_score.toString()) );
  client.hset(`song:${song.name}`, 'parts', JSON.stringify(song.parts));
}

export function updateReadyScore(songName : string, ready_score : number) {
    if(client.hexists(`song:${songName}`, 'ready_score')) {
      client.hset(`song:${songName}`, 'ready_score', ready_score.toString(), function() {

      })
    } else {
      console.log(`No such song exists by the name of ${songName}`);
    }
}
