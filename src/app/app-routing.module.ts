import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },  {
    path: 'groups',
    loadChildren: () => import('./pages/groups/groups.module').then( m => m.GroupsPageModule)
  },
  {
    path: 'idea',
    loadChildren: () => import('./pages/idea/idea.module').then( m => m.IdeaPageModule)
  },
  {
    path: 'wish',
    loadChildren: () => import('./pages/wish/wish.module').then( m => m.WishPageModule)
  },
  {
    path: 'participations',
    loadChildren: () => import('./pages/participations/participations.module').then( m => m.ParticipationsPageModule)
  },
  {
    path: 'groups',
    loadChildren: () => import('./pages/groups/groups.module').then( m => m.GroupsPageModule)
  },
  {
    path: 'idea',
    loadChildren: () => import('./pages/idea/idea.module').then( m => m.IdeaPageModule)
  },
  {
    path: 'wish',
    loadChildren: () => import('./pages/wish/wish.module').then( m => m.WishPageModule)
  },
  {
    path: 'participations',
    loadChildren: () => import('./pages/participations/participations.module').then( m => m.ParticipationsPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  }

];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
