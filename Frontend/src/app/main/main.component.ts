import { Component, OnInit } from '@angular/core';
import {AuthService} from "../auth.service";
import {EmailServer} from "../../Models/EmailServer";
import {Email} from "../../Models/Email";
import {MatTableDataSource} from "@angular/material/table";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  dataSource = new MatTableDataSource<Email>();
  displayedColumns: string[] = ['sender', 'subject', "date"]
  isLoading: boolean = true;
  constructor(private readonly authService:AuthService) {
    this.authService.serverChange.subscribe((servers:EmailServer[]) => {
      if(servers.length == 0){
        this.isLoading = false;
      }
    })
    if(this.authService.getAllServers().length == 0){
      this.isLoading = false;
    }
    this.authService.emailChange.subscribe((emails) => {
      this.dataSource.data = emails
      this.isLoading = false;
    })
  }

  ngOnInit(): void {
  }

  extractName(sender: string): string {
    return sender.split("<")[0];
  }
}
