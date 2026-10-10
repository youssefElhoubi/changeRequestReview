import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { TimelineEvent } from '../../models/change-request.models';
import { CrTimelineComponent } from './cr-timeline.component';

describe('CrTimelineComponent', () => {
  let fixture: ComponentFixture<CrTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [CrTimelineComponent],
    }).compileComponents();
  });

  it('renders timeline events in chronological order without changing the input', () => {
    const events: TimelineEvent[] = [
      {
        id: 'event-2',
        type: 'submitted',
        actor: { id: 'u-bob', name: 'Bob' },
        at: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'event-1',
        type: 'created',
        actor: { id: 'u-bob', name: 'Bob' },
        at: '2026-01-01T00:00:00.000Z',
      },
    ];
    const originalOrder = [...events];
    fixture = TestBed.createComponent(CrTimelineComponent);
    fixture.componentInstance.events = events;
    fixture.detectChanges();

    const rendered = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="timeline-event"]'),
    ) as HTMLElement[];
    expect(rendered[0].textContent).toContain('created');
    expect(rendered[1].textContent).toContain('submitted');
    expect(events).toEqual(originalOrder);
  });
});
