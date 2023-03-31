import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  AnimationController,
  Animation,
  MenuController,
  ModalController,
} from '@ionic/angular';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';

import { map, take, debounceTime } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

// import { AGBModal } from '../../modals/agb/agb.modal';

import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  animations: [
    trigger('slide-in-right', [
      transition(':enter', [
        style({ transform: 'translateX(90%)', opacity: 0 }),
        animate(
          '300ms ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
      /**transition(':leave',
          [style({ transform: 'translateX(0)', opacity: 1 }),
          animate('300ms ease-out', style({ transform: 'translateX(-90%)', opacity: 0 }))])*/
    ]),
    trigger('slide-rin-lout', [
      transition(':enter', [
        style({ transform: 'translateX(90%)', opacity: 0 }),
        animate(
          '300ms ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate(
          '300ms ease-out',
          style({ transform: 'translateX(-90%)', opacity: 0 })
        ),
      ]),
    ]),
  ],
})
export class LoginPage implements OnInit, AfterViewInit {
  unsplashRaw =
    'https://api.unsplash.com/search/photos?client_id=tJSdvfp1hBLUttjXttSNkCUqaAKY9-QuSYw16AAjyXs&page=1&per_page=20';
  row1: any;
  row2: any;
  row3: any;
  anim!: Animation;
  @ViewChild('divrow1', { static: false }) divrow1!: ElementRef;
  @ViewChild('divrow2', { static: false }) divrow2!: ElementRef;
  @ViewChild('divrow3', { static: false }) divrow3!: ElementRef;
  site = 'home';
  emailSignUpForm!: FormGroup;
  emailSignInForm!: FormGroup;
  email!: string;
  password!: string;
  passwordConfirm!: string;
  errorMessage = '';
  successMessage = '';
  validationMessages = {
    email: [
      { type: 'required', message: 'Email-Adresse erforderlich' },
      { type: 'pattern', message: 'keine gültige E-Mail-Adresse' },
      { type: 'emailTaken', message: 'E-Mail-Adresse ist bereits vergeben' },
    ],
    password: [
      { type: 'required', message: 'Passwort erforderlich' },
      {
        type: 'minlength',
        message: 'Passwort muss mindestens 6 Zeichen lang sein',
      },
    ],
  };
  confirmedPasswordError = '';

  // just for testing
  visible = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private animationCtrl: AnimationController,
    private menuController: MenuController,
    private httpClient: HttpClient,
    public router: Router,
    private formBuilder: FormBuilder,
    public modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.loadImages();
    this.initForms();
  }

  ionViewWillEnter() {
    this.menuController.enable(false);
  }

  ngAfterViewInit() {
    /**this.anim = this.animationCtrl.create('myAnim');
    this.anim.addElement(this.divrow1.nativeElement)
      .duration(30000)
      .easing('ease-out')
      .iterations(Infinity)
      .fromTo('transform', 'translatey(0px)', 'translateY(200px)')
    this.anim.play()*/
    const speed = 60000;
    this.animUp(this.divrow1, speed);
    this.animDown(this.divrow2, speed);
    this.animUp(this.divrow3, speed);
  }

  animUp(element: any, speed: number) {
    this.anim = this.animationCtrl.create('myAnim');
    this.anim
      .addElement(element.nativeElement)
      .duration(speed)
      // .easing('ease-out')
      .iterations(Infinity)
      .keyframes([
        { offset: 0, transform: 'translatey(0px)' },
        { offset: 0.5, transform: 'translateY(20vh)' },
        { offset: 1, transform: 'translatey(0px)' },
      ]);
    // .fromTo('transform', 'translatey(0px)', 'translateY(20vh)')
    this.anim.play();
  }

  animDown(element: any, speed: number) {
    this.anim = this.animationCtrl.create('myAnim');
    this.anim
      .addElement(element.nativeElement)
      .duration(speed)
      // .easing('ease-out')
      .iterations(Infinity)
      // .fromTo('transform', 'translatey(20vh)', 'translateY(0px)')
      .keyframes([
        { offset: 0, transform: 'translatey(20vh)' },
        { offset: 0.5, transform: 'translateY(0vh)' },
        { offset: 1, transform: 'translatey(20vh)' },
      ]);
    this.anim.play();
  }

  loadImages() {
    const unsplashlink = this.unsplashRaw + '&query=electronics';
    const unsplash: any = this.httpClient.get(unsplashlink);
    unsplash.subscribe((data: any) => {
      console.log(data);
      const result = data.results;
      this.row1 = data.results.slice(0, 6);
      this.row2 = data.results.slice(6, 12);
      this.row3 = data.results.slice(12, 18);
      console.log(this.row1, this.row2, this.row3);
    });
  }

  initForms() {
    this.emailSignUpForm = this.formBuilder.group(
      {
        email: new FormControl(
          '',
          Validators.compose([
            Validators.required,
            Validators.pattern(
              '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$'
            ),
            Validators.email,
          ]),
          this.proofEmail.bind(this)
        ),
        password: new FormControl(
          '',
          Validators.compose([Validators.minLength(6), Validators.required])
        ),
        confirm_password: new FormControl(
          '',
          Validators.compose([Validators.required])
        ),
      },
      {
        validator: this.confirmedValidator('password', 'confirm_password'), // , updateOn: 'blur'
      }
    );
    this.emailSignInForm = this.formBuilder.group({
      email: new FormControl(
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$'),
          Validators.email,
        ])
      ),
      password: new FormControl(
        '',
        Validators.compose([Validators.minLength(6), Validators.required])
      ),
    }); //, { updateOn: 'blur' });
  }

  confirmedValidator(controlName: string, matchingControlName: string) {
    console.log('check pws');
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];
      if (
        matchingControl.errors &&
        !matchingControl.errors['confirmedValidator'] // !matchingControl.errors.[confirmedValidator]
      ) {
        return;
      }
      if (control.value !== matchingControl.value) {
        console.log('not equal');
        matchingControl.setErrors({ confirmedValidator: true });
        this.confirmedPasswordError = 'Passwörter stimmen nicht überein.';
      } else {
        console.log('equal');
        matchingControl.setErrors(null);
        this.confirmedPasswordError = '';
      }
    };
  }

  proofEmail(control: AbstractControl) {
    const email = control.value.toLowerCase();
    return this.userService.getUsersByEmail(email);
    /**return this.userService.getUsersByEmail(email).subscribe(data => {
      console.log(data);
      return data;
    });*/
  }

  setSite(site: string) {
    this.site = site;
  }

  signUpWithEmail(formData: any) {
    const email = formData.email;
    const password = formData.password;
    this.authService.registerWithEmail(email, password).then(
      async (res) => {
        console.log(res);
        this.setUserAndRoute(res);
      },
      (err) => {
        console.log(err);
      }
    );
  }

  signInWithEmail(formData: any) {
    if (this.emailSignInForm.valid) {
      const email = formData.email.toLowerCase();
      const password = formData.password;
      this.authService.signInWithEmail(email, password).then(async (res) => {
        console.log(res);
        if (res instanceof Object) {
          this.router.navigateByUrl('/groups');
        }
      });
    } else {
    }
  }

  async googleSignIn() {
    this.authService.googleSignIn().then(
      async (res) => {
        console.log(res);
        this.setUserAndRoute(res);
      },
      (err) => {
        console.log(err);
      }
    );
  }

  facebookSignIn() {
    this.authService.facebookSignIn().then(
      async (res) => {
        console.log(res);
        this.setUserAndRoute(res);
      },
      (err) => {
        console.log(err);
      }
    );
  }

  async setUserAndRoute(res: any) {
    console.log('set user and route');
    const user = res.user;
    if (res.additionalUserInfo?.isNewUser) {
      const data = {
        uid: user.uid,
        userID: user.uid,
        phone: user.phoneNumber,
        email: user.email,
        blacklist: null,
        whitelist: null,
        privacy: 'all',
      };
      await this.authService.addUser(user.uid, data);
      console.warn('is new user');
      this.router.navigateByUrl('/account-setup');
    } else {
      console.warn('is old user');
      this.router.navigateByUrl('/groups');
    }
  }

  toggleVis() {
    this.visible = !this.visible;
  }

  async agbModal(type: string) {
    /**
    const modal = await this.modalCtrl.create({
      component: AGBModal,
      componentProps: {
        type,
      },
    });
    modal.present();*/
  }
}

/**
Index:
0 - Anmelden / Registrieren
1 - Anmelden (Email, Google, Apple, MS, Facebook)
2 - Registrieren (Email, Google, Apple, MS, Facebook)
3 - Registrieren Email (reset password)
4 - Anmelden Email
 */

/**  proofNumber() {
   if (this.phoneNumber && this.phoneNumber.length >= 11 && this.selectedCountry.code) {
     this.hasPhone = true;
   } else { this.hasPhone = false; }
   console.log(this.hasPhone);
 }

 proofCode() {
   this.hasCode = (this.verificationCode.length === 6) ? true : false;
 }

 async loginWithPhoneNumber() {
   const loading = await this.loadingCtrl.create();
   loading.present();

   this.formatedNumber = parseInt(this.phoneNumber.replace(/\s/g, ''), 10);
   let phoneNumber = `${this.selectedCountry.code}${this.formatedNumber}`.match(/[0-9]{0,14}/g) as any;
   phoneNumber = `+${phoneNumber.join('')}`;

   this.authService.signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier)
     .then(async confirmationResult => {
       loading.dismiss();
       this.confirmResult = confirmationResult;
       this.slideNext();
     });
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
         this.router.navigateByUrl('/account-setup');
       } else {
         console.log('is old user');
         this.router.navigateByUrl('/groups');
       }
     }, (err) => {
       console.log(err);
     });
 }

 /** onInputNumber(event: any) {
   this.formatedNumber = this.formatPhoneNumber(event.target.value, event.detail.inputType);
 }

 private formatPhoneNumber(numberStr: string, inputType = 'insertText') {
   if (inputType !== 'insertText') {
     return numberStr;
   }

   if (numberStr.length === 4) { // text with backspace event
     return `${numberStr.slice(0, 3)} ${numberStr.slice(-1)}`;
   }

   if (numberStr.length === 5 && numberStr.slice(-1) !== ' ') { // text with backspace event
     return `${numberStr.slice(0, 4)} ${numberStr.slice(-1)}`;
   }

   return numberStr;
 } */

/**async showCountriesModal() {
  const modal = await this.modalCtrl.create({
    component: CountriesModalPage
  });
  modal.present();

  modal.onDidDismiss().then(res => {
    this.selectedCountry = res.data || this.selectedCountry;
    this.proofNumber();
  });
}

async veriModal() {
  const modal = await this.modalCtrl.create({
    component: VerificationModalPage
  });
  modal.present();
}

*/
