import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ProjectTaskDto, TaskStatus } from '../../../../core/models/project-workflow.models';
import { SubtaskItemComponent } from '../subtask-item/subtask-item.component';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatButtonToggleModule, SubtaskItemComponent],
  template: `
    <mat-card>
      <mat-card-title>{{ task.title }}</mat-card-title>
      <mat-card-content>
        <mat-button-toggle-group [value]="task.status" (change)="taskStatusChange.emit($any($event.value))">
          <mat-button-toggle value="Todo">Todo</mat-button-toggle>
          <mat-button-toggle value="InProgress">InProgress</mat-button-toggle>
          <mat-button-toggle value="Done">Done</mat-button-toggle>
        </mat-button-toggle-group>

        @if (task.actionType === 'OpenUrl' && task.actionPayload) {
          <button mat-stroked-button class="action-btn" (click)="open(task.actionPayload)">Aksiyon Linki</button>
        }
        @if (task.actionType === 'ShowMappedData' && task.actionPayload) {
          <pre class="payload">{{ task.actionPayload }}</pre>
        }

        @for (sub of task.subtasks; track sub.subTaskId) {
          <app-subtask-item [subTask]="sub" (statusChange)="subTaskStatusChange.emit({ id: sub.subTaskId, status: $event })" />
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: ['.action-btn{margin:.75rem 0}.payload{background:#eceff1;padding:.5rem;border-radius:4px;}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskItemComponent {
  @Input({ required: true }) task!: ProjectTaskDto;
  @Output() readonly taskStatusChange = new EventEmitter<TaskStatus>();
  @Output() readonly subTaskStatusChange = new EventEmitter<{ id: number; status: TaskStatus }>();

  open(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
