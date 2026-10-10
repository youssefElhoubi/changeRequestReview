import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { TimelineEvent } from '../../models/change-request.models';

@Component({
  selector: 'app-cr-timeline',
  templateUrl: './cr-timeline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrTimelineComponent {
  @Input() events: TimelineEvent[] = [];

  get chronologicalEvents(): TimelineEvent[] {
    return [...this.events].sort(
      (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
    );
  }

  trackById(_index: number, event: TimelineEvent): string {
    return event.id;
  }
}
