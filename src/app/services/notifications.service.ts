import { Injectable } from '@angular/core';
import {
  Firestore,
  Timestamp,
  doc,
  docData,
  DocumentData,
  collection,
  collectionData,
  query,
  where,
  orderBy,
  WhereFilterOp,
} from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { DbService } from './db.service';
import {
  of,
  combineLatest,
  BehaviorSubject,
  Subscription,
  Observable,
} from 'rxjs';

import { CommonService } from './common.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  colName = 'push-notifications';
  colNameGroupInvites = 'push-group-invites';
  colNameLikes = 'push-likes';
  colNamePayments = 'push-payments';
  colMembers = 'members';
  invites!: any[];
  notificationsSub!: Subscription;
  notificationsData: any;
  notificationsSubject: BehaviorSubject<any> = new BehaviorSubject('');
  invitesSubject: BehaviorSubject<any> = new BehaviorSubject('');

  constructor(
    private afs: Firestore,
    private storage: Storage,
    public db: DbService,
    public commonService: CommonService,
    private userService: UserService
  ) {}

  notificationsByUser(uid: string): Observable<any> {
    const colRef = collection(this.afs, this.colName);
    const q = query(
      colRef,
      where('recipientID', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const col = collectionData(q, { idField: 'id' });
    return col;
  }

  groupInvitesByUser(uid: string): Observable<Invite[]> {
    const colRef = collection(this.afs, this.colName);
    const q = query(
      colRef,
      where('uid', '==', uid),
      where('status', '==', 1),
      orderBy('createdAt', 'desc')
    );
    const col = collectionData(q, { idField: 'id' });
    return col;
  }

  likesByUser(uid: string) {
    const colRef = collection(this.afs, `${this.colName}/${uid}/likes`);
    const q = query(colRef);
    const col = collectionData(q, { idField: 'id' });
    return col;
  }

  subscribeToNotifications(uid: string) {
    const groupInvites$ = this.groupInvitesByUser(uid);
    const likes$ = this.likesByUser(uid);
    const notifications$ = this.notificationsByUser(uid);
    const user$ = this.userService.getCurrentUser();

    this.notificationsSub = combineLatest(
      groupInvites$,
      likes$,
      notifications$,
      user$
    ).subscribe(([invites, likes, notifications, user]) => {
      // console.log('invites:', invites, 'likes:', likes, 'notifications:', notifications, 'user:', user);
      if (invites) {
        invites.forEach((item) => {
          item.since = this.commonService.timeBetweenNow(
            item.createdAt.seconds * 1000
          );
          item.type = 'group-invite';
        });
        invites = this.commonService.sortByCreatedAt(invites);
      }
      const notesArray = [...invites, ...likes];
      // const notesArray = [...invites, ...likes, ...notifications];
      this.invites = invites;
      this.notificationsData = notesArray;
      this.notificationsSubject.next({ data: notesArray });
      this.invitesSubject.next({ data: invites });
    });

    /**this.notificationsSub = this.notificationsByUser(uid).subscribe(data => {
      console.log('notifications', data);
      data.forEach(item => {
        item.since = this.commonService.timeBetweenNow(item.createdAt.seconds * 1000);
      });
      this.notificationsData = data;
      this.notificationsSubject.next({ data });
    });*/
  }

  unsubscribe() {
    this.notificationsSub.unsubscribe();
  }

  getNotifications() {
    return this.notificationsSubject.asObservable();
  }

  getInvites() {
    return this.invitesSubject.asObservable();
  }

  addNot(notification: Notification) {
    notification.createdAt = this.db.timestamp;
    notification.updatedAt = this.db.timestamp;
    return this.db.add(this.colName, notification);
  }

  addInvitation(creatorID: string, recipientID: string, groupID: string) {
    const invitation = {
      createdAt: this.db.timestamp,
      updatedAt: this.db.timestamp,
      creatorID,
      recipientID,
      groupID,
    };
    return this.db.add(this.colName, invitation);
  }
}

export interface Notification {
  creatorID?: string;
  groupID?: string;
  recipientID?: string;
  type?: string;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

export interface Invite {
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
  presenteeData?: any;
  pushData?: any;
  status?: number;
  since?: string;
  type?: string;
}
