import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { I18nPipe } from '../../pipes/i18n.pipe';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [MatChipsModule, I18nPipe],
  template: `<mat-chip [highlighted]="true">{{ status | i18n }}</mat-chip>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  @Input({ required: true }) status = '';
}
