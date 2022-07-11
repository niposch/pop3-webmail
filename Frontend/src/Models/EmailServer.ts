
export interface EmailServer {
  cacheDate: Date | null;
  username: string;
  password: string;
  url:string;
  symbol:string;
  selected:boolean;
  displayName:string;
  useSSL:boolean;
}
