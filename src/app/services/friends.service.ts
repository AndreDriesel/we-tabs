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
  deleteField,
} from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { DbService } from './db.service';
import { Auth, user } from '@angular/fire/auth';
import { BehaviorSubject, Subscription } from 'rxjs';

import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  colName = 'friends';
  friendsData: any;
  friendsSubject: BehaviorSubject<any> = new BehaviorSubject('');
  friendsSubscription?: Subscription;

  constructor(
    private afs: Firestore,
    private storage: Storage,
    public db: DbService,
    public afAuth: Auth,
    private userService: UserService
  ) {}

  loadFriends(uid: string) {
    const colRef = collection(this.afs, 'users');
    const q = query(colRef, where('uid', '!=', uid));
    const col = collectionData(q, { idField: 'id' });
    return col;
  }

  subscribeToFriends(uid: string) {
    this.friendsSubscription = this.loadFriends(uid).subscribe((data) => {
      console.log('friendsData', data);
      console.warn('CHANGE friendsData, currently users-collection!!!');
      data = data.filter((user) => {
        return user.active === true && user.username?.length > 0 ? user : null;
      });
      this.friendsData = data;
      this.friendsSubject.next({ data });
    });
  }

  unsubscribeToFriends() {
    this.friendsSubscription?.unsubscribe();
  }

  getFriends() {
    return this.friendsSubject.asObservable();
  }

  async getFriendData(uid: string) {
    const currentUser = this.userService.currentUserData;
    const friendData =
      uid === currentUser.uid
        ? currentUser
        : this.friendsData.filter(
            (f: any) =>
              JSON.stringify(f.uid)
                .toLowerCase()
                .indexOf(uid.toLowerCase().trim()) > -1
          )[0];
    return friendData || (await this.userService.getUserByIdPromise(uid));
  }

  async addFriend(fuid: string) {
    const ouid = this.userService.currentUserData.uid;
    const ownFriendsObject = {
      fuid: 2,
    }; // ownFriendsObject[fuid] = 2; // 1 = friends, 2 = you invited, 3 = you got invited
    const friendsObject = {
      ouid: 3,
    }; // friendsObject[ouid!] = 3
    const ownData = { uid: ouid, friends: ownFriendsObject };
    const friendsData = { uid: fuid, friends: friendsObject };
    return this.db.set('friends', ouid!, ownData, { merge: true }).then(() => {
      return this.db.set('friends', fuid, friendsData, { merge: true });
    });
  }

  // path for follower `${this.colName}/${groupId}`
}

export interface Friends {
  uid?: string;
  friends?: {};
  active?: boolean; // delete later
  username?: string;
}

export interface FriendsDoc {
  fuid?: string;
  status?: number; // 1 = friends, 2 = you invited, 3 = you got invited
}

/**async testGetFriendData(uid: string) {
    const currentUser = this.userService.currentUserData;
    const friendData = (uid === currentUser.uid) ? currentUser : this.friendsData
      .filter(f => JSON.stringify(f.uid).toLowerCase().indexOf(uid.toLowerCase().trim()) > -1)[0];
    const res = friendData?.lenght > 0 ? friendData : await this.getUserData(uid);
    return res;
  }

  getUserData(uid: string) {
    return new Promise((resolve, reject) => {
      this.get('users', uid).toPromise().then(res => {
        const userData = res.data();
        resolve(userData);
      });
    });
  }*/
