import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ProjectSubTaskDto, TaskStatus } from '../../../../core/models/project-workflow.models';

@Component({
  selector: 'app-subtask-item',
  standalone: true,
  imports: [MatButtonToggleModule],
  template: `
    <div class="item">
      <span>{{ subTask.title }}</span>
      <mat-button-toggle-group
        [value]="subTask.status"
        (change)="statusChange.emit($any($event.value))">
        <mat-button-toggle value="Todo">Todo</mat-button-toggle>
        <mat-button-toggle value="InProgress">InProgress</mat-button-toggle>
        <mat-button-toggle value="Completed">Completed</mat-button-toggle>
      </mat-button-toggle-group>
    </div>
  `,
  styles: ['.item { display: flex; justify-content: space-between; margin: .5rem 0; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubtaskItemComponent {
  @Input({ required: true }) subTask!: ProjectSubTaskDto;
  @Output() readonly statusChange = new EventEmitter<TaskStatus>();
}
