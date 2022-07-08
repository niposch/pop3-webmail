import {EventEmitter, Injectable, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {EmailServer} from "../Models/EmailServer";
import {Email} from "../Models/Email";
import { sha256} from "crypto-hash"
import {parseJson} from "@angular/cli/src/utilities/json-file";
import {Observable, of, reduce, Subscription, tap} from "rxjs";
import {merge, map} from "rxjs";
import * as Rx from 'rx';
import {restoreGetExpandoInitializer} from "@angular/compiler-cli/ngcc/src/packages/patch_ts_expando_initializer";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isUserLoggedIn: boolean = false;


  public serverChange: EventEmitter<Array<EmailServer>> = new EventEmitter<Array<EmailServer>>();
  public emailChange: EventEmitter<Array<Email>> = new EventEmitter<Array<Email>>();
  public servers:Array<EmailServer> = [];
  public emails:Array<Email> = [];

  constructor(private http:HttpClient) {
    let self = this
    this.serverChange.subscribe((servers) => {
      AuthService.getEmailsFromServers(servers, self).subscribe(emails => {
        self.emailChange.emit(emails)
      })
    })
    this.loadServers()
  }

  private loadServers():Array<EmailServer>{
    let serverJson = localStorage.getItem("servers")
    this.servers = serverJson != null ? parseJson(serverJson) : [];
    this.serverChange.emit(this.servers);
    return this.servers;
  }

  private storeServers(servers:Array<EmailServer>){
    localStorage.setItem("servers", JSON.stringify(servers));
  }

  getLoggedInServers(servers:Array<EmailServer>):Array<EmailServer>{
    return servers.filter(s => s.selected);
  }
  private static getEmailsForServer(server:EmailServer, self:AuthService):Observable<Array<Email>>{
    return self.http
      .get<Array<Email>>(`http://localhost:8080/api/emails?username=${server.username}&password=${server.password}&url=${server.url}`)
      .pipe(map(result => {
        // @ts-ignore
        result.forEach(e => e.date = new Date(Date.parse(e.date)));
        return result;

      }))
  }

  private static getEmailsFromServers(allservers:Array<EmailServer>, self:AuthService):Observable<Email[]>{
    let servers = self.getLoggedInServers(allservers);
    if (servers.length == 0) {
      return of([]);
    }
    let outp = merge(...servers.filter(s => s.selected).map(v => AuthService.getEmailsForServer(v, self))).pipe(
        reduce((acc, mails) => [...acc, ...mails], [] as Email[]),
        map(mails => mails.sort((a,b) => a.date.getTime() - b.date.getTime())));

    return outp
  }
  updateServer(server: EmailServer, newCheckedState:boolean) {
    let currentServer = this.servers.find(s => s.url == server.url && s.username == server.username && s.password == server.password);
    if(currentServer == null){
      return;
    }
    currentServer.selected = newCheckedState;
    this.storeServers(this.servers);
    this.serverChange.emit(this.servers);
  }

  private addServer(server: EmailServer) {
    this.servers.push(server);
    this.storeServers(this.servers);
    this.serverChange.emit(this.servers);
  }
  login(userName:string, password:string, popUrl:string, displayName:string, symbol:string):Observable<any>{
    return this.http.post('api/authenticate', null,
      {params:{
        username:userName,
        password:password,
        url:popUrl,
        },
        responseType:"text"
    })
      .pipe(tap(() => {
        this.isUserLoggedIn = true;
        console.log("User logged in");
        this.addServer({username:userName,password:password,url:popUrl,selected:true, displayName: displayName, symbol: symbol});
      }))
  }
  removeServer(server:EmailServer){
    this.servers = this.servers.filter(s => !(s.url == server.url && s.username == server.username && s.password == server.password))
    this.serverChange.emit(this.servers)
    this.storeServers(this.servers)
  }

  getAllServers():Array<EmailServer> {
    return this.servers
  }
  getAllActiveEmails(): Array<Email>{
    return this.emails
  }
}
