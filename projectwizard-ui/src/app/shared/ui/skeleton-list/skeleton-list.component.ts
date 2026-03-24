import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-skeleton-list',
  standalone: true,
  imports: [MatProgressBarModule],
  template: `
    @for (_ of rowsArray; track $index) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }
  `,
  styles: ['mat-progress-bar{margin:.5rem 0;}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonListComponent {
  @Input() rows = 4;
  get rowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
