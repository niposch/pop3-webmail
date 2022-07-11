import {EventEmitter, Injectable, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {EmailServer} from "../Models/EmailServer";
import {Email} from "../Models/Email";
import {sha256} from "crypto-hash"
import {parseJson} from "@angular/cli/src/utilities/json-file";
import {catchError, Observable, of, reduce, Subscription, tap} from "rxjs";
import {merge, map} from "rxjs";
import * as Rx from 'rx';
import {restoreGetExpandoInitializer} from "@angular/compiler-cli/ngcc/src/packages/patch_ts_expando_initializer";
import {forms} from "@angular/core/schematics/migrations/typed-forms/util";

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  isUserLoggedIn: boolean = false;


  // the boolean is used to indicate if new data should be queried from the server
  public serverChange: EventEmitter<[Array<EmailServer>, boolean, boolean]> = new EventEmitter<[Array<EmailServer>, boolean, boolean]>()
  public emailChange: EventEmitter<Array<Email>> = new EventEmitter<Array<Email>>();
  public servers: Array<EmailServer> = [];
  public emails: Array<Email> = [];

  constructor(private http: HttpClient) {
    let self = this
    this.serverChange.subscribe((servers) => {
      if(servers[1]){
        AuthService.getEmailsFromServers(AuthService.transformToEmailServerQueryInput(servers[0]), self).subscribe(emails => {
          self.emailChange.emit(emails)
        })
      }
    })
    this.loadServers()
  }

  public loadServers(): Array<EmailServer> {
    let serverJson = localStorage.getItem("servers")
    this.servers = serverJson != null ? parseJson(serverJson) : [];
    this.serverChange.emit([this.servers, true, false]);
    return this.servers;
  }

  private storeServers(servers: Array<EmailServer>) {
    localStorage.setItem("servers", JSON.stringify(servers));
  }

  getLoggedInServers(servers: Array<EmailServer>): Array<EmailServer> {
    return servers.filter(s => s.selected);
  }

  private static getEmailsForServer(server: EmailServer, self: AuthService, force:boolean): Observable<Array<Email>> {
    return self.http
      .get<EmailQueryResponse>(`http://localhost:8080/api/emails`, {
        params: {
          username: server.username,
          password: server.password,
          url: server.url,
          usessl: server.useSSL ? "true" : "false",
          force: force

        }
      })
      .pipe(
        tap(res => {
          if(res.cacheDate != null && res.cacheDate != ""){
            server.cacheDate = new Date(Date.parse(res.cacheDate));
          }
          else{
            server.cacheDate = null;
          }
          self.updateServerInternal(server, false)
        }),
        map<EmailQueryResponse, Array<Email>>(res => res.data),
        map(result => {
            result = result.map(e => {
              // @ts-ignore
              e = parseJson(e)
              // @ts-ignore
              e.date = new Date(Date.parse(e.date.$date))
              return e
            });
            return result;
          }
        ),
        catchError(err => {
          console.log(err)
          alert("Error while fetching emails from " + server.url)
          return of([]);
        })
      )
  }

  private static transformToEmailServerQueryInput(servers: Array<EmailServer>): Array<EmailServerQueryInput> {
    if(servers == null){
      return []
    }
    return servers.map(s => {
      return {
        server: s,
        forceReload: false
      }
    })
  }
  private static getEmailsFromServers(allservers: Array<EmailServerQueryInput>, self: AuthService): Observable<Email[]> {
    let servers = self.getLoggedInServers(allservers.map(i => i.server));
    if (servers.length == 0) {
      return of([]);
    }
    let activeQueriedServers = allservers.filter(i => servers.includes(i.server));
    let outp = merge(...activeQueriedServers.filter(s => s.server.selected || s.forceReload).map(v => AuthService.getEmailsForServer(v.server, self, v.forceReload))).pipe(
      reduce((acc, mails) => [...acc, ...mails], [] as Email[]),
      map(mails => mails.sort((a, b) => b.date.getTime() - a.date.getTime())));

    return outp
  }

  public updateServer(server: EmailServer, newCheckedState: boolean) {
    server.selected = newCheckedState;
    this.updateServerInternal(server, true);
  }

  private updateServerInternal(server: EmailServer, causeUpdateEvent: boolean, forceUpdate: boolean = false) {
    let currentServer = this.servers.find(s => s.url == server.url && s.username == server.username && s.password == server.password && s.useSSL == server.useSSL)
    if (currentServer == null) {
      return;
    }
    this.storeServers(this.servers);
    this.serverChange.emit([this.servers, causeUpdateEvent, forceUpdate]);
  }

  private addServer(server: EmailServer) {
    this.servers.push(server);
    this.storeServers(this.servers);
    this.serverChange.emit([this.servers, true, true]);
  }

  login(userName: string, password: string, popUrl: string, displayName: string, symbol: string, useSSL: boolean): Observable<any> {
    return this.http.post('api/authenticate', null,
      {
        params: {
          username: userName,
          password: password,
          url: popUrl,
          usessl: useSSL ? "true" : "false",
        },
        responseType: "text"
      })
      .pipe(tap(() => {
        this.isUserLoggedIn = true;
        console.log("User logged in");
        this.addServer({
          username: userName,
          password: password,
          url: popUrl,
          selected: true,
          displayName: displayName,
          symbol: symbol,
          useSSL: useSSL,
          cacheDate: null
        })
      }))
  }

  removeServer(server: EmailServer) {
    this.servers = this.servers.filter(s => !(s.url == server.url && s.username == server.username && s.password == server.password))
    this.serverChange.emit([this.servers, true, false]);
    this.storeServers(this.servers)
  }

  getAllServers(): Array<EmailServer> {
    return this.servers
  }

  refreshCache(server: EmailServer) {
    let activeServers = this.getLoggedInServers(this.servers)
    if(!activeServers.includes(server)){
      return;
    }
    let serverForceReload = activeServers.map<EmailServerQueryInput>(s => ({server: s, forceReload: s == server}))
    AuthService.getEmailsFromServers(serverForceReload, this).subscribe(emails => {
      this.emailChange.emit(emails)
    });
  }

}

interface EmailQueryResponse{
  data: Array<Email>
  cacheDate: string
}

interface EmailServerQueryInput{
  server:EmailServer
  forceReload: boolean
}
