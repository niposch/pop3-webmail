import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Frontend';
  navOpened: boolean = true;
  selected: string = "";

  test() {
    console.log('test');
  }
}
