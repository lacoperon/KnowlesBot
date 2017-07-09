import * as redis from 'redis';
var client = redis.createClient(process.env.REDISCLOUD_URL);
import {Sender, Recipient, Event, Message, QuickReply, Referral, Postback} from './messenger_types';
import {sendTextMessage, callSendAPI} from './messenger';

var sender : Sender ;


interface Command {
  name : string;
  description : string;
  is_secret : boolean; // only accessible to admin
  messenger_actions(messageText : string, sender : Sender) : void;
}

interface CommandList {
  bot_name : string;
  description : string;
  commands : {[name : string] : Command};
}

export var CommandList : CommandList = {
  bot_name : "KnowlesBot",
  description : "A bot for 102 Knowles Avenue",
  commands :
    {
      "wesley" : {
        name : "wesley",
        description : "Sends Wesley Crusher meme",
        is_secret : false,
        messenger_actions : function(messageText : string, sender : Sender) {

          var messageData = {
            "recipient":{
              "id": sender.id
            }, "message": {
              "attachment": {
                  "type": "template",
                  "payload": {
                      "template_type": "list",
                      "elements": [
                          {
                              "title": "Wesley Crusher gets Destroyed in Christmas Song",
                              "image_url": "https://s-media-cache-ak0.pinimg.com/736x/2f/d1/6f/2fd16f6aa3e5721215d335dff48fdf34--wesley-crusher-star-wars.jpg",
                              "subtitle": "Click for Accompanying Jingle",
                              "default_action": {
                                  "type": "web_url",
                                  "url": "https://youtu.be/sZt6eU5REN8",
                                  "messenger_extensions": true,
                                  "webview_height_ratio": "tall",
                                  "fallback_url": "https://youtu.be/sZt6eU5REN8"
                              },
                              "buttons": [
                                  {
                                      "title": "Watch",
                                      "type": "web_url",
                                      "url": "https://youtu.be/sZt6eU5REN8",
                                      "messenger_extensions": true,
                                      "webview_height_ratio": "tall",
                                      "fallback_url": "https://youtu.be/sZt6eU5REN8"
                                  }
                              ]
                          }
                      ]
                  }
              }
          }

          }

          callSendAPI(messageData);

        }
      }
    }
}
