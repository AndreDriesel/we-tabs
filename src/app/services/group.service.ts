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
} from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { DbService } from './db.service';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { LoadingController } from '@ionic/angular';
import { switchMap, take } from 'rxjs/operators';
import {
  of,
  combineLatest,
  BehaviorSubject,
  Subscription,
  Observable,
} from 'rxjs';

import { UserService } from './user.service';
import { MemberService } from './member.service';
import { PushService } from './push.service';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  colName = 'groups';
  colMembers = 'members';
  currentGroup!: Group;
  currentMemberIds: any;
  currentPresentee: any;
  groupsData!: Group[];
  groupsSubject: BehaviorSubject<any> = new BehaviorSubject('');
  groupsSubscription!: Subscription;
  invitationsData!: Group[];
  invitationsSubject: BehaviorSubject<any> = new BehaviorSubject('');
  invitationsSubscription!: Subscription;
  sharedData: any;

  constructor(
    private afs: Firestore,
    private afFunctions: Functions,
    public db: DbService,
    private userService: UserService,
    private memberService: MemberService,
    private pushService: PushService,
    private loadingCtrl: LoadingController
  ) {}

  loadGroups(uid: string) {
    const colRef = collection(this.afs, this.colName);
    const q = query(
      colRef,
      where(`members.${uid}`, '==', 2),
      orderBy('occasionDate', 'asc')
    );
    const col = collectionData(q, { idField: 'id' });
    return col;
    // const query = new AFSQuery();
    // query.where = [
    //   [`members.${uid}`, '==', 2]
    // ];
    // query.orderBy = 'occasionDate';
    // query.orderDirection = 'asc';
    // return this.collection(this.colName, query);
  }

  subscribeToGroups(uid: string) {
    this.groupsSubscription = this.loadGroups(uid).subscribe((data) => {
      console.log('groupsData', data);
      this.groupsData = data;
      this.groupsSubject.next({ data });
    });
  }

  unsubscribeToGroups() {
    this.groupsSubscription.unsubscribe();
  }

  getGroups() {
    return this.groupsSubject.asObservable();
  }

  loadInvitations(uid: string) {
    const colRef = collection(this.afs, this.colName);
    const q = query(
      colRef,
      where('uid', '==', uid),
      where('status', '==', 1),
      orderBy('invitedAt', 'desc')
    );
    const col = collectionData(q, { idField: 'id' });
    return col;
    //  const query = new AFSQuery();
    //  query.where = [
    //    ['uid', '==', uid],
    //    ['status', '==', 1]
    //  ];
    //  query.orderBy = [['invitedAt']];
    //  query.orderDirection = 'desc';
    //  return this.collection(this.colMembers, query);
    /**const query = new AFSQuery();
    query.where = [
      [`members.${userID}`, '==', 1]
    ];
    query.orderBy = 'createdAt';
    return this.collection(this.colName, query);*/
  }

  subscribeToInvites(uid: string) {
    this.invitationsSubscription = this.loadInvitations(uid).subscribe(
      (data) => {
        // console.log('invitationsData', data);
        this.invitationsData = data;
        this.invitationsSubject.next({ data });
      }
    );
  }

  unsubscribeToInvites() {
    this.invitationsSubscription.unsubscribe();
  }

  getInvites() {
    return this.invitationsSubject.asObservable();
  }

  get emptyGroup() {
    const group: Group = {};
    group.id = doc(collection(this.afs, this.colName)).id;
    group.groupID = group.groupID;
    return group;
  }

  getGroupById(groupId: string): Observable<DocumentData> {
    return this.db.docSub(this.colName, groupId);
    // return this.doc(`${this.colName}/${groupId}`);
  }

  async addNewGroup(
    group: Group,
    presenteeName: string,
    presenteePhotoUrl?: string | undefined
  ) {
    // this.createGroupSpinner();
    const currentUser = this.userService.currentUserData;
    console.log(group, presenteeName, currentUser);
    const timestamp = this.db.timestamp;
    group.groupID = group.id = await this.db.newId(this.colName); // doc(collection(this.afs, this.colName)).id;
    group.creator = currentUser.uid;
    group.createdAt = timestamp;
    group.updatedAt = timestamp;
    console.log(group);
    return this.db.set(this.colName, group.id, group).then((res) => {
      console.log(res);
      for (const [key, value] of Object.entries(group.members)) {
        if (value === 1) {
          console.log('value ' + value + ': inviting user with key ' + key);
          this.memberService.inviteMember(
            key,
            group,
            presenteeName,
            presenteePhotoUrl
          );
          // this.pushService.newGroup(key, group.id, group.name, presenteeID, presenteeName, currentUser.uid, currentUser.name, currentUser.photoURL, group.occasionDate);
        } else if (value === 2) {
          console.log(
            'value ' + value + ': group created from user with key ' + key
          );
          this.memberService.firstMember(key, group.id);
        }
      }
      return group.id;
    });
  }

  async addNewGroupWithAvatar(
    group: Group,
    groupAvatar: any,
    presenteeName: string
  ) {
    const currentUser = this.userService.currentUserData;
    const timestamp = this.db.timestamp;
    group.groupID = group.id = await this.db.newId(this.colName);
    group.createdAt = timestamp;
    group.updatedAt = timestamp;
    console.log(group, groupAvatar);
    return this.uploadGroupAvatar(groupAvatar, group.id).then((avatarUrl) => {
      this.loadingCtrl.dismiss();
      group.avatar = avatarUrl;
      console.log(avatarUrl);
      // this.createGroupSpinner();
      return this.db.set(this.colName, group.id!, group).then((res) => {
        console.log('group created with id: ', group.id);
        for (const [key, value] of Object.entries(group.members)) {
          if (value === 1) {
            console.log('value ' + value + ': inviting user with key ' + key);
            this.memberService.inviteMember(
              key,
              group,
              presenteeName,
              group.avatar
            );
            // this.pushService.newGroup(key, group.id, group.name, null, presenteeName, currentUser.uid, currentUser.name, currentUser.photoURL, group.occasionDate);
          } else if (value === 2) {
            console.log(
              'value ' + value + ': group created from user with key ' + key
            );
            this.memberService.firstMember(key, group.id);
          }
        }
        return group.id;
      });
    });
  }

  async addNewGroupWithoutAvatar(group: Group, presenteeName: string) {
    // this.createGroupSpinner();
    const currentUser = this.userService.currentUserData;
    const timestamp = this.db.timestamp;
    group.groupID = group.id = await this.db.newId(this.colName);
    group.createdAt = timestamp;
    group.updatedAt = timestamp;
    // this.createGroupSpinner();
    return this.db.set(this.colName, group.id, group).then((res) => {
      console.log('group created with id: ', group.id);
      for (const [key, value] of Object.entries(group.members)) {
        if (value === 1) {
          console.log('value ' + value + ': inviting user with key ' + key);
          this.memberService.inviteMember(
            key,
            group,
            presenteeName,
            group.avatar
          );
          // this.pushService.newGroup(key, group.id, group.name, null, presenteeName, currentUser.uid, currentUser.name, currentUser.photoURL, group.occasionDate);
        } else if (value === 2) {
          console.log(
            'value ' + value + ': group created from user with key ' + key
          );
          this.memberService.firstMember(key, group.id);
        }
      }
      return group.id;
    });
  }

  async uploadGroupAvatar(selectedFile: any, fileName: string) {
    this.uploadSpinner();
    console.log(selectedFile, fileName);
    const filePath = 'images/group-avatar/';
    const url = await this.db.uploadFile(selectedFile, filePath, fileName);
    return url;
  }

  async uploadSpinner() {
    const loading = await this.loadingCtrl.create({
      spinner: 'dots',
      showBackdrop: true,
      animated: true,
      backdropDismiss: false, // ADD true and cancel upload with backdrop
      message: 'Bild-Upload läuft...',
      // message: 'Lade Bild hoch... ' + this.uploadPercent + '%'
    });
    await loading.present();
  }

  /**async createGroupSpinner() {
    console.log('starting spinner');
    const loading = await this.loadingCtrl.create({
      spinner: 'dots',
      showBackdrop: true,
      animated: true,
      backdropDismiss: false,
      message: 'Gruppe wird erstellt...',
      translucent: true
    });
    return await loading.present();
  }*/

  /**
   * @param selectedFile file to upload (image)
   * @param fileName name of file
   * @returns url to with firestore-path
   */
  async uploadGroupAvatarOld(
    selectedFile: File,
    fileName: string
  ): Promise<string> {
    return await this.db.uploadFile(
      selectedFile,
      'images/group-avatar',
      fileName
    );
  }

  async updateGroup(group: Group) {
    group.updatedAt = await this.db.timestamp;
    return this.db.update(this.colName, group.id!, group);
  }

  deleteGroup(id: string) {
    console.log('start groupService.deleteGroup()');
    return this.db.delete(this.colName, id);
  }

  deleteWithCF(id: string) {
    httpsCallable(this.afFunctions, 'deleteGroup').call(id);
    // this.afFunctions.httpsCallable('deleteGroup').call(id);
  }

  getMembers(groupId: string) {
    return this.db.docSub(this.colName, groupId).pipe(
      switchMap((group: Group) => {
        if (!group || !group.members) {
          of([]);
        }
        const memberIds = Object.keys(group.members).filter(
          (key) => group.members[key]
        );
        return combineLatest(
          memberIds.map((memberId) => this.userService.getUserById(memberId))
        );
      })
    );
  }

  inviteMember(memberId: string, groupId: string, currentUserID: string) {
    return this.getGroupById(groupId)
      .pipe(take(1))
      .toPromise()
      .then((group) => {
        const members = group?.['members'] || {};
        members[memberId] = 1;

        /** this.ionicStorage.get('currentUser').then((data) => {
        const currentUser = data;
        this.memberService.inviteMember(memberId, groupId, currentUser.userID);
      }); */
        this.db.update(this.colName, groupId, {
          members,
          updatedAt: this.db.timestamp,
        });
        // return this.memberService.inviteMember(memberId, groupId, currentUserID);
      });
  }

  acceptMember(groupId: string) {
    const user = this.userService.currentUserData;
    return this.getGroupById(groupId)
      .pipe(take(1))
      .toPromise()
      .then((group) => {
        const members = group?.['members'] || {};
        members[user.uid!] = 2;
        this.memberService.acceptMember(groupId);
        return this.db.update(this.colName, groupId, {
          members,
          updatedAt: this.db.timestamp,
        });
      });
  }

  removeMember(memberId: string, groupId: string) {
    return this.getGroupById(groupId)
      .pipe(take(1))
      .toPromise()
      .then((group) => {
        const members = group?.['members'] || {};
        delete members[memberId];
        this.memberService.removeMember(memberId, groupId);
        return this.db.update(this.colName, groupId, {
          members,
          updatedAt: this.db.timestamp,
        });
      });
  }

  refuseInvite(groupId: string) {
    const user = this.userService.currentUserData;
    return this.getGroupById(groupId)
      .pipe(take(1))
      .toPromise()
      .then((group) => {
        const members = group?.['members'] || {};
        delete members[user.uid!];
        this.memberService.refuseInvite(groupId);
        return this.db.update(this.colName, groupId, {
          members,
          updatedAt: this.db.timestamp,
        });
      });
  }

  budget(userId: string, groupId: string, budgetValue: number) {
    return this.getGroupById(groupId)
      .pipe(take(1))
      .toPromise()
      .then((group) => {
        const budget = group?.['budget'] || {};
        budget[userId] = +budgetValue;
        // this.moneyService.functionXYZ - function for budget
        return this.db.update(this.colName, groupId, {
          budget,
          updatedAt: this.db.timestamp,
        });
      });
  }
}

export interface Group {
  active?: boolean;
  avatar?: any;
  blacklist?: any;
  creator?: string;
  daysleft?: number;
  description?: string;
  id?: string | any;
  groupID?: string;
  locked?: boolean;
  members?: any;
  membersCount?: number;
  budget?: any;
  name?: string;
  occasion?: string;
  occasionDate?: any;
  owner?: string;
  uid?: string;
  userID?: string;
  photoURL?: string;
  presentee?: {
    uid?: string;
    name?: string;
    type?: string;
  };
  presenteeID?: string;
  presenteeData?: {
    photoURL?: string;
    uid?: string;
    name?: string;
    username?: string;
  };
  presenteeName?: string;
  presenteeType?: string;
  visible?: boolean;
  visibility?: string;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

export interface GroupMember {
  id?: string;
  role?: string;
  status?: string;
}

/** getInvitations(userID) {
  const query = new AFSQuery();
  query.where = [
    [`members.${userID}`, '==', 1]
  ];
  // query.orderBy = 'createdAt';
  return this.collectionLeftJoin(this.colName, 'userID', 'users', query);
}

getGroups(userID) {
  const query = new AFSQuery();
  query.where = [
    [`members.${userID}`, '==', 2]
  ];
  // query.orderBy = 'createdAt';
  return this.collectionLeftJoin(this.colName, 'userID', 'users', query);
}

get groupListLeftJoin() {
  return this.userService.currentUser.pipe(
    switchMap(user => {
      if (!user) {
        return of([]);
      }

      const userID = user.id || user.userID;

      const query = new AFSQuery();
      query.where = [
        [`members.${userID}`, '==', 2]
      ];
      // query.orderBy = 'createdAt';
      return this.collectionLeftJoin(this.colName, 'userID', 'users', query);
  }));
}

get inviteListLeftJoin() {
  return this.userService.currentUser.pipe(
    switchMap(user => {
      if (!user) {
        return of([]);
      }

      const userID = user.id || user.userID;

      const query = new AFSQuery();
      query.where = [
        [`members.${userID}`, '==', 1]
      ];
      // query.orderBy = 'createdAt';
      return this.collectionLeftJoin(this.colName, 'userID', 'users', query);
  }));
} */

/** getGroupDocJoin(groupId: string) {
  const joinObj = {
    userID: 'users'
  };
  return this.docDocJoin(`${this.colName}/${groupId}`, joinObj);
}*/

/**addGroup(group: Group, memberId: string) { // OLD ONE - could be deleted next time
  const timestamp = this.db.timestamp;
  group.createdAt = timestamp;
  group.updatedAt = timestamp;
  console.log(group);
  return this.set(this.colName, group.id, group).then(_ => {
    return this.memberService.firstMember(memberId, group.id).then(res => {
      return res;
    });
  });
}*/
