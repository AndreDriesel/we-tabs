import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'groups',
        loadChildren: () =>
          import('../pages/groups/groups.module').then(
            (m) => m.GroupsPageModule
          ),
      },
      {
        path: 'tab1',
        loadChildren: () =>
          import('../tab1/tab1.module').then((m) => m.Tab1PageModule),
      },
      {
        path: 'tab2',
        loadChildren: () =>
          import('../tab2/tab2.module').then((m) => m.Tab2PageModule),
      },
      {
        path: 'tab3',
        loadChildren: () =>
          import('../tab3/tab3.module').then((m) => m.Tab3PageModule),
      },
      {
        path: 'idea',
        loadChildren: () =>
          import('../pages/idea/idea.module').then((m) => m.IdeaPageModule),
      },
      {
        path: 'wish',
        loadChildren: () =>
          import('../pages/wish/wish.module').then((m) => m.WishPageModule),
      },
      {
        path: 'participations',
        loadChildren: () =>
          import('../pages/participations/participations.module').then(
            (m) => m.ParticipationsPageModule
          ),
      },
      {
        path: '',
        redirectTo: '/tabs/groups',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/groups',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
