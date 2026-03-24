import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-progress-card',
  standalone: true,
  imports: [MatCardModule, MatProgressBarModule],
  template: `
    <mat-card>
      <mat-card-title>{{ title }}</mat-card-title>
      <mat-card-subtitle>{{ completed }}/{{ total }} tamamlandi</mat-card-subtitle>
      <mat-progress-bar mode="determinate" [value]="percent"></mat-progress-bar>
    </mat-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressCardComponent {
  @Input() title = 'Genel Ilerleme';
  @Input() completed = 0;
  @Input() total = 0;
  @Input() percent = 0;
}
