import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../utils/i18n.service';

@Pipe({
  name: 'i18n',
  standalone: true
})
export class I18nPipe implements PipeTransform {
  constructor(private readonly i18n: I18nService) {}

  transform(value: string): string {
    return this.i18n.t(value);
  }
}
