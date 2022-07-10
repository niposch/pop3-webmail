import { Component, OnInit } from '@angular/core';
import {AuthService} from "../auth.service";
import {Router} from "@angular/router";

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

  constructor(private readonly authService:AuthService, private readonly router:Router ) { }

  ngOnInit(): void {
  }

  submit() {
    this.authService.login(this.userName, this.password, this.url, this.displayName, "", this.useSSL).subscribe({
      next:() => {
        this.router.navigate(["/"], {})

      },
      error:(e) => {
        console.log(e)
        alert("Login failed")
      }
    });

  }
}
