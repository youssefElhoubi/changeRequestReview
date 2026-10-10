import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { ChangeEntry } from '../../models/change-request.models';
import { CrDiffTableComponent } from './cr-diff-table.component';

describe('CrDiffTableComponent', () => {
  let fixture: ComponentFixture<CrDiffTableComponent>;

  const changes: ChangeEntry[] = [
    { id: 'added', field: 'New limit', before: null, after: 100 },
    { id: 'removed', field: 'Removed limit', before: 50, after: null },
    { id: 'changed', field: 'Changed limit', before: 10, after: 20 },
    { id: 'unchanged', field: 'Zero limit', before: 0, after: 0 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [CrDiffTableComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CrDiffTableComponent);
    fixture.componentInstance.changes = changes;
    fixture.detectChanges();
  });

  it('renders every diff entry with its before, after, and delta values', () => {
    const rows = fixture.nativeElement.querySelectorAll(
      '[data-testid="diff-row"]',
    );

    expect(rows).toHaveLength(4);
    expect(rows[0].textContent).toContain('New limit');
    expect(rows[0].textContent).toContain('—');
    expect(rows[0].textContent).toContain('100');
    expect(rows[1].textContent).toContain('Removed limit');
    expect(rows[1].textContent).toContain('50');
    expect(rows[1].textContent).toContain('—');
    expect(rows[2].textContent).toContain('10');
    expect(rows[2].textContent).toContain('20');
    expect(rows[2].textContent).toContain('10');
    expect(rows[3].textContent).toContain('Zero limit');
    expect(rows[3].textContent).toContain('0');
  });

  it('renders classification tags and aggregate totals', () => {
    const statuses = fixture.nativeElement.querySelectorAll(
      '[data-testid="diff-status"]',
    );
    const totals = fixture.nativeElement.querySelector(
      '[data-testid="diff-totals"]',
    );

    expect(
      Array.from(statuses).map(
        (status) => (status as HTMLElement).textContent?.trim() ?? '',
      ),
    ).toEqual(['Added', 'Removed', 'Changed', 'Unchanged']);
    expect(totals.textContent).toContain('60');
    expect(totals.textContent).toContain('120');
    expect(totals.textContent).toContain('60');
  });
});
