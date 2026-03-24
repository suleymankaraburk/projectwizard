import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/project-workflow/pages/project-list/project-list.page').then(
        (m) => m.ProjectListPage
      )
  },
  {
    path: 'projects/create',
    loadComponent: () =>
      import('./features/project-workflow/pages/project-create/project-create.page').then(
        (m) => m.ProjectCreatePage
      )
  },
  {
    path: 'projects/:id',
    loadComponent: () =>
      import('./features/project-workflow/pages/project-detail/project-detail.page').then(
        (m) => m.ProjectDetailPage
      )
  },
  {
    path: 'templates',
    loadComponent: () =>
      import(
        './features/project-workflow/pages/template-builder/template-builder.page'
      ).then((m) => m.TemplateBuilderPage)
  },
  {
    path: 'tasks/:projectId',
    loadComponent: () =>
      import('./features/project-workflow/pages/task-board/task-board.page').then(
        (m) => m.TaskBoardPage
      )
  },
  {
    path: 'progress/:projectId',
    loadComponent: () =>
      import(
        './features/project-workflow/pages/progress-dashboard/progress-dashboard.page'
      ).then((m) => m.ProgressDashboardPage)
  },
  { path: '**', redirectTo: '' }
];
