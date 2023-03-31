import { Injectable } from '@angular/core';
// import { AngularFirestore } from '@angular/fire/firestore';
// import { AngularFireStorage } from '@angular/fire/storage';
// import firebase from 'firebase/app';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  SetOptions,
  query,
  where,
  serverTimestamp,
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
export class FirebaseService<T> {
  constructor(
    private afs: Firestore,
    private afstorage: Storage
  ) // private afs: AngularFirestore,
  // private storage?: AngularFireStorage
  {}

  doc(path: string): Observable<DocumentData> {
    return docData(doc(this.afs, path));
    // return this.doc(`${path}`);
  }
  protected docDocJoin(path: string, joinObj: any) {
    return this.doc(`${path}`); // .pipe(docJoin(this.afs, joinObj));
  }

  /**protected get(col: string, id: string) {
    return this.afs.collection(col).doc(id).get();
  }*/

  protected collection(path: string, query?: AFSQuery): Observable<T[]> {
    return this.collection(`${path}`, query);
  }

  /**protected collectionLeftJoin(path: string, joinKey: string, joinCollection: string, query?: AFSQuery) {
    return this.collection(`${path}`, query.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return { id, ...data as {} };
      })),
      // leftJoinDocument(this.afs, joinKey, joinCollection)
    )
  }*/

  /** collectionDocJoin(path: string, joinKey: string, joinCollection: string, query?: AFSQuery) {
    const joinObj = {}; // take this code to other service for joining more keys, build joinObj on these services
    joinObj[joinKey] = joinCollection;
    return this.afs.collection(`${path}`, ref => query ? query
      .exec(ref) : ref)
      .valueChanges()
    // .pipe(docJoin(this.afs, joinObj));
  }*/

  protected add(path: string, data: any) {
    const docRef = collection(this.afs, path);
    return addDoc(docRef, data).then(
      (res) => 'success',
      (err) => err
    );
  }

  set(path: string, id: string, data: any, options?: SetOptions) {
    const docRef = doc(this.afs, path, id);
    return setDoc(docRef, data).then(
      (res) => 'success',
      (err) => err
    );
    /**return this.set(path, id, data, options).then(
      res => 'success',
      err => err);*/
  }

  protected update(path: string, id: string, data: any) {
    const docRef = doc(this.afs, path, id);
    return updateDoc(docRef, data).then(
      (res) => 'success',
      (err) => err
    );
    /**return this.update(path, id, data).then(
      res => 'success',
      err => err);*/
  }

  protected delete(path: string, id: string) {
    const docRef = doc(this.afs, path, id);
    return deleteDoc(docRef).then(
      (res) => 'success',
      (err) => err
    );
    /**return this.delete(path, id).then(
      res => 'success',
      err => err);*/
  }

  /**protected async deleteCol(path: string) {
    const batch = this.afs.firestore.batch();
    const qs = await this.afs.collection(path).ref.get();
    qs.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
  }*/

  newId(colPath: string) {
    return doc(collection(this.afs, colPath)).id;
  }

  protected get timestamp() {
    return serverTimestamp();
  }

  /**protected get batch() {
    return this.afs.firestore.batch();
  }*/

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
    if (!this.afstorage) {
      return Promise.reject('storage is not initialized');
    }
    const storageRef = ref(this.afstorage, path);
    const task = uploadBytesResumable(storageRef, file);
    const uploadPercent = percentage(task);
    await task;
    const url = await getDownloadURL(storageRef);
    return url;
  }
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

export class AFSQuery {
  where?: QueryWhere[] = [];
  orderBy?: QueryOrderBy[] = [];
  orderDirection?: string;
  limit?: number;
  startAt?: string;
  startAfter?: string;
  endAt?: string;
  endBefore?: string;

  exec(ref: CollectionReference<DocumentData>) {
    let query: any = ref;

    if (this.where) {
      for (const w of this.where) {
        query = query.where(w[0], w[1], w[2]);
      }
    }

    if (this.orderBy) {
      query = query.orderBy(this.orderBy, this.orderDirection);
    }
    if (this.limit) {
      query = query.limit(this.limit);
    }
    if (this.startAt) {
      query = query.startAt(this.startAt);
    }
    if (this.startAfter) {
      query = query.startAfter(this.startAfter);
    }
    if (this.endAt) {
      query = query.endAt(this.endAt);
    }
    if (this.endBefore) {
      query = query.endBefore(this.endBefore);
    }
    return query;
  }
}

/**export const docJoin = (
  afs: AngularFirestore,
  paths: { [key: string]: string }
) => {
  return source =>
    defer(() => {
      let parent;
      const keys = Object.keys(paths);

      return source.pipe(
        switchMap(data => {
          // Save the parent data state
          parent = data;

          // Map each path to an Observable
          const docs$ = keys.map(k => {
            const fullPath = `${paths[k]}/${parent[k]}`;
            return afs.doc(fullPath).valueChanges();
          });

          // return combineLatest, it waits for all reads to finish
          return combineLatest(docs$);
        }),
        map(arr => {
          // We now have all the associated douments
          // Reduce them to a single object based on the parent's keys
          const joins = keys.reduce((acc, cur, idx) => {
            return { ...acc, [cur]: arr[idx] };
          }, {});

          console.log({...parent, ...joins});
          // Return the parent doc with the joined objects
          return { ...parent, ...joins };
        })
      );
    });
};

export const leftJoin = (
  afs: AngularFirestore,
  field,
  collection,
  limit = 100
) => {
  return source =>
    defer(() => {
      // Operator state
      let collectionData;

      // Track total num of joined doc reads
      let totalJoins = 0;

      return source.pipe(
        switchMap(data => {
          // Clear mapping on each emitted val ;

          // Save the parent data state
          collectionData = data as any[];

          const reads$ = [];
          for (const doc of collectionData) {
            // Push doc read to Array

            if (doc[field]) {
              // Perform query on join key, with optional limit
              const q = ref => ref.where(field, '==', doc[field]).limit(limit);

              reads$.push(afs.collection(collection, q).valueChanges());
            } else {
              reads$.push(of([]));
            }
          }

          return combineLatest(reads$);
        }),
        map(joins => {
          return collectionData.map((v, i) => {
            totalJoins += joins[i].length;
            return { ...v, [collection]: joins[i] || null };
          });
        }),
        tap(final => {
          console.log(
            `Queried ${(final as any).length}, Joined ${totalJoins} docs`
          );
          totalJoins = 0;
        })
      );
    });
};

export const leftJoinDocument = (afs: AngularFirestore, field, collection) => {
  return source =>
    defer(() => {
      // Operator state
      let collectionData;
      const cache = new Map();

      return source.pipe(
        switchMap(data => {
          // Clear mapping on each emitted val ;
          cache.clear();

          // Save the parent data state
          collectionData = data as any[];

          const reads$ = [];
          let i = 0;
          for (const doc of collectionData) {
            // Skip if doc field does not exist or is already in cache
            if (!doc[field] || cache.get(doc[field])) {
              continue;
            }

            // Push doc read to Array
            reads$.push(
              afs
                .collection(collection)
                .doc(doc[field])
                .valueChanges()
            );
            cache.set(doc[field], i);
            i++;
          }

          return reads$.length ? combineLatest(reads$) : of([]);
        }),
        map(joins => {
          return collectionData.map((v, i) => {
            const joinIdx = cache.get(v[field]);
            return { ...v, [field]: joins[joinIdx] || null };
          });
        }),
        tap(final =>
          console.log(
            `Queried ${(final as any).length}, Joined ${cache.size} docs`
          )
        )
      );
    });
};
*/
