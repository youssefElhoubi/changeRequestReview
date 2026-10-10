import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CrListComponent } from './list/cr-list.component';
import { CrDetailComponent } from './detail/cr-detail/cr-detail.component';

const routes: Routes = [
  { path: '', component: CrListComponent },
  { path: ':id', component: CrDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChangeRequestsRoutingModule {}
