import {Component, OnInit, Pipe, PipeTransform} from '@angular/core';
import {AuthService} from "../auth.service";
import {EmailServer} from "../../Models/EmailServer";
import {Email} from "../../Models/Email";
import {MatTableDataSource} from "@angular/material/table";
import {EmailDetailsComponent} from "../email-details/email-details.component";
import {MatDialog} from "@angular/material/dialog";
import {DomSanitizer} from "@angular/platform-browser";
import DOMPurify from "dompurify";
import {extractName, extractEmail} from "../../helper/EmailAddressHelper";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  dataSource:MatTableDataSource<Email> = new MatTableDataSource<Email>();
  displayedColumns: string[] = ['sender', 'subject', "date", "receiver"]
  isLoading: boolean = true;
  constructor(private readonly authService:AuthService, public dialog: MatDialog) {
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

  displayEmailPopup(email:Email) {
    this.dialog.open(EmailDetailsComponent, {data: email})
  }

  extractEmail(sender: any) {
    return extractEmail(sender);
  }
  extractName(sender: any) {
    return extractName(sender);
  }
}

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {

  constructor(protected sanitizer: DomSanitizer) {}

  public transform(value: any): any {
    const sanitizedContent = DOMPurify.sanitize(value);
    return this.sanitizer.bypassSecurityTrustHtml(sanitizedContent);

  }
}
