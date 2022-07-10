import { Component, OnInit } from '@angular/core';
import {EmailServer} from "../../Models/EmailServer";
import {AuthService} from "../auth.service";
import {MatDialog} from "@angular/material/dialog";
import {LoginComponent} from "../login/login.component";

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {
  servers: Array<EmailServer> | null = null;

  constructor(readonly authService:AuthService, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.servers = this.authService.getAllServers()
    this.authService.serverChange.subscribe((servers) =>
      this.servers = servers
    )
  }

  openLogin() {
    const loginRef = this.dialog.open(LoginComponent, {})
    loginRef.afterClosed().subscribe(result => {
      this.authService.loadServers();
    });
  }
}
