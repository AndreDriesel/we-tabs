import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, ModalController, NavParams } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import firebase from 'firebase/app';

@Component({
  selector: 'app-verification-modal',
  templateUrl: './verification-modal.page.html',
  styleUrls: ['./verification-modal.page.scss'],
})
export class VerificationModalPage implements OnInit {
  phoneNumber: string;
  appVerifier: any;
  confirmResult: firebase.auth.ConfirmationResult;

  verificationCode: string;

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private actionSheetCtrl: ActionSheetController,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.phoneNumber = this.navParams.get('phoneNumber');
    this.appVerifier = this.navParams.get('appVerifier');
    this.confirmResult = this.navParams.get('confirmResult');

  }

  close(res?) {
    this.modalCtrl.dismiss(res);
  }

  verifyCode() {
    this.confirmResult.confirm(this.verificationCode)
      .then(async res => {
        const user = res.user;

        if (res.additionalUserInfo.isNewUser) {
          await this.authService.addUser(user.uid, {
            id: user.uid,
            phone: user.phoneNumber
          });
          console.log('is new user');
          this.close();
          this.router.navigateByUrl('/account-setup');
        } else {
          console.log('is old user');
          this.close();
          this.router.navigateByUrl('/groups');
        }
      });
  }

  async showOptions() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `Didn't receive SMS?`,
      buttons: [{
        text: 'Resend SMS',
        handler: () => {
          this.close(this.phoneNumber);
        }
      }, {
          text: 'Change Phone Number',
          handler: () =>  {
            this.modalCtrl.dismiss();
          }
      }]
    });

    actionSheet.present();
  }

}
