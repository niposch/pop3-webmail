import { Component, OnInit } from '@angular/core';
import {EmailServer} from "../../Models/EmailServer";
import {AuthService} from "../auth.service";

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {
  servers: Array<EmailServer> | null = null;

  constructor(readonly authService:AuthService) { }

  ngOnInit(): void {
    this.servers = this.authService.getAllServers()
    this.authService.serverChange.subscribe((servers) =>
      this.servers = servers
    )
  }

}
