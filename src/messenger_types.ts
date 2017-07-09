
/*
This is the 'Messenger Types' file, in which I explicitly declare interfaces
used by Facebook's Messenger API, based upon my own research into their docs.

-@lacoperon
*/
export interface Sender {
  id : string;
}

export interface Recipient {
  id : string;
}

export interface Event {
  sender : Sender;
  recipient : Recipient;
  timestamp : number;
  message : Message;
  postback : Postback;
}

export interface Message {
  is_echo : boolean;
  mid : string; // message ID
  app_id : string;
  metadata : string;
  text : string;
  attachments : any;
  quick_reply : QuickReply;
}

export interface QuickReply {
  content_type : "location" | "text";
  title? : string;
  payload? : string;
  image_url? : string;
}

export interface Referral {
  ref : any;
  source : "SHORTLINK" | "ADS";
  type: string;
}

export interface Postback {
  payload : string;
  referral : Referral;
}

export interface YoutubeSplash {
  youtube_url : string;
  image_url : string;
  fallback_url? : string;
  title? : string;
  subtitle? : string;
}
