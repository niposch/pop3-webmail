import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Email} from "../../Models/Email";
import {DomSanitizer} from "@angular/platform-browser";
import DOMPurify from 'dompurify';
import {extractEmail, extractName} from "../../helper/EmailAddressHelper";


@Component({
  selector: 'app-email-details',
  templateUrl: './email-details.component.html',
  styleUrls: ['./email-details.component.scss']
})
export class EmailDetailsComponent implements OnInit {

  displayHeaders:boolean = true;
  displayedColumns= ["name", "value"];
  dataSource: Array<Array<string>> = [];
  constructor(public dialogRef: MatDialogRef<EmailDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Email,
              private sanitizer:DomSanitizer) {
    console.log(data)
    if (data.body != null) {
      // this.data.body = this.data.body.replace(/(?:\r\n|\r|\n)/g, '<br>');
    }
    if (data.headers != null) {
      // @ts-ignore
      this.dataSource = Array.from(Object.keys(this.data.headers)).map(key => [key, this.data.headers[key]]);
    }
  }

  ngOnInit(): void {

  }
  toMailto(email:string){
    return "mailto:" + email;
  }
  extractName(sender: Array<string>) {
    return extractName(sender)
  }

  extractEmail(sender: Array<string>) {
    return extractEmail(sender);
  }
}
