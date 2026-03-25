import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { filter, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectQuestionDto } from '../../../../core/models/project-workflow.models';
import { ConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { QuestionFormComponent } from '../../components/question-form/question-form.component';
import { ProjectWorkflowApiService } from '../../services/project-workflow-api.service';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    QuestionFormComponent
  ],
  template: `
    <mat-card>
      <mat-card-title>{{ projectName }}</mat-card-title>
      <mat-card-content>
        <form [formGroup]="applyForm" class="grid-2" (ngSubmit)="applyTemplate()">
          <mat-form-field>
            <mat-label>Template Id</mat-label>
            <input matInput formControlName="templateId" />
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit">Template Uygula</button>
        </form>
      </mat-card-content>
    </mat-card>

    <app-question-form (createQuestion)="addQuestion($event)" />

    @for (q of questions; track q.projectQuestionId) {
      <mat-card>
        <mat-card-title>{{ q.text }}</mat-card-title>
        <mat-card-content>
          <mat-form-field class="full">
            <mat-label>Cevap</mat-label>
            <input matInput [value]="q.answer ?? ''" #answerInput />
          </mat-form-field>
          <button mat-button color="primary" (click)="saveAnswer(q, answerInput.value)">Kaydet</button>
          @if (q.isCustom) {
            <button mat-button color="warn" (click)="remove(q)">Sil</button>
          }
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: ['.full{width:100%} mat-card{margin-bottom:1rem;}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ProjectWorkflowApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  projectId = '';
  projectName = '';
  questions: ProjectQuestionDto[] = [];

  readonly applyForm = this.fb.nonNullable.group({
    templateId: ['11111111-1111-1111-1111-111111111111', [Validators.required]]
  });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.projectId = String(params.get('id') ?? '').trim();
          if (!this.projectId) {
            this.projectName = 'Gecersiz Proje';
            this.questions = [];
            return [];
          }
          return this.api.getProjectById(this.projectId);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((project) => {
        this.projectName = project.name;
        this.questions = [...project.questions].sort((a, b) => a.order - b.order);
      });
  }

  applyTemplate(): void {
    if (this.applyForm.invalid) return;
    this.api
      .applyTemplateToProject({
        projectId: this.projectId,
        templateId: this.applyForm.getRawValue().templateId
      })
      .pipe(
        switchMap(() => this.api.getProjectById(this.projectId)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((project) => (this.questions = project.questions));
  }

  addQuestion(event: { text: string; answerType: string }): void {
    this.api
      .addProjectQuestion({
        projectId: this.projectId,
        text: event.text,
        answerType: event.answerType,
        order: this.questions.length + 1,
        required: false
      })
      .pipe(switchMap(() => this.api.getProjectById(this.projectId)), takeUntilDestroyed(this.destroyRef))
      .subscribe((project) => (this.questions = project.questions));
  }

  remove(question: ProjectQuestionDto): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Soruyu Sil', message: 'Bu soruyu silmek istiyor musun?' }
      })
      .afterClosed()
      .pipe(
        filter((confirmed) => Boolean(confirmed)),
        switchMap(() =>
          this.api.removeProjectQuestion({ projectQuestionId: question.projectQuestionId })
        ),
        switchMap(() => this.api.getProjectById(this.projectId)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((project) => (this.questions = project.questions));
  }

  saveAnswer(question: ProjectQuestionDto, answer: string): void {
    this.api
      .saveProjectAnswer({ projectQuestionId: question.projectQuestionId, answer })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.questions = this.questions.map((q) =>
          q.projectQuestionId === question.projectQuestionId ? { ...q, answer } : q
        );
      });
  }
}
