import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  template: `
    <main class="mx-auto max-w-lg px-4 py-16 text-center" role="alert">
      <div class="rounded-panel border border-line bg-surface p-8 shadow-surface sm:p-10">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-control bg-danger-50 text-danger-700">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h1 class="text-page-title font-bold tracking-tight text-ink">Access denied</h1>
        <p class="mt-2 text-sm text-muted">
          You do not have permission to view this page.
        </p>
        <button
          type="button"
          class="mt-6 inline-flex items-center justify-center rounded-control bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-surface transition duration-standard hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          (click)="goHome()"
        >
          Back to change requests
        </button>
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {
  constructor(private readonly router: Router) {}

  goHome(): void {
    void this.router.navigate(['/change-requests']);
  }
}
