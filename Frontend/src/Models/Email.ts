import {EmailServer} from "./EmailServer";

export interface Email{
  subject: string;
  body: string;
  sender: string;
  receiver: string;
  date: Date;
  server: EmailServer;
  headers:Map<string, string>
}
