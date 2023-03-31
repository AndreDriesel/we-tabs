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
import { distinctUntilChanged } from 'rxjs/operators';
import { ReplaySubject, Subscription, Observable } from 'rxjs';

// import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ParticipationService {
  colName = 'participations';
  newParticipation!: Participation;
  participationsData!: Participation[];
  participationsSubject = new ReplaySubject<any>();
  participationsSubscription!: Subscription;
  currentUser: any;

  constructor(
    private afs: Firestore,
    private storage: Storage,
    private db: DbService
  ) {}

  async addParticipation(
    gift: any,
    uid: string,
    partValue: number
  ): Promise<string> {
    const docId = await this.db.newId(this.colName);
    console.log(docId);
    const newParticipation: Participation = {
      giftID: gift.giftID,
      id: docId,
      paid: false,
      participantID: uid,
      type: gift.type,
      value: partValue * 100,
      createdAt: this.db.timestamp,
    };
    if (gift?.presenteeID) {
      newParticipation.presenteeID = gift.presenteeID;
    }
    if (gift?.presenteeName) {
      newParticipation.presenteeName = gift.presenteeName;
    }
    console.log(newParticipation);
    return this.db.set(this.colName, docId, newParticipation).then(() => docId);
  }

  async updateParticipation(
    partValue: number,
    participationID: string
  ): Promise<string> {
    const newUpdatedAt = this.db.timestamp;
    const newValue = partValue * 100;
    return this.db.update(this.colName, participationID, {
      updatedAt: newUpdatedAt,
      value: newValue,
    });
  }

  async deleteParticipation(participationID: string) {
    return this.db.delete(this.colName, participationID);
  }

  loadParticipations(
    type: string,
    giftID: string,
    uid?: string,
    userOp?: WhereFilterOp
  ) {
    const colRef = collection(this.afs, this.colName);
    const q = query(
      colRef,
      where('giftID', '==', giftID),
      where('type', '==', type)
    );
    const col = collectionData(q, { idField: 'id' });
    return col;
    // if (uid) { q.where.push(['participantID', userOp, uid]); }
  }

  participationsByUser(uid: string, paid?: boolean, userOp?: WhereFilterOp) {
    const colRef = collection(this.afs, this.colName);
    const q = query(colRef, where('participantID', '==', uid));
    const col = collectionData(q, { idField: 'id' });
    return col;
    // query.orderBy = 'presenteeID';
    // if (paid) { query.where.push(['paid', userOp, paid]); }
  }

  subscribeToPartByUser(uid: string) {
    this.participationsSubscription = this.participationsByUser(uid).subscribe(
      (data) => {
        this.participationsData = data;
        this.participationsSubject.next({ data });
        // console.log(this.participationsData);
      }
    );
  }

  getParticipationsByUser() {
    return this.participationsSubject
      .asObservable()
      .pipe(distinctUntilChanged());
  }

  unsubscribeToPartByUser() {
    this.participationsSubscription.unsubscribe();
  }

  togglePaid(part: Participation) {
    return this.db
      .update(this.colName, part.id as string, {
        paid: !part.paid,
        updatedAt: this.db.timestamp,
      })
      .then(
        (res) => res,
        (err) => err
      );
  }

  getDocById(giftID: string) {
    return this.db.docSub(this.colName, giftID);
  }

  /**
  addIdea(idea: Idea) {
    const timestamp = this.timestamp;
    idea.createdAt = timestamp;
    return this.add(this.colName, idea);
  }

  updateIdea(idea: Idea) {
    idea.updatedAt = this.timestamp;
    return this.update(this.colName, idea.id, idea);
  }

  deleteIdea(idea: Idea) {
    this.delete(this.colName, idea.id);
  }

  */
}

export interface Participation {
  giftID?: string;
  id?: string;
  paid?: boolean;
  participantID?: string;
  presenteeID?: string;
  presenteeName?: string;
  type?: string;
  value?: number;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}
