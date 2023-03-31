import { Injectable } from '@angular/core';
import { DbService } from './db.service';

@Injectable({
  providedIn: 'root'
})
export class PushService {
  colName = 'push-notifications';

  constructor(
    private db: DbService
  ) { }

  newGroup(
    recipientID: string,
    groupID: string,
    groupName: string,
    presenteeID: string,
    presenteeName: string,
    creatorID: string,
    creatorName: string,
    creatorPhotoUrl: string,
    occasionDate: any
  ) {
    const newPushNote = {
      recipientID,
      groupID,
      groupName,
      presenteeName,
      presenteeID,
      creatorID,
      creatorName,
      creatorPhotoUrl,
      createdAt: this.db.timestamp,
      occasionDate,
      read: false,
      type: 'group-invite'
    };
    console.log('creating doc for ', newPushNote);
    this.db.add(this.colName, newPushNote);
  }
}
