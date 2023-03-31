import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  AlertController,
  AnimationController,
  NavController,
  IonSearchbar,
  MenuController,
} from '@ionic/angular';
import { Router } from '@angular/router';

import { Subscription, combineLatest } from 'rxjs';

// import { ContactService } from '../../services/contact.service';
import { FriendsService } from '../../services/friends.service';
import { GroupService, Group } from '../../services/group.service';
import { UserService, User } from '../../services/user.service';
import { MemberService } from 'src/app/services/member.service';
import { NotificationsService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.page.html',
  styleUrls: ['./groups.page.scss'],
})
export class GroupsPage implements OnInit, OnDestroy {
  @ViewChild('searchbar') searchbar?: IonSearchbar;
  @ViewChild('header', { read: ElementRef, static: true }) header?: ElementRef;
  filteredGroups: Group[] = [];
  filteredInvites: Group[] = [];
  groupList: Group[] = [];
  hasGroups: boolean;
  hasInvites: boolean;
  inviteList: Group[] = [];
  showSpinner: boolean;
  user?: User;
  dataSub?: Subscription;
  searching: boolean;

  constructor(
    public alertController: AlertController,
    private groupService: GroupService,
    private userService: UserService,
    private friendsService: FriendsService,
    private memberService: MemberService,
    private notificationsService: NotificationsService,
    private navController: NavController,
    private router: Router,
    public menuController: MenuController
  ) {
    this.showSpinner = true;
    this.hasGroups = this.hasInvites = false;
    this.searching = false;
  }

  ngOnInit() {
    this.user = this.userService.currentUserData;
    this.loadGroups();
  }

  ionViewCanEnter() {
    if (!this.user?.name || this.user.name.length < 1 || !this.user.username) {
      this.router.navigateByUrl('/account-setup');
    }
  }

  ionViewWillEnter() {
    this.menuController.enable(true);
  }

  ngOnDestroy() {
    this.dataSub?.unsubscribe();
  }

  loadGroups() {
    const groups$ = this.groupService.getGroups();
    const friends$ = this.friendsService.getFriends();
    const invites$ = this.notificationsService.getInvites();

    this.dataSub = combineLatest([groups$, friends$, invites$]).subscribe(
      ([groups, friends, invites]) => {
        console.log('groups', groups, 'friends', friends, 'invites', invites);
        if (groups.data && friends.data) {
          groups.data.forEach((group: Group) => {
            group.presenteeData = group.presentee?.uid
              ? this.getFriendsData(group.presentee.uid, friends.data)
              : null;
            // group.daysleft = Math.floor((group.occasionDate - Date.now()) / 1000 / 60 / 60 / 24);
            const occasionDateValue = new Date(group.occasionDate);
            group.daysleft = Math.round(
              Math.ceil(
                (occasionDateValue.getTime() - Date.now()) / 1000 / 60 / 60 / 24
              )
            );
            group.avatar = group.presenteeData?.photoURL
              ? group.presenteeData?.photoURL
              : group.avatar
              ? group.avatar
              : null;
          });
        }
        if (invites && friends.data) {
          invites.data.forEach((invite: any) => {
            invite.presenteeData = invite.pushData.presenteeId
              ? this.getFriendsData(invite.pushData.presenteeId, friends.data)
              : null;
          });
        }
        // now the old promise code - for groups
        this.showSpinner = false;
        this.filteredGroups = this.groupList = !groups
          ? []
          : this.sortByDate(groups.data);
        console.log(this.filteredGroups);
        this.hasGroups = groups ? true : false;
        // now the old promise code - for invites
        this.filteredInvites = this.inviteList = invites.data;
        console.log(this.filteredInvites);
        this.hasInvites = invites.length > 0 ? true : false;
      }
    );
  }

  getFriendsData(uid: string, friends: any) {
    const presenteeData = friends.filter(
      (f: any) =>
        JSON.stringify(f.uid).toLowerCase().indexOf(uid.toLowerCase().trim()) >
        -1
    );
    // console.log('get friend with data: ', presenteeData);
    return presenteeData[0] || null;
  }

  searchbarFilter(searchTerm: any) {
    const searchText = searchTerm.target.value || '';
    this.filteredGroups = this.groupList.filter(
      (g) =>
        JSON.stringify(g)
          .toLowerCase()
          .indexOf(searchText.toLowerCase().trim()) > -1
    );
    this.filteredInvites = this.inviteList.filter(
      (g) =>
        JSON.stringify(g)
          .toLowerCase()
          .indexOf(searchText.toLowerCase().trim()) > -1
    );
  }

  acceptInvitation(groupID: string) {
    console.log(
      'add user ' +
        this.user?.name +
        ' with uid=' +
        this.user?.userID +
        ' to group with id=' +
        groupID
    );
    this.groupService.acceptMember(groupID);
  }

  refuseInvitation(groupID: string) {
    this.groupService.refuseInvite(groupID);
  }

  async deleteAlert(id: string) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      message: 'Willst du die Gruppe wirklich löschen?',
      buttons: [
        {
          text: 'Nein',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            console.log('Confirm Cancel: blah');
          },
        },
        {
          text: 'Ja',
          handler: () => {
            this.deleteGroup(id);
          },
        },
      ],
    });

    await alert.present();
  }

  deleteGroup(id: string) {
    this.groupService
      .deleteGroup(id)
      .then((res) => console.log(`group with id ${id} deleted`, res));
  }

  logGroup(group: Group) {
    console.log(group);
  }

  goToActivities() {
    this.navController.navigateForward('/activities/');
  }

  goToGroup(group: Group) {
    this.navController.navigateForward('/groups/' + group.id);
  }

  goToGroupCreate() {
    this.navController.navigateForward('/groups/create');
  }

  sortByDate(groups: Group[]) {
    console.log('sort by date');
    if (groups.length > 1) {
      return groups.sort((a: any, b: any) => {
        return b.daysleft - a.daysleft;
      });
    } else {
      return groups;
    }
  }

  searchOff() {
    this.searching = false;
  }

  searchOn() {
    this.searching = true;
    setTimeout(() => {
      this.searchbar?.setFocus();
    }, 100);
  }

  trackById(index: number, group: Group): string {
    return `${group.id}`;
  }
}

/**
  headerFadeIn() {
    const animation = this.animationController
      .create()
      .addElement(this.header.nativeElement)
      .duration(500)
      .iterations(1)
      .keyframes([
        { offset: 0, transform: 'scale(1)', opacity: '1' },
        { offset: 1, transform: 'scale(0)', opacity: '0.5'}
      ]);
    animation.play();
  }
 */

/** loadGroups() {
  this.groupSP = this.groupService.getGroups().subscribe(groupArray => {
    const groupPromise = [];
    if (groupArray.data) {
      groupArray.data.forEach(groupItem => {
        groupPromise.push(
          new Promise((resolve) => {
            this.contactService.contactsData.forEach(contact => {
              if (groupItem.presentee.id && contact.userID === groupItem.presentee.id) {
                groupItem.presenteeData = contact;
              }
            });
            resolve(groupItem);
          })
        );
      });
    }
    Promise.all(groupPromise).then(promiseData => {
      this.showSpinner = false;
      this.groupList = promiseData;
      this.filteredGroups = promiseData;
      console.log(promiseData);
      if (Object.keys(promiseData).length > 0) {
        this.hasGroups = true;
      }
    });
  });
  this.invitationSP = this.groupService.loadInvitations(this.user.userID).subscribe(invitesArray => {
    const invitesPromise = [];
    invitesArray.forEach(inviteItem => {
      invitesPromise.push(
        new Promise((resolve) => {
          this.contactService.contactsData.forEach(contact => {
            if (inviteItem.presentee.id && contact.userID === inviteItem.presentee.id) {
              inviteItem.presenteeData = contact;
            }
          });
          resolve(inviteItem);
        })
      );
    });
    Promise.all(invitesPromise).then(promiseData => {
      this.inviteList = promiseData;
      this.filteredInvites = promiseData;
      console.log(promiseData);
      if (Object.keys(promiseData).length > 0) {
        this.hasInvites = true;
      }
    });
  });
}

  loadGroups() {
    const groups$ = this.groupService.getGroups();
    const contacts$ = this.contactService.getSignedContacts();
    const invites$ = this.groupService.getInvites();

    this.dataSub = combineLatest([groups$, contacts$, invites$])
      .subscribe(([groups, contacts, invites]) => {
        console.log(groups.data, contacts.data, invites);
        console.log(groups, contacts, invites);
        if (groups.data && contacts.data) {
          groups.data.forEach(group => {
            group.presenteeData = group.presenteeID ? this.getContactsData(group.presenteeID, contacts.data) : null;
            // group.daysleft = Math.floor((group.occasionDate - Date.now()) / 1000 / 60 / 60 / 24);
            group.daysleft = Math.round(Math.abs((group.occasionDate.toDate() - Date.now()) / 1000 / 60 / 60 / 24));
          });
        }
        if (invites) {
          invites.data.forEach(invite => {
            invite.presenteeData = invite.presenteeID ? this.getContactsData(invite.presenteeID, contacts.data) : null;
          });
        }
        // now the old promise code - for groups
        this.showSpinner = false;
        this.filteredGroups = this.groupList = !groups ? null : this.sortByDate(groups.data);
        this.hasGroups = groups ? true : false;
        // now the old promise code - for invites
        this.filteredInvites = this.inviteList = invites;
        this.hasInvites = invites.length > 0 ? true : false;
      });
  }



*/
