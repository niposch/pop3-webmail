import {EmailServer} from "./EmailServer";

export interface Email{
  subject: string;
  body: string;
  sender: Array<string>;
  receiver: Array<string>;
  date: Date;
  server: EmailServer;
  headers:Map<string, string>
}
