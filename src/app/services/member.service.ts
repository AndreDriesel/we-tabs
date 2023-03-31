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
import { switchMap, take } from 'rxjs/operators';
import { of, combineLatest, Observable } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  colName = 'members';
  currentMembers: any[] = [];

  constructor(
    private afs: Firestore,
    private storage: Storage,
    public db: DbService,
    private userService: UserService
  ) {}

  getMembers(groupId: string): Observable<any> {
    const colRef = collection(this.afs, this.colName);
    const q = query(
      colRef,
      where('groupID', '==', groupId),
      orderBy('createdAt')
    );
    const col = collectionData(q, { idField: 'id' });
    return col;
  }

  firstMember(memberId: string, groupId: string) {
    const newMember: Member = {
      userID: memberId,
      uid: memberId,
      status: 2,
      createdAt: this.db.timestamp,
      invitedBy: memberId,
      acceptedAt: this.db.timestamp,
      groupId,
    };
    // return this.set(`groups/${groupId}/${this.colName}`, memberId, newMember);
    const docName = groupId + '-' + memberId;
    return this.db.set(this.colName, docName, newMember);
  }

  inviteMember(
    memberId: string,
    group: any,
    presenteeName: string,
    presenteePhotoUrl?: string
  ) {
    const user = this.userService.currentUserData;
    const newMember: Member = {
      userID: memberId,
      uid: memberId,
      status: 1,
      createdAt: this.db.timestamp,
      invitedBy: user.uid,
      groupId: group.id,
      pushData: {
        creatorName: user.name,
        creatorPhotoUrl: user.photoURL,
        groupName: group.name,
        occasionDate: group.occasionDate,
        presenteeId: group.presentee.uid || null,
        presenteeName,
        presenteePhotoUrl: presenteePhotoUrl || null,
      },
    };
    // return this.set(`groups/${groupId}/${this.colName}`, memberId, newMember);
    const docName = group.id + '-' + memberId;
    return this.db.set(this.colName, docName, newMember);
  }

  acceptMember(groupId: string) {
    const updatedMember: Member = {
      status: 2,
      acceptedAt: this.db.timestamp,
      pushData: deleteField(),
    };
    console.log(updatedMember);
    // return this.update(`groups/${groupId}/${this.colName}`, memberId, updatedMember);
    const uid = this.userService.currentUserData.uid;
    const docName = groupId + '-' + uid;
    return this.db.update(this.colName, docName, updatedMember);
  }

  removeMember(memberId: string, groupId: string) {
    // return this.delete(`groups/${groupId}/${this.colName}`, memberId);
    const docName = groupId + '-' + memberId;
    return this.db.delete(this.colName, docName);
  }

  refuseInvite(groupId: string) {
    const uid = this.userService.currentUserData.uid;
    const docName = groupId + '-' + uid;
    return this.db.delete(this.colName, docName);
  }
}

export interface Member {
  acceptedAt?: Timestamp | any;
  createdAt?: Timestamp | any;
  groupId?: string;
  invitedAt?: Timestamp | any;
  invitedBy?: string;
  pushData?: any;
  status?: number;
  userData?: any;
  userID?: string;
  uid?: string;
}
