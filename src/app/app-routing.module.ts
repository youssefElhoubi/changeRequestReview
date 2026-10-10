import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'change-requests',
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
