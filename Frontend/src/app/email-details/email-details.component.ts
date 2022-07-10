import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Email} from "../../Models/Email";
import {DomSanitizer} from "@angular/platform-browser";
import DOMPurify from 'dompurify';


@Component({
  selector: 'app-email-details',
  templateUrl: './email-details.component.html',
  styleUrls: ['./email-details.component.scss']
})
export class EmailDetailsComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<EmailDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Email,
              private sanitizer:DomSanitizer) {
    console.log(data)
    this.data.body = this.data.body.replace(/(?:\r\n|\r|\n)/g, '<br>');
  }

  ngOnInit(): void {

  }
}
