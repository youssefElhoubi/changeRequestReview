import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ChangeRequestsRoutingModule } from './change-requests-routing.module';
import { CrListComponent } from './list/cr-list.component';
import { CrTableComponent } from './list/cr-table.component';
import { CrCreateComponent } from './create/cr-create.component';
import { CrMyRequestsComponent } from './my-requests/cr-my-requests.component';
import { CrDetailComponent } from './detail/cr-detail/cr-detail.component';
import { CrDiffTableComponent } from './detail/cr-diff-table/cr-diff-table.component';
import { CrTimelineComponent } from './detail/cr-timeline/cr-timeline.component';
import { CrActionsComponent } from './detail/cr-actions/cr-actions.component';

@NgModule({
  declarations: [
    CrListComponent,
    CrTableComponent,
    CrCreateComponent,
    CrMyRequestsComponent,
    CrDetailComponent,
    CrDiffTableComponent,
    CrTimelineComponent,
    CrActionsComponent,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ChangeRequestsRoutingModule],
})
export class ChangeRequestsModule {}

