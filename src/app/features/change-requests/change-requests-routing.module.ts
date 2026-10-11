import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../core/auth/auth.guard';
import { UserPermission } from './models/change-request.models';
import { CrListComponent } from './list/cr-list.component';
import { CrCreateComponent } from './create/cr-create.component';
import { CrMyRequestsComponent } from './my-requests/cr-my-requests.component';
import { CrDetailComponent } from './detail/cr-detail/cr-detail.component';

const routes: Routes = [
  { path: '', component: CrListComponent },
  {
    path: 'create',
    component: CrCreateComponent,
    canActivate: [AuthGuard],
    data: { permission: UserPermission.CreateChangeRequests },
  },
  {
    path: 'my-requests',
    component: CrMyRequestsComponent,
    canActivate: [AuthGuard],
    data: { permission: UserPermission.CreateChangeRequests },
  },
  {
    path: ':id',
    component: CrDetailComponent,
    canActivate: [AuthGuard],
    data: { permission: UserPermission.ViewChangeRequests },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChangeRequestsRoutingModule {}
