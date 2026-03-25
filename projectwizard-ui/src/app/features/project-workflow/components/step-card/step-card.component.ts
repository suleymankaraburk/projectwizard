import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TemplateStepDto } from '../../../../core/models/project-workflow.models';

@Component({
  selector: 'app-step-card',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-title>{{ step.title }}</mat-card-title>
      <mat-card-subtitle>{{ step.order }}. adim</mat-card-subtitle>
      <mat-card-content>
        @for (q of step.questions; track q.id) {
          <p>{{ q.order }} - {{ q.text }} ({{ q.answerType }})</p>
          @if (q.description) {
            <p>{{ q.description }}</p>
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepCardComponent {
  @Input({ required: true }) step!: TemplateStepDto;
}
