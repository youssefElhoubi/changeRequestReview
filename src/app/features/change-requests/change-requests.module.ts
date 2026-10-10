import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChangeRequestsRoutingModule } from './change-requests-routing.module';
import { CrListComponent } from './list/cr-list.component';
import { CrTableComponent } from './list/cr-table.component';
import { CrDetailComponent } from './detail/cr-detail/cr-detail.component';
import { CrDiffTableComponent } from './detail/cr-diff-table/cr-diff-table.component';
import { CrTimelineComponent } from './detail/cr-timeline/cr-timeline.component';
import { CrActionsComponent } from './detail/cr-actions/cr-actions.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    CrListComponent,
    CrTableComponent,
    CrDetailComponent,
    CrDiffTableComponent,
    CrTimelineComponent,
    CrActionsComponent,
  ],
  imports: [CommonModule, FormsModule, ChangeRequestsRoutingModule],
})
export class ChangeRequestsModule {}
