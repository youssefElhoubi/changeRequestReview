import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserPermission } from './features/change-requests/models/change-request.models';
import { AuthGuard } from './core/auth/auth.guard';
import { ForbiddenComponent } from './core/auth/forbidden.component';
import { LoginComponent } from './core/auth/login.component';
import { UserCreationComponent } from './core/auth/user-creation.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forbidden', component: ForbiddenComponent },
  {
    path: 'users/create',
    component: UserCreationComponent,
    canActivate: [AuthGuard],
    data: { role: 'approver' },
  },
  {
    path: 'change-requests',
    canActivate: [AuthGuard],
    data: { permission: UserPermission.ViewChangeRequests },
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
