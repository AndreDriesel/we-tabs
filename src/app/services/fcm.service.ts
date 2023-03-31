import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Firestore } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import {
  Messaging,
  getToken,
  deleteToken,
  onMessage,
  getMessaging,
} from '@angular/fire/messaging';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { take } from 'rxjs/operators';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
  providedIn: 'root',
})
export class FcmService extends FirebaseService<any> {
  token: string = '';

  constructor(
    afs: Firestore,
    private afMessaging: Messaging,
    private afFunctions: Functions,
    storage: Storage,
    private deviceService: DeviceDetectorService
  ) {
    super(afs, storage);
  }

  webPermission(uid: string) {
    getToken(this.afMessaging).then(
      (token) => {
        console.log('Permission granted! Save to the server!', token);
        this.token = token;
        console.log(this.token);
        this.saveToken(token, uid);
        this.getMessages();
      },
      (error) => {
        console.error(error);
      }
    );
    /**this.afMessaging.requestPermission
      .subscribe(
        (token) => {
          console.log('Permission granted! Save to the server!', token);
          this.token = token;
          console.log(this.token);
          this.saveToken(token, uid);
          this.getMessages();
        },
        (error) => { console.error(error); },
      );*/
  }

  nativePermission(uid: string) {
    console.log('requesting native permission');
    PushNotifications.requestPermissions().then((result: any) => {
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      } else {
        // Show some error
      }
    });

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', (token: Token) => {
      alert('Push registration success, token: ' + token.value);
      this.saveToken(token.value, uid);
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error: any) => {
      alert('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        alert('Push received: ' + JSON.stringify(notification));
      }
    );

    // Method called when tapping on a notification
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        alert('Push action performed: ' + JSON.stringify(notification));
      }
    );
  }
  saveToken(token: string, uid: string) {
    console.log('proof tokens existence');
    // FirebaseUser user = await _auth.currentUser();
    // Get the token for this device
    const fcmToken = token;
    this.doc(`users/${uid}/tokens/${token}`)
      .pipe(take(1))
      .subscribe((t) => {
        if (t) {
          console.log('token exists');
        } else {
          console.log('token doesn`t exists - saving token');
          const tokenData = {
            token,
            createdAt: this.timestamp,
            browser: this.deviceService.getDeviceInfo().browser,
            os: this.deviceService.getDeviceInfo().os,
            os_version: this.deviceService.getDeviceInfo().os_version,
          };
          this.set(`users/${uid}/tokens`, token, tokenData);
        }
      });
  }

  deleteToken() {
    if (this.token) {
      deleteToken(this.afMessaging).then((res) => {
        console.log('deleted token, res: ', res);
      });
      // this.afMessaging.deleteToken(this.token)
      //  .subscribe((res) => { console.log('deleted token, res: ', res); });
    }
  }

  sub(topic: string) {
    httpsCallable(
      this.afFunctions,
      'subscribeToTopic'
    )({ topic, token: this.token }).then((_) =>
      console.log(`subscribed to ${topic}`)
    );
    /**this.afFunctions
      .httpsCallable('subscribeToTopic')({ topic, token: this.token })
      .pipe(tap(_ => console.log(`subscribed to ${topic}`)))
      .subscribe();*/
  }

  unsub(topic: string) {
    httpsCallable(
      this.afFunctions,
      'unsubscribeToTopic'
    )({ topic, token: this.token }).then((_) =>
      console.log(`unsubscribed to ${topic}`)
    );
    /** this.afFunctions
      .httpsCallable('unsubscribeToTopic')({ topic, token: this.token })
      .pipe(tap(_ => console.log(`unsubscribed from ${topic}`)))
      .subscribe();*/
  }

  getMessages() {
    console.log('getMessages: listen for messages');
    getMessaging();
    // this.afMessaging.messages.subscribe(async (msg: any) => {
    //   console.log(msg);
    // });
  }
}
