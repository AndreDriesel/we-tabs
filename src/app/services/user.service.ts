import { Injectable } from '@angular/core';
// import { AngularFirestore } from '@angular/fire/firestore';
// import { AngularFireStorage } from '@angular/fire/storage';
// import { AngularFireAuth } from '@angular/fire/auth';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  Timestamp,
  doc,
  docData,
  collection,
  collectionData,
  where,
  query,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { switchMap } from 'rxjs/operators';
import {
  of,
  BehaviorSubject,
  Subject,
  Subscription,
  merge,
  Observable,
} from 'rxjs';
import { take, filter, debounceTime, map, first } from 'rxjs/operators';
import { DbService } from './db.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  colName = 'users';
  colNameAlgolia = 'algolia-users';
  currentUserData!: User;
  currentUserSubject: BehaviorSubject<any> = new BehaviorSubject('');
  uid!: string;
  userSubscription!: Subscription;
  usernameSearch = new Subject<string>();

  constructor(
    public afs: Firestore,
    public afAuth: Auth,
    public db: DbService
  ) {}

  get currentUser() {
    return user(this.afAuth).pipe(
      switchMap((auth) => (auth ? this.getUserById(auth.uid) : of(null)))
    );
  }

  currentSignedUser() {
    return user(this.afAuth).pipe(
      switchMap((auth) => (auth ? this.getUserById(auth.uid) : of(null)))
    );
  }

  subscribeToCurrentUser(uid: string) {
    this.userSubscription = docData(doc(this.afs, 'users', uid)).subscribe(
      (data) => {
        // this.doc(`users/${uid}`).subscribe(data => {
        this.currentUserData = data;
        // console.log(this.currentUserData);
        this.currentUserSubject.next({ data });
      }
    );
  }

  unsubscribeToCurrentUser() {
    console.log('unsubscribing to userSubscription');
    this.userSubscription.unsubscribe();
  }

  getCurrentUser(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  get users() {
    const colRef = collection(this.afs, this.colName);
    const q = query(
      colRef,
      where('active', '==', true),
      where('uid', '!=', this.currentUserData.uid)
    );
    const col = collectionData(q, { idField: 'id' });
    return col;
  }

  getUsersInGroup(groupID: string) {
    const colRef = collection(this.afs, this.colName);
    const q = query(colRef, where(`groups.${groupID}`, '>=', 1));
    const col = collectionData(q, { idField: 'id' });
    return col;
  }

  getUserById(userID: string): Observable<any> {
    return docData(doc(this.afs, this.colName, userID));
    // return this.doc(`${this.colName}/${userID}`);
  }

  async getUserByIdPromise(userID: string): Promise<any> {
    return await docData(doc(this.afs, this.colName, userID))
      .pipe(first())
      .toPromise();
    // return this.doc(`${this.colName}/${userID}`).pipe(first()).toPromise();
  }

  getUsersByEmail(email: string) {
    const colRef = collection(this.afs, 'emails');
    const q = query(colRef, where('email', '==', email));
    const col = collectionData(q, { idField: 'id' });
    return col.pipe(
      debounceTime(500),
      take(1),
      map((arr) => (arr.length ? { emailTaken: true } : null))
    );
  }

  async updateUser(userID: string, data: User): Promise<any> {
    data.updatedAt = this.db.timestamp;
    const docRef = doc(this.afs, this.colName, userID);
    // return updateDoc(docRef, data);
    return setDoc(docRef, data, { merge: true });
    // return this.update(this.colName, userID, data);
  }

  async initialAddUser(uid: string, data: User): Promise<any> {
    data.createdAt = this.db.timestamp;
    data.lastRead = this.db.timestamp;
    data.previousRead = this.db.timestamp;
    data.unreadNotifications = 0;
    const algoliaData = {
      uid,
      username: data.username,
      photoUrl: data.photoURL,
    };
    // return this.update(this.colName, uid, data).then(() => {
    const docRef = doc(this.afs, this.colName, uid);
    return setDoc(docRef, data, { merge: true }).then(() => {
      this.setAlgoliaUserData(uid, algoliaData);
      return this.setUsername(data.username!, uid);
    });
  }

  async setUsername(username: string, uid: string): Promise<any> {
    const data = { uid, username };
    console.log('set username for ', data);
    const docRef = doc(this.afs, 'usernames', username);
    return setDoc(docRef, data, { merge: true });
    // return this.set('usernames', username, data, { merge: true });
  }

  async updateUsername(username: string): Promise<any> {
    // DELETE OLD USERNAME
    const uid = this.currentUserData.userID;
    const data = { uid, username };
    this.updateUser(uid!, { username }).then(() => {
      const docRef = doc(this.afs, 'usernames', username);
      return setDoc(docRef, data, { merge: true });
      // return this.set('usernames', username, data);
    });
  }

  async setAlgoliaUserData(uid: string, data: AlgoliaUser): Promise<any> {
    const docRef = doc(this.afs, this.colNameAlgolia, uid);
    return setDoc(docRef, data, { merge: true });
    // this.set(this.colNameAlgolia, uid, data, { merge: true });
  }

  async removeMembership(memberId: string, groupId: string): Promise<any> {
    const user = {};
    // user[`groups.${groupId}`] = 0;
    // return this.update(this.colName, memberId, user);
    const docRef = doc(this.afs, this.colName, memberId);
    return setDoc(docRef, user, { merge: true });
    // this.getUserById(memberId).pipe(take(1)).subscribe(user => {
    //  if (user.groups) {
    //       delete user.groups[groupId]
    //  }
    // });
  }

  checkUsername(username: string): Observable<any> {
    username = username.toLowerCase();
    return docData(doc(this.afs, `usernames/${username}`)); // .pipe(take(1));
    // return this.doc(`usernames/${username}`).pipe(take(1));
  }

  /**async searchUser(searchtext?: string) {
    return this.usernameSearch.pipe(
      filter(val => !!val), // filter empty strings
      switchMap(username => {
        const query = new AFSQuery();
        query.orderBy = [[`searchIndex.${username}`], ['asc']]; // `searchIndex.${username}`;
        query.limit = 10;
        return this.collection('users', query);
      })
    );
  }*/

  async addFriend(fuid: string): Promise<any> {
    const ouid = this.currentUserData.userID!;
    const ownFriendsObject = {};
    (ownFriendsObject as any)[fuid] = 2; // 1 = friends, 2 = you invited, 3 = you got invited
    const friendsObject = {
      ouid: 3,
    };
    // friendsObject[ouid] = 3;
    const ownData = { uid: ouid, friends: ownFriendsObject };
    const friendsData = { uid: fuid, friends: friendsObject };
    const docRef = doc(this.afs, 'friends', ouid!);
    return setDoc(docRef, ownData, { merge: true }).then(() => {
      const docRef2 = doc(this.afs, 'friends', fuid);
      return setDoc(docRef2, friendsData, { merge: true });
    });
    // return this.set('friends', ouid, ownData, { merge: true }).then(() => {
    //   return this.set('friends', fuid, friendsData, { merge: true });
    // });
  }

  async resetCounter() {
    console.log('set unread notes to 0');
    const user = this.currentUserData;
    const data = {
      lastRead: this.db.timestamp,
      previousRead: user.lastRead,
      unreadNotifications: 0,
      updatedAt: this.db.timestamp,
    };
    const docRef = doc(this.afs, this.colName, user.uid!);
    return setDoc(docRef, data, { merge: true });
    // return this.update(this.colName, user.uid, data);
  }

  async uploadAvatar(selectedFile: File, fileName: string): Promise<string> {
    const photoURL = await this.db.uploadFile(
      selectedFile,
      'images/user-avatar',
      fileName
    );
    return photoURL;
  }
}

export interface User {
  id?: string;
  userID?: string;
  uid?: string;
  friends?: any;
  name?: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  role?: string;
  status?: string;
  groups?: any;
  isAdmin?: boolean;
  createdAt?: any;
  updatedAt?: any;
  birthday?: any;
  privacy?: string;
  whitelist?: any;
  whitelistLength?: number;
  blacklist?: any;
  blacklistLength?: number;
  source?: string;
  username?: string;
  activeGroups?: any;
  daysleft?: any;
  testUser?: boolean; // just for testing, delete it later
  lastRead?: any;
  previousRead?: any;
  unreadNotifications?: number;
  payMethods?: any;
}

export interface AlgoliaUser {
  name?: string;
  uid: string;
  username?: string;
  photoUrl?: string;
}
