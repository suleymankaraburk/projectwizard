import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectSummaryDto } from '../../../../core/models/project-workflow.models';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { ProgressCardComponent } from '../../../../shared/ui/progress-card/progress-card.component';
import { SkeletonListComponent } from '../../../../shared/ui/skeleton-list/skeleton-list.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge.component';
import { ProjectWorkflowApiService } from '../../services/project-workflow-api.service';

@Component({
  selector: 'app-project-list-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    EmptyStateComponent,
    StatusBadgeComponent,
    ProgressCardComponent,
    SkeletonListComponent
  ],
  template: `
    <section class="toolbar">
      <mat-form-field>
        <mat-label>Company Id</mat-label>
        <input matInput type="number" [(ngModel)]="companyId" />
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="load()">Filtrele</button>
    </section>

    @if (loading) {
      <app-skeleton-list />
    } @else if (!projects.length) {
      <app-empty-state message="Bu filtreye ait proje bulunamadi." />
    } @else {
      <div class="grid-2">
        @for (project of projects; track project.projectId) {
          <mat-card>
            <mat-card-title>{{ project.name }}</mat-card-title>
            <mat-card-content>
              <app-status-badge [status]="project.status" />
              <app-progress-card
                [title]="'Ilerleme'"
                [percent]="project.completionPercent"
                [completed]="project.completionPercent"
                [total]="100" />
            </mat-card-content>
            <mat-card-actions>
              <button mat-button [routerLink]="['/projects', project.projectId]">Detay</button>
              <button mat-button [routerLink]="['/tasks', project.projectId]">Task</button>
              <button mat-button [routerLink]="['/progress', project.projectId]">Progress</button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    }
  `,
  styles: ['.toolbar{display:flex;gap:1rem;align-items:flex-end;margin-bottom:1rem}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectListPage {
  private readonly api = inject(ProjectWorkflowApiService);
  private readonly destroyRef = inject(DestroyRef);
  companyId = 1;
  loading = false;
  projects: ProjectSummaryDto[] = [];

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api
      .getProjects(this.companyId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false))
      )
      .subscribe((data) => (this.projects = data));
  }
}
