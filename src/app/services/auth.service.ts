import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

/**import firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';*/
import {
  Auth,
  user,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  OAuthProvider,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  ApplicationVerifier,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
// import { AngularFireStorage } from '@angular/fire/compat/storage';

import { Observable, of } from 'rxjs';
import { take, map } from 'rxjs/operators';

import { FirebaseService } from './firebase.service';
import { GroupService } from './group.service';
import { UserService } from './user.service';
import { GiftService } from './gift.service';
import { FriendsService } from './friends.service';
import { ParticipationService } from './participation.service';
import { NotificationsService } from './notifications.service';
import { FcmService } from './fcm.service';

import { BehaviorSubject, Subscription } from 'rxjs';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({ providedIn: 'root' })
export class AuthService {
  colName = 'users';
  user!: Observable<User>;
  userSubscription: Subscription | undefined;
  subscribedToData = false;
  currentUserData: User | undefined;
  currentUserSubject: BehaviorSubject<any> = new BehaviorSubject('');
  subscriptions: Subscription | undefined;

  errorCodes = [
    { code: 'auth/invalid-email', msg: 'ungültige Email-Adresse' },
    {
      code: 'auth/email-already-exists',
      msg: 'Email-Adresse wurde bereits registriert',
    },
    { code: 'auth/weak-password', msg: 'schwaches Passwort' },
    { code: 'auth/wrong-password', msg: 'falsches Passwort' },
    { code: 'auth/invalid-password', msg: 'ungültiges Passwort' },
    {
      code: 'auth/user-not-found',
      msg: 'keine Registrierung für diese Email-Adresse',
    },
  ];

  constructor(
    private afAuth: Auth,
    afs: Firestore,
    private router: Router,
    // storage: AngularFireStorage,
    private giftService: GiftService,
    private groupService: GroupService,
    private userService: UserService,
    private fcmService: FcmService,
    private friendsService: FriendsService,
    private participationsService: ParticipationService,
    private notificationsService: NotificationsService,
    private toastCtrl: ToastController,
    private deviceService: DeviceDetectorService,
    private fbs: FirebaseService<any>
  ) {
    // super(afs, storage);
    //// Get auth data, then get firestore user document || null

    const userData = this.afAuth.onAuthStateChanged((user) => {
      console.log('authStateChanged res: ', user);
      if (user) {
        this.userService.uid = user.uid;
        this.startSubscription(user.uid);
        return this.fbs.doc(`users/${user.uid}`);
      } else {
        this.endSubscription();
        return of(null);
      }
    });
  }

  subscribeToCurrentUser(uid: string) {
    this.userSubscription = this.fbs.doc(`users/${uid}`).subscribe((data) => {
      this.currentUserData = data;
      console.log(data);
      this.currentUserSubject.next({ data });
    });
  }

  async signInWithPhoneNumber(
    phoneNumber: string,
    appVerifier: ApplicationVerifier
  ) {
    return await signInWithPhoneNumber(this.afAuth, phoneNumber, appVerifier);
  }

  async signInWithEmail(email: string, password: string) {
    return await signInWithEmailAndPassword(this.afAuth, email, password).catch(
      (error) => {
        // Handle Errors here.
        this.showError(error);
        /**const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
          this.errorToast('Falsches Passwort');
        } else {
          this.errorToast(errorMessage);
        }*/
        // console.log(error);
      }
    );
  }

  async registerWithEmail(email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(
      this.afAuth,
      email,
      password
    );
    // await updateProfile(credential.user, { displayName: credential.user.displayName });
    await sendEmailVerification(credential.user);
    /**return await createUserWithEmailAndPassword(this.afAuth, email, password).then((user) => {
      this.sendEmailVerification();
      // console.log(user);
      return user;
    }).catch(error => {
      this.showError(error);
      const errorCode = error.code;
      const errorMessage = error.message;
      if (errorCode === 'auth/weak-password') { this.errorToast('Passwort ist zu schwach'); }
      if (errorCode === 'auth/auth/invalid-email') { this.errorToast('ungültige Email-Adresse'); }
      else {
        this.errorToast(errorMessage);
      }*/
  }

  async sendPasswordResetEmail(email: string) {
    await sendPasswordResetEmail(this.afAuth, email);
  }

  async googleSignIn() {
    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    return await signInWithPopup(this.afAuth, googleProvider)
      .then((result) => {
        const details = getAdditionalUserInfo(result);
        console.log(result, details);
        const res = {
          user: result,
          additionalUserInfo: details,
        };
        return res;
      })
      .catch((error) => {
        console.error(error);
        return error;
      });
  }

  async facebookSignIn() {
    const provider = new FacebookAuthProvider();
    return await signInWithPopup(this.afAuth, provider);
  }

  async oAuthLogin(p: string): Promise<void> {
    const provider = new OAuthProvider(p);
    const credential = await signInWithPopup(this.afAuth, provider);
    const additionalInfo = getAdditionalUserInfo(credential);
    if (additionalInfo?.isNewUser) {
    }
  }

  async signOut() {
    this.groupService.unsubscribeToGroups();
    await signOut(this.afAuth).then(() => {
      // console.log('signed out, now routing');
      this.router.navigateByUrl('/login');
    });
  }

  addUser(uid: string, data: User) {
    data.createdAt = serverTimestamp();
    data.active = true;
    return this.fbs.set(this.colName, uid, data);
  }

  uid() {
    return this.user
      .pipe(
        take(1),
        map((u) => u && u.uid)
      )
      .toPromise();
  }

  startSubscription(uid: string) {
    if (!this.subscribedToData) {
      this.subscriptions = new Subscription();
      const isMobile = this.deviceService.isMobile();
      const fcmSub = this.deviceService.isDesktop()
        ? this.fcmService.webPermission(uid)
        : this.fcmService.nativePermission(uid);
      this.subscriptions.add(fcmSub);
      const userSub = this.userService.subscribeToCurrentUser(uid);
      this.subscriptions.add(userSub);
      const groupsSub = this.groupService.subscribeToGroups(uid);
      this.subscriptions.add(groupsSub);
      const invitesSub = this.groupService.subscribeToInvites(uid);
      this.subscriptions.add(invitesSub);
      const friendsSub = this.friendsService.subscribeToFriends(uid);
      this.subscriptions.add(friendsSub);
      const participationsSub =
        this.participationsService.subscribeToPartByUser(uid);
      this.subscriptions.add(participationsSub);
      const privateIdeasSub = this.giftService.subscribeToPrivatIdeas(uid);
      this.subscriptions.add(privateIdeasSub);
      const notificationsSub =
        this.notificationsService.subscribeToNotifications(uid);
      this.subscriptions.add(notificationsSub);
      // this.contactService.subscribeToContacts();
      this.subscribedToData = true;
      console.log('subscribing to groups and contacts');
    } else {
      console.log('still subscribed to groups and contacts');
    }
  }

  showError(error: any) {
    const errmsg =
      this.errorCodes.find((e) => e.code === error.code)?.msg || error.message;
    this.errorToast(errmsg);
    console.log(errmsg);
  }

  async errorToast(text: string) {
    const toast = await this.toastCtrl.create({
      message: text,
      position: 'top',
      duration: 2000,
      color: 'danger',
    });
    toast.present();
  }

  endSubscription() {
    if (this.subscribedToData) {
      this.subscribedToData = false;
      this.subscriptions?.unsubscribe();
      /**this.userService.unsubscribeToCurrentUser();
      this.groupService.unsubscribeToGroups();
      this.groupService.unsubscribeToInvites();
      this.friendsService.unsubscribeToFriends();
      this.participationsService.unsubscribeToPartByUser();
      this.giftService.unsubscribeToPrivatIdeas();
      this.notificationsService.unsubscribe();*/
      console.log('unsubscribe to all subscriptions');
    }
  }
}

export interface User {
  active?: true;
  id?: string;
  uid?: string;
  userID?: string;
  name?: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  role?: string;
  status?: string;
  groups?: any;
  isAdmin?: boolean;
  createdAt?: any;
}
