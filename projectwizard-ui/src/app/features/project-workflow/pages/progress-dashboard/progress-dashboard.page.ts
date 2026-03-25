import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectProgressDto } from '../../../../core/models/project-workflow.models';
import { ProgressCardComponent } from '../../../../shared/ui/progress-card/progress-card.component';
import { ProjectWorkflowApiService } from '../../services/project-workflow-api.service';

@Component({
  selector: 'app-progress-dashboard-page',
  standalone: true,
  imports: [MatCardModule, ProgressCardComponent],
  template: `
    @if (progress) {
      <app-progress-card
        [title]="'Genel Tamamlanma'"
        [percent]="progress.completionPercent"
        [completed]="progress.totalCompleted"
        [total]="progress.totalCount" />

      <div class="grid-2">
        @for (step of progress.steps; track step.stepTitle) {
          <app-progress-card
            [title]="step.stepTitle"
            [percent]="step.total ? (step.completed / step.total) * 100 : 0"
            [completed]="step.completed"
            [total]="step.total" />
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressDashboardPage {
  private readonly api = inject(ProjectWorkflowApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  progress: ProjectProgressDto | null = null;

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => this.api.getProjectProgress(String(params.get('projectId') ?? '').trim())),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((x) => (this.progress = x));
  }
}
