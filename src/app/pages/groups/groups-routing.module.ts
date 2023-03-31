import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { redirectUnauthorizedTo, canActivate } from '@angular/fire/auth-guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);

import { GroupsPage } from './groups.page';

const routes: Routes = [
  {
    path: '',
    component: GroupsPage,
  } /** 
  {
    path: 'create',
    loadChildren: () => import('../group-create/group-create.module').then(m => m.GroupCreatePageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: ':id',
    loadChildren: () => import('../group/group.module').then(m => m.GroupPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  }, {
    path: 'group-members/:id',
    loadChildren: () => import('../group-members/group-members.module').then(m => m.GroupMembersPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  }*/,
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupsPageRoutingModule {}
