import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  docData,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  SetOptions,
  query,
  where,
  serverTimestamp,
  QueryConstraint,
} from '@angular/fire/firestore';
import type {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  FieldPath,
  OrderByDirection,
  Query,
  WhereFilterOp,
} from '@firebase/firestore-types';
import {
  Storage,
  ref,
  deleteObject,
  uploadBytes,
  uploadString,
  uploadBytesResumable,
  percentage,
  getDownloadURL,
} from '@angular/fire/storage';

import { Observable } from 'rxjs';
import { combineLatest, pipe, of, defer } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DbService {
  constructor(private afs: Firestore, private storage: Storage) {}

  async doc(path: string, id: string) {
    const docRef = doc(this.afs, path, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  }

  docSub(path: string, id: string) {
    return docData(doc(this.afs, path, id));
  }

  collection(path: string, conditions?: QueryConstraint) {
    const colRef = collection(this.afs, path);
    const q = conditions ? query(colRef, conditions) : query(colRef);
    const col = collectionData(q, { idField: 'id' });
    return col;
  }

  async add(path: string, data: any): Promise<any> {
    const docRef = collection(this.afs, path);
    return await addDoc(docRef, data).then(
      (res) => res,
      (err) => err
    );
  }

  async set(
    path: string,
    id: string,
    data: any,
    options?: SetOptions
  ): Promise<void> {
    const docRef = doc(this.afs, path, id);
    return await setDoc(docRef, data, { merge: true }).then(
      (res) => res,
      (err) => err
    );
  }

  async update(path: string, id: string, data: any) {
    const docRef = doc(this.afs, path, id);
    return await updateDoc(docRef, data).then(
      (res) => 'success',
      (err) => err
    );
  }

  async delete(path: string, id: string) {
    const docRef = doc(this.afs, path, id);
    return deleteDoc(docRef).then(
      (res) => 'success',
      (err) => err
    );
  }

  /**protected async deleteCol(path: string) {
    const batch = this.afs.firestore.batch();
    const qs = await this.afs.collection(path).ref.get();
    qs.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
  }*/

  async newId(colPath: string) {
    return doc(collection(this.afs, colPath)).id;
  }

  get timestamp() {
    return serverTimestamp();
  }

  // protected get batch() {
  //  return this.afs.firestore.batch();
  // }

  /**
   *
   * @param file image or any other type of file
   * @param path path to folder in firestore
   * @param filename does it really need a description?
   * @returns firestore url to file
   */
  async uploadFile(
    file: File,
    path: string,
    filename: string
  ): Promise<string> {
    console.log(
      'uploading file: ',
      file,
      ' to path: ',
      path,
      ' with filename :',
      filename
    );
    if (!this.storage) {
      return Promise.reject('storage is not initialized');
    }
    const storageRef = ref(this.storage, path);
    const task = uploadBytesResumable(storageRef, file);
    const uploadPercent = percentage(task);
    await task;
    const url = await getDownloadURL(storageRef);
    return url;
  }

  /**uploadPutString(path: string, selectedFile: any) {
    console.log(path, selectedFile);
    if (!this.afstorage) {
      return Promise.reject('storage is not initialized');
    }
    const ref = this.afstorage.ref(path);
    return ref.putString(selectedFile.dataUrl, 'data_url');
  }*/
}

type QueryWhere = [
  fieldPath: string | FieldPath,
  opStr: WhereFilterOp,
  value: unknown
];
type QueryOrderBy = [
  fieldPath: string | FieldPath,
  directionStr?: OrderByDirection
];
type QueryLeftJoin = [idField: string, collection: string, alias: string];
type QueryCursor = [snapshot: DocumentSnapshot<unknown>] | unknown[];

export class QueryBuilder {
  private _where: QueryWhere[] = [];
  private _orderBy: QueryOrderBy[] = [];
  private _leftJoins: QueryLeftJoin[] = [];
  private _limit?: number;
  private _limitToLast?: number;
  private _startAt?: QueryCursor;
  private _startAfter?: QueryCursor;
  private _endAt?: QueryCursor;
  private _endBefore?: QueryCursor;

  get joins() {
    return this._leftJoins;
  }

  where(...where: QueryWhere) {
    this._where.push(where);

    return this;
  }

  orderBy(...orderBy: QueryOrderBy) {
    this._orderBy.push(orderBy);

    return this;
  }

  leftJoin(...leftJoin: QueryLeftJoin) {
    this._leftJoins.push(leftJoin);
  }

  limit(limit: number) {
    this._limit = limit;
    return this;
  }

  limitToLast(limitToLast: number) {
    this._limitToLast = limitToLast;
    return this;
  }

  startAt(...startAt: QueryCursor) {
    this._startAt = startAt;
    return this;
  }

  startAfter(...startAfter: QueryCursor) {
    this._startAfter = startAfter;
    return this;
  }

  endAt(...endAt: QueryCursor) {
    this._endAt = endAt;
    return this;
  }

  endBefore(...endBefore: QueryCursor) {
    this._endBefore = endBefore;
    return this;
  }

  // Still have to use <any> type due to most interfaces of @google-cloud/firestore
  // are not compatible with @firebase/firestore's interfaces.
  exec(
    ref: CollectionReference<DocumentData> | any,
    queryOps?: { [key: string]: any }
  ): Query<DocumentData> | any {
    if (!queryOps) {
      throw Error('invalid arguments');
    }

    const {
      query,
      where,
      orderBy,
      limit,
      limitToLast,
      startAt,
      startAfter,
      endAt,
      endBefore,
    } = queryOps;

    const queryConstraints = [
      ...this._where.map((w) => where(...w)),
      ...this._orderBy.map((o) => orderBy(...o)),
      ...(this._limit ? [limit(this._limit)] : []),
      ...(this._limitToLast ? [limitToLast(this._limitToLast)] : []),
      ...(this._startAt?.every((i) => !!i) ? [startAt(...this._startAt)] : []),
      ...(this._startAfter?.every((i) => !!i)
        ? [startAfter(...this._startAfter)]
        : []),
      ...(this._endAt?.every((i) => !!i) ? [endAt(...this._endAt)] : []),
      ...(this._endBefore?.every((i) => !!i)
        ? [endBefore(...this._endBefore)]
        : []),
    ];

    return query(ref, ...queryConstraints);
  }
}
