import { Component, OnInit } from '@angular/core';
import {AuthService} from "../auth.service";
import {Router} from "@angular/router";
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  displayName: string = "";
  url: string = "";
  password: string = "";
  userName: string = "";
  useSSL:boolean = false;

  constructor(private readonly authService:AuthService, private readonly router:Router,
              public loginRef: MatDialogRef<LoginComponent>) { }

  ngOnInit(): void {
  }

  submit() {
    this.authService.login(this.userName, this.password, this.url, this.displayName, "", this.useSSL).subscribe({
      next:() => {
        this.loginRef.close();
      },
      error:(e) => {
        console.log(e)
        alert("Login failed")
      }
    });

  }
  onCancel() {
    this.loginRef.close();
  }
}
