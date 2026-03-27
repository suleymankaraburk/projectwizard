import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectTaskDto, TaskStatus } from '../../../../core/models/project-workflow.models';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { TaskItemComponent } from '../../components/task-item/task-item.component';
import { ProjectWorkflowApiService } from '../../services/project-workflow-api.service';

@Component({
  selector: 'app-task-board-page',
  standalone: true,
  imports: [MatButtonModule, TaskItemComponent, EmptyStateComponent],
  template: `
    <button mat-raised-button color="primary" (click)="rebuild()">Cevaplardan Task Uret</button>

    @if (!tasks.length) {
      <app-empty-state message="Task bulunamadi." />
    }

    @for (task of tasks; track task.taskId) {
      <app-task-item
        [task]="task"
        (taskStatusChange)="updateTask(task.taskId, $event)"
        (subTaskStatusChange)="updateSubTask($event.id, $event.status)" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskBoardPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ProjectWorkflowApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  projectId = '';
  tasks: ProjectTaskDto[] = [];

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.projectId = String(params.get('projectId') ?? '').trim();
          return this.api.getProjectTasks(this.projectId);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((tasks) => {
        this.tasks = tasks;
        this.cdr.markForCheck();
      });
  }

  rebuild(): void {
    this.api
      .rebuildTasksFromAnswers({ projectId: this.projectId })
      .pipe(switchMap(() => this.api.getProjectTasks(this.projectId)), takeUntilDestroyed(this.destroyRef))
      .subscribe((tasks) => {
        this.tasks = tasks;
        this.cdr.markForCheck();
      });
  }

  updateTask(taskId: string, status: TaskStatus): void {
    this.api
      .updateTaskStatus({
        projectId: this.projectId,
        taskId,
        status
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.tasks = this.tasks.map((t) => (t.taskId === taskId ? { ...t, status } : t));
        this.cdr.markForCheck();
      });
  }

  updateSubTask(subTaskId: string, status: TaskStatus): void {
    this.api
      .updateSubTaskStatus({ subTaskId, status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.tasks = this.tasks.map((t) => ({
          ...t,
          subtasks: t.subtasks.map((s) => (s.subTaskId === subTaskId ? { ...s, status } : s))
        }));
        this.cdr.markForCheck();
      });
  }
}
