import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Platform, NavController } from '@ionic/angular';
// import { SplashScreen } from '@ionic-native/splash-screen/ngx';
// import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  user: any;
  subToContactsAndGroups: boolean = false;
  constructor(
    private platform: Platform,
    // private splashScreen: SplashScreen,
    // private statusBar: StatusBar,
    public authService: AuthService,
    private userService: UserService,
    private router: Router,
    private navController: NavController
  ) {
    this.initializeApp();
    this.subToContactsAndGroups = false;
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // this.statusBar.styleDefault();
      // this.splashScreen.hide();
      this.loadUserData();
    });
  }

  logout() {
    // console.log('do logout');
    // this.router.navigateByUrl('/login');
    this.authService.signOut();
  }

  loadUserData() {
    // this.userService.subscribeToCurrentUser();
    this.userService.getCurrentUser().subscribe((res) => {
      console.log(res);
      if (res && res?.data && res?.data.userID) {
        // this.loadGroupsAndContacts();
        this.user = res.data;
        // console.log(this.user);
        if (
          !this.user.name ||
          this.user.name.length < 1 ||
          !this.user.username
        ) {
          console.log('routing to account-setup');
          this.router.navigateByUrl('/account-setup');
        }
      } else {
        /**console.log('no res.data.userID');*/
      }
    });
  }
}
