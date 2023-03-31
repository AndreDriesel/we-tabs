import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GroupsPageRoutingModule } from './groups-routing.module';

import { GroupsPage } from './groups.page';

/**const routes: Routes = [
  {
    path: '',
    component: GroupsPage
  } , {
    path: 'create',
    loadChildren: () => import('./group-create/group-create.module').then( m => m.GroupCreatePageModule)
  }, {
    path: 'group-items/:groupID',
    loadChildren: './group-items/group-items.module#GroupItemsPageModule',
  }, {
    path: 'group-members/:groupID',
    loadChildren: './group-members/group-members.module#GroupMembersPageModule',
  }, {
    path: ':id',
    loadChildren: () => import('./group/group.module').then( m => m.GroupPageModule)
  }, {
    path: 'group-edit/:groupID',
    loadChildren: './group-edit/group-edit.module#GroupEditPageModule',
  },
];
*/
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GroupsPageRoutingModule
  ],
  declarations: [GroupsPage]
})
export class GroupsPageModule {}
