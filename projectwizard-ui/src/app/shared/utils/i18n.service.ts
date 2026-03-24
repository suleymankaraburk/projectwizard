import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly dictionary: Record<string, string> = {
    Draft: 'Taslak',
    InProgress: 'Devam Ediyor',
    Completed: 'Tamamlandi',
    Todo: 'Yapilacak',
    Done: 'Tamamlandi'
  };

  t(key: string): string {
    return this.dictionary[key] ?? key;
  }
}
