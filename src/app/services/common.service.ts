import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
/**import { Camera, PictureSourceType } from '@ionic-native/camera/ngx';
import { ImageResizer } from '@ionic-native/image-resizer/ngx';
import { File } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';*/

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  constructor(
    private platform: Platform /**private camera: Camera,
    private imageResizer: ImageResizer,
    private file: File,
    private filePath: FilePath,*/
  ) {}

  get isCordova() {
    return this.platform.is('cordova');
  }

  getPlatform() {
    return this.platform.ready().then((source) => {
      if (this.platform.is('cordova')) {
        console.log(source);
        console.log('cordova');
        return 'cordova';
      }
      if (this.platform.is('android')) {
        console.log(source);
        console.log('android');
        return 'android';
      }
      if (this.platform.is('ios')) {
        console.log(source);
        console.log('ios');
        return 'ios';
      } else {
        console.log('web');
        return 'web';
      }
    });
  }

  currentTimestamp(): number {
    return Date.now();
  }

  timeBetweenNow(timestampDate: number): string {
    const timestampNow = this.currentTimestamp();
    const milliseconds = timestampNow - timestampDate;
    const date = this.timestampToDateShort(timestampDate);
    // /1000 = seconds; /60 = minutes; /60 = hours; /24 = days
    const seconds = milliseconds / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;
    const result =
      seconds < 60
        ? Math.round(seconds) + 's'
        : minutes < 60
        ? Math.round(minutes) + 'min'
        : hours < 24
        ? Math.round(hours) + 'h'
        : days < 7
        ? Math.round(days) + 'd'
        : date;
    return result;
  }

  timestampToDateShort(timestamp: number) {
    const dateTemp = new Date(timestamp);
    const date =
      ('0' + dateTemp.getDate()).slice(-2) +
      '.' +
      ('0' + (dateTemp.getMonth() + 1)).slice(-2) +
      '.' +
      dateTemp.getFullYear().toString().substr(2, 2);
    return date;
  }

  sortByCreatedAt(list: any): any[] {
    // console.log('sort by date');
    if (list.length > 1) {
      return list.sort((a: any, b: any) => {
        return a.createdAt - b.createdAt;
      });
    } else {
      return list;
    }
  }
}
