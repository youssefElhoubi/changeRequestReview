import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  template: `
    <main class="mx-auto max-w-xl px-4 py-12 text-center" role="alert">
      <h1 class="text-3xl font-bold text-slate-900">Access denied</h1>
      <p class="mt-2 text-slate-600">
        You do not have permission to view this page.
      </p>
      <button
        type="button"
        class="mt-6 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white"
        (click)="goHome()"
      >
        Back to change requests
      </button>
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
