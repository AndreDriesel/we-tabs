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
import { of, Observable, BehaviorSubject, Subscription } from 'rxjs';
import { take, first } from 'rxjs/operators';

// import * as currency from 'currency.js';

import { User, UserService } from './user.service';
import { ParticipationService, Participation } from './participation.service';

@Injectable({
  providedIn: 'root',
})
export class GiftService {
  wishCol = 'wishes';
  wishOrderCol = 'wishorder';
  ideaCol = 'ideas';
  colName?: string;
  user: User;
  uid?: string;
  presenteeID?: string;
  gid?: string;
  presentee: any;
  currentGift?: Gift;
  sharedData: any;

  privatIdeasData?: any[];
  privatIdeasSubject: BehaviorSubject<any> = new BehaviorSubject('');
  privatIdeasSubscription?: Subscription;

  constructor(
    private afs: Firestore,
    private storage: Storage,
    public db: DbService,
    private userService: UserService,
    private participationService: ParticipationService
  ) {
    this.user = this.userService.currentUserData;
  }

  /**
    get wishList()
    return from(this.iStorage.get('user')).pipe(switchMap(userData => {
      this.uid = userData.userID;
      const query = new AFSQuery();
      query.where = [
        [`userID`, '==', this.uid]
      ];
      console.log(query);
      return this.collection(this.wishCol, query);
    }));
  } */

  setColName(type: string) {
    if (type === 'idea') {
      this.colName = this.ideaCol;
    }
    if (type === 'wish') {
      this.colName = this.wishCol;
    }
  }

  getColName(type: string) {
    return type === 'idea' ? this.ideaCol : this.wishCol;
  }

  /** get groupIdeaList() {
    const query = new AFSQuery();
    query.where = [
      [`gid`, '==', this.gid]
    ];
    return this.collection(this.ideaCol, query);
  } */

  get wishList() {
    const colRef = collection(this.afs, this.wishCol);
    const q = query(colRef, where('userID', '==', this.uid));
    const col = collectionData(q, { idField: 'id' });
    return col;
  }

  getWishOrder(uid: string): Observable<any> {
    return this.db.docSub(this.wishOrderCol, uid);
    // return this.sffs.doc(`${this.wishOrderCol}/${userID}`);
  }

  allWishes(userID: string): Observable<any> {
    const colRef = collection(this.afs, this.wishCol);
    const q = query(colRef, where('creatorID', '==', userID));
    const col = collectionData(q, { idField: 'id' });
    return col;
  }

  privatWishes(userID: string) {
    const colRef = collection(this.afs, this.wishCol);
    const q = query(
      colRef,
      where('creatorID', '==', userID),
      where('public', '==', false)
    );
    const col = collectionData(q, { idField: 'id' });
    return col;
    /**const qb = new QueryBuilder();
    qb.where('creatorID', '==', userID);
    qb.where('public', '==', false);
    return this.sffs.collectionSnapshotChanges(this.wishCol, qb);*/
  }

  publicWishes(userID: string): Observable<any> {
    const colRef = collection(this.afs, this.wishCol);
    const q = query(
      colRef,
      where('creatorID', '==', userID),
      where('public', '==', true)
    );
    const col = collectionData(q, { idField: 'id' });
    return col;
    /**const qb = new QueryBuilder();
    qb.where('creatorID', '==', userID);
    qb.where('public', '==', true);
    return this.sffs.collectionSnapshotChanges(this.wishCol, qb);*/
  }

  privatIdeas(userID: string): Observable<Gift[]> {
    const colRef = collection(this.afs, this.ideaCol);
    const q = query(
      colRef,
      where('creatorID', '==', userID),
      where('public', '==', false)
    );
    const col = collectionData(q, { idField: 'id' });
    return col;
    /**const qb = new QueryBuilder();
    qb.where('creatorID', '==', userID);
    qb.where('public', '==', false);
    return this.sffs.collectionSnapshotChanges(this.ideaCol, qb); */
  }

  subscribeToPrivatIdeas(uid: string) {
    this.privatIdeasSubscription = this.privatIdeas(uid).subscribe((data) => {
      // console.log('privatIdeasData', data);
      data.forEach((idea) => {
        idea.price = idea.price! / 100;
        idea.partSum = idea.partSum! / 100;
        idea.remainder = idea.remainder! / 100;
      });
      this.privatIdeasData = data;
      this.privatIdeasSubject.next({ data });
    });
  }

  unsubscribeToPrivatIdeas() {
    this.privatIdeasSubscription?.unsubscribe();
  }

  getPrivatIdeas() {
    return this.privatIdeasSubject.asObservable();
  }

  publicIdeas(userID: string): Observable<any> {
    const colRef = collection(this.afs, this.ideaCol);
    const q = query(
      colRef,
      where('presenteeID', '==', userID),
      where('public', '==', true)
    );
    const col = collectionData(q, { idField: 'id' });
    return col;
    /**const qb = new QueryBuilder();
    qb.where('presenteeID', '==', userID);
    qb.where('public', '==', true);
    return this.sffs.collectionSnapshotChanges(this.ideaCol, qb);*/
  }

  ideasByGroup(groupID: string): Observable<any> {
    const colRef = collection(this.afs, this.ideaCol);
    const q = query(colRef, where('groupID', '==', groupID));
    const col = collectionData(q, { idField: 'id' });
    return col;
    /**const qb = new QueryBuilder();
    qb.where('groupID', '==', groupID);
    return this.sffs.collectionSnapshotChanges(this.ideaCol, qb);*/
  }

  get wishListByPid() {
    if (!this.presenteeID) {
      return of([]);
    }
    const colRef = collection(this.afs, this.wishCol);
    const q = query(
      colRef,
      where('userID', '==', this.presenteeID),
      where('public', '==', true)
    );
    const col = collectionData(q, { idField: 'id' });
    return col;
    /**const qb = new QueryBuilder();
    qb.where('userID', '==', this.presenteeID);
    qb.where('public', '==', true);
    return this.sffs.collectionSnapshotChanges(this.wishCol, qb);*/
  }

  getDocById(col: string, id: string) {
    console.log('loading gift data for id: ', id, ' of collection: ', col);
    return docData(doc(this.afs, col, id));
    // return this.sffs.doc(`${col}/${id}`);
  }

  getGiftById(giftId: string, type: string) {
    this.setColName(type);
    return docData(doc(this.afs, this.colName!, giftId));
    // return this.sffs.doc(`${this.colName}/${giftId}`);
  }

  async addNewGift(type: string, gift: Gift) {
    this.setColName(type);
    const docId = await this.db.newId(this.colName!);
    console.log(docId);
    const timestamp = this.db.timestamp; // this.timestamp;
    gift.id = docId;
    gift.giftID = docId;
    gift.createdAt = timestamp;
    gift.type = type;
    gift.price = gift.price! * 100;
    gift.remainder = gift.price || 0;
    gift.partCount = 0;
    gift.partSum = 0;
    gift.funded = 0;
    console.log(gift);
    return this.db.set(this.colName!, docId, gift);
    // return this.sffs.upsert(this.colName, gift);
    // return this.set(this.colName, docId, gift);
  }

  async addGift(type: string, gift: Gift) {
    this.setColName(type);
    const timestamp = this.db.timestamp;
    gift = {
      createdAt: timestamp,
      type,
      remainder: gift.price || 0,
      partCount: 0,
      partSum: 0,
      funded: 0,
    };
    return this.db.add(this.colName!, gift);
    // return this.add(this.colName, gift);
  }

  async addWish(wish: Gift) {
    const docId = doc(collection(this.afs, this.wishCol)).id; // this.newId(this.colName);
    const timestamp = this.db.timestamp;
    wish = {
      createdAt: timestamp,
      id: docId,
      giftID: docId,
      remainder: wish.price || 0,
      partCount: 0,
      partSum: 0,
      funded: 0,
      presenteeID: this.user.uid,
      type: 'wish',
    };
    console.log(wish);
    return this.db.set(this.wishCol, docId, wish).then((x) => {
      // return this.set(this.wishCol, docId, wish).then(x => {
      this.getWishOrder(this.user.uid!)
        .pipe(take(1))
        .toPromise()
        .then((orderDoc) => {
          console.log(orderDoc);
          const order = orderDoc.order;
          order.unshift(docId);
          this.updateOrder(this.user.uid!, order);
        });
    });
  }

  async updateGift(gift: Gift, type: string): Promise<any> {
    this.setColName(type);
    gift.updatedAt = this.db.timestamp;
    return this.db.update(this.colName!, gift.id!, gift);
    // return this.update(this.colName, gift.id, gift);
  }

  async deleteGift(type: string, gift: Gift): Promise<any> {
    this.setColName(type);
    return this.db.delete(this.colName!, gift.id!);
    // this.delete(this.colName, gift.id);
  }

  async deleteWish(wish: Gift): Promise<any> {
    // this.delete(this.wishCol, wish.id);
    this.db.delete(this.colName!, wish.id!);
    return this.getDocById(this.wishOrderCol, this.user.uid!)
      .pipe(take(1))
      .toPromise()
      .then((orderDoc) => {
        const order = orderDoc!.order;
        order.splice(order.indexOf(wish.id), 1);
        this.updateOrder(this.user.uid!, order);
      });
  }

  async updateOrder(uid: string, order: any): Promise<any> {
    order.updatedAt = this.db.timestamp;
    return this.db.update(this.wishOrderCol, uid, order);
    // return this.update(this.wishOrderCol, userID, { order });
  }

  async copyGift(type: string, gift: Gift, groupElement: any): Promise<any> {
    this.setColName(type);
    const docId = await this.db.newId(this.colName!); // this.newId(this.colName);
    const timestamp = this.db.timestamp;
    const newGift: Gift = {
      buyerID: this.userService.currentUserData.userID,
      createdAt: timestamp,
      creatorID: this.userService.currentUserData.userID,
      description: gift.description || '',
      giftID: docId,
      groupID: groupElement.groupID,
      id: docId,
      name: gift.name,
      photoURL: gift.photoURL || '',
      presenteeID: groupElement.presenteeID ? groupElement.presenteeID : null,
      price: gift.price,
      public: true,
      remainder: gift.price,
      seller: gift.seller || '',
      type,
      url: gift.url || '',
    };
    console.log('add following gift to group ' + newGift.groupID, newGift);
    return this.db.set(this.colName!, docId, newGift);
    // return this.set(this.colName, docId, newGift);
  }

  /**
   * START
   * participation-functions
   */

  async participate(type: string, gift: Gift, newPartValue: number) {
    this.setColName(type);
    return this.getDocById(type, gift.id!)
      .pipe(take(1))
      .toPromise()
      .then((giftData) => {
        console.log(giftData);
        const participation = giftData!.participation || {};
        if (participation[this.user.uid!] && newPartValue === 0) {
          // code for deleting participation
          return this.deleteParticipation(giftData!);
        } else if (!participation[this.user.uid!]) {
          // code for adding participation
          return this.addParticipation(type, giftData!, newPartValue);
        } else {
          // code for updating participation
          return this.updateParticipation(giftData!, newPartValue);
        }
      });
  }

  addParticipation(type: string, gift: Gift, partValue: number): Promise<any> {
    const participation = Object.create(gift.participation!) || {};
    const participationIDs = Object.create(gift.participationIDs!) || {};
    return this.participationService
      .addParticipation(gift, this.user.uid!, partValue)
      .then((res) => {
        console.log('participationDocId = ' + res);
        participation[this.user.uid!] = partValue;
        participationIDs[this.user.uid!] = res;
        const calculatedValues = this.calcParticipationValues(
          gift,
          participation
        );
        return this.db
          .update(this.colName!, gift.id!, {
            funded: calculatedValues.funded,
            participation,
            participationIDs,
            participationSum: calculatedValues.participationSum,
            remainder: calculatedValues.remainder,
            updatedAt: this.db.timestamp,
          })
          .then(() => {
            return {
              type: 'success',
              value: partValue,
            };
          });
      });
  }

  updateParticipation(gift: Gift, newPartValue: number) {
    const participation = Object.create(gift.participation!) || {};
    const participationIDs = Object.create(gift.participationIDs!) || {};
    participation[this.user.uid!] = newPartValue;
    const calculatedValues = this.calcParticipationValues(gift, participation);
    this.db.update(this.colName!, gift.id!, {
      // this.update(this.colName, gift.id, {
      funded: calculatedValues.funded,
      participation,
      participationSum: calculatedValues.participationSum,
      remainder: calculatedValues.remainder,
      updatedAt: this.db.timestamp,
    });
    this.participationService
      .updateParticipation(newPartValue, participationIDs![this.user.uid!])
      .then(() => {
        return {
          type: 'success',
        };
      });
  }

  deleteParticipation(gift: Gift) {
    const participation = Object.create(gift.participation!) || {};
    const participationIDs = Object.create(gift.participationIDs!) || {};
    this.participationService.deleteParticipation(
      participationIDs[this.user.uid!]
    );
    delete participation[this.user.uid!];
    const calculatedValues = this.calcParticipationValues(gift, participation);
    this.db.update(this.colName!, gift.id!, {
      // this.update(this.colName, gift.id, {
      funded: calculatedValues.funded,
      participation,
      participationSum: calculatedValues.participationSum,
      remainder: calculatedValues.remainder,
      updatedAt: this.db.timestamp,
    });
    return {
      type: 'delete',
      value: 0,
    };
  }

  calcParticipationValues(gift: Gift, participation: object) {
    let participationSum = 0;
    for (const part of Object.values(participation)) {
      participationSum = participationSum + part; // currency(participationSum).add(part).value;
    }
    const remainder = gift.price! - participationSum; // currency(gift.price).subtract(participationSum).value;
    const funded =
      participationSum > 0 && gift.price! > 0
        ? (participationSum / gift.price!) * 100
        : 0;
    // currency(participationSum).divide(gift.price).value * 100 : 0;
    return {
      participationSum,
      remainder,
      funded,
    };
  }

  /**
   * END
   * participation-functions
   */

  async changeVisibility(wish: Gift): Promise<any> {
    console.log(wish);
    wish.updatedAt = this.db.timestamp;
    wish.public = !wish.public;
    return this.db.update(this.wishCol, wish.id!, { public: wish.public });
  }

  /**
   *
   * start LIKE functions
   *
   */

  /**
   * @param gift object of ideas/wishes with its id, type
   * @returns doc of subcollection 'likes', when currentUser has liked the gift before or null
   */
  async getLike(gift: Gift): Promise<any> {
    this.uid = this.userService.currentUserData.uid;
    const colName = this.getColName(gift.type!);
    return this.db.doc(`${colName}/${gift.id}/likes/`, this.uid!);
    // return await this.doc(`${colName}/${gift.id}/likes/${this.uid}`).pipe(first()).toPromise() || null;
  }

  /**
   * @description Function for like a gift. Will create a document in the subcollection 'likes' of the idea/wish for current user
   * @param gift object of type Gift, needs: id, type
   * @returns success / error
   */
  async like(gift: Gift): Promise<any> {
    this.uid = this.userService.currentUserData.userID;
    const colName = this.getColName(gift.type!);
    const data = {
      uid: this.uid,
      createdAt: this.db.timestamp,
    };
    const path = `${colName}/${gift.id}/likes`;
    return this.db.update(path, this.uid!, data);
    // return this.set(path, this.uid, data);
  }

  async dislike(gift: Gift) {
    this.uid = this.userService.currentUserData.userID;
    const colName = this.getColName(gift.type!);
    const path = `${colName}/${gift.id}/likes/`;
    this.db.delete(path, this.uid!);
    // return this.delete(path, this.uid);
  }
}

export interface Gift {
  creatorID?: string;
  description?: string;
  favicon?: string;
  funded?: number;
  giftID?: string;
  groupID?: string;
  id?: string;
  liked?: boolean;
  likeDoc?: any;
  likes?: number;
  likesCount?: number;
  likeState?: string;
  name?: string;
  ownPart?: number;
  partCount?: number;
  partSum?: number;
  participation?: object;
  participationIDs?: object;
  participationSum?: number;
  participationData?: Participation;
  percent?: number;
  photoURL?: string;
  presenteeData?: User;
  presenteeID?: string;
  presenteeName?: string;
  price?: number;
  public?: boolean;
  purchaseDate?: any;
  reflink?: string;
  remainder?: number;
  seller?: string;
  thumbsup?: any;
  thumbsed?: boolean;
  thumbsCount?: number;
  type?: string; // maybe could be deleted
  url?: string;
  userID?: string;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
  buyerID?: string;
  visible?: boolean;
}

export interface Order {
  order: [];
  userID: string;
}

/** updateNextID(wishID: string, nextID: string) {
  return this.update(this.wishCol, wishID, {
    updatedAt: this.timestamp,
    nextID: nextID
  });
}*/

/**thumbsUp(type: string, userId: string, giftId: string) {
    return this.getDocById(type, giftId).pipe(take(1)).toPromise().then(gift => {
      console.log(gift);
      const thumbsup = gift.thumbsup || [];
      thumbsup.push(userId);
      return this.update(this.colName, giftId, {
        thumbsup,
        updatedAt: this.timestamp
      });
    });
  }

  thumbsDelete(type: string, userId: string, giftId: string) {
    return this.getDocById(type, giftId).pipe(take(1)).toPromise().then(gift => {
      const thumbsup = gift.thumbsup;
      const index = thumbsup.indexOf(userId);
      thumbsup.splice(index, 1);
      return this.update(this.colName, giftId, {
        thumbsup,
        updatedAt: this.timestamp
      });
    });
  }*/
