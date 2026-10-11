import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserCreationComponent } from './core/auth/user-creation.component';

const routes: Routes = [
  { path: 'users/create', component: UserCreationComponent },
  {
    path: 'change-requests',
    loadChildren: () =>
      import('./features/change-requests/change-requests.module').then(
        (module) => module.ChangeRequestsModule,
      ),
  },
  { path: '', redirectTo: 'change-requests', pathMatch: 'full' },
  { path: '**', redirectTo: 'change-requests' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
