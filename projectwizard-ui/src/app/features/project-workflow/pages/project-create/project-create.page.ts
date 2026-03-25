import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectWorkflowApiService } from '../../services/project-workflow-api.service';

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-project-create-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <mat-card>
      <mat-card-title>Proje Olustur</mat-card-title>
      <mat-card-content>
        <form [formGroup]="form" class="grid-2" (ngSubmit)="submit()">
          <mat-form-field>
            <mat-label>Company Id</mat-label>
            <input matInput formControlName="companyId" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Proje Adi</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <button mat-raised-button color="primary" [disabled]="form.invalid || loading">Kaydet</button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectCreatePage {
  private readonly api = inject(ProjectWorkflowApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  loading = false;

  readonly form = this.fb.nonNullable.group({
    companyId: ['11111111-1111-1111-1111-111111111111', [Validators.required, Validators.pattern(GUID_PATTERN)]],
    name: ['', [Validators.required, Validators.minLength(3)]]
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.api
      .createProject(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false))
      )
      .subscribe((id) => void this.router.navigate(['/projects', id]));
  }
}
