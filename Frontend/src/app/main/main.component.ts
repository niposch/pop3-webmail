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

  dataSource:MatTableDataSource<Email> = new MatTableDataSource<Email>();
  displayedColumns: string[] = ['sender', 'subject', "date", "receiver"]
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

  extractName(sender: Array<string>): string {
    if (sender.length == 0) {
      return "";
    }
    return sender[0]
  }

  extractEmail(sender: Array<string>):string {

    if (sender == null || sender == undefined || sender.length == 0) {
      return "";
    }
    if(sender.length == 1) {
      return sender[0]
    }
    return sender[1]

  }

  displayEmailPopup(row:Email) {
    console.log(row)
  }
}
