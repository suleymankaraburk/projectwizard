import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
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
        [completed]="totalCompleted"
        [total]="totalCount" />

      <div class="grid-2">
        @for (step of progress.steps; track step.stepId) {
          <app-progress-card
            [title]="step.estimatedDuration ? step.stepTitle + ' (' + step.estimatedDuration + ')' : step.stepTitle"
            [percent]="step.totalTaskCount ? (step.completedTaskCount / step.totalTaskCount) * 100 : 0"
            [completed]="step.completedTaskCount"
            [total]="step.totalTaskCount" />
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
  private readonly cdr = inject(ChangeDetectorRef);
  progress: ProjectProgressDto | null = null;

  get totalCompleted(): number {
    return (this.progress?.steps ?? []).reduce((sum, s) => sum + (s.completedTaskCount || 0), 0);
  }

  get totalCount(): number {
    return (this.progress?.steps ?? []).reduce((sum, s) => sum + (s.totalTaskCount || 0), 0);
  }

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => this.api.getProjectProgress(String(params.get('projectId') ?? '').trim())),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((x) => {
        this.progress = x;
        this.cdr.markForCheck();
      });
  }
}
