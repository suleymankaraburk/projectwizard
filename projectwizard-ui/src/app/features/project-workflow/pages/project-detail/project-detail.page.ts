import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { EMPTY, filter, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectDetailDto, ProjectQuestionDto } from '../../../../core/models/project-workflow.models';
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
    MatRadioModule,
    MatCheckboxModule,
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

    @for (q of questions; track q.id) {
      <mat-card>
        <mat-card-title>{{ q.text }}</mat-card-title>
        <mat-card-content>
          @if (q.answerType === 'Text') {
            <mat-form-field class="full">
              <mat-label>Cevap</mat-label>
              <input matInput [value]="textAnswerByQuestionId[q.id] || ''" (input)="setText(q.id, $any($event.target).value)" />
            </mat-form-field>
            <button mat-button color="primary" (click)="saveTextAnswer(q)">
              Kaydet
            </button>
          } @else if (q.answerType === 'SingleSelect') {
            <mat-radio-group
              class="options-list"
              [value]="singleSelectedOptionIdByQuestionId[q.id] || ''"
              (change)="setSingle(q.id, $event.value)">
              @for (opt of q.options; track opt.id) {
                <mat-radio-button [value]="opt.id">
                  {{ opt.label }}
                </mat-radio-button>
              }
            </mat-radio-group>
            <button mat-button color="primary" (click)="saveSelectAnswer(q)">Kaydet</button>
          } @else {
            <div class="options-list">
              @for (opt of q.options; track opt.id) {
                <div class="option-item">
                  <mat-checkbox
                    [checked]="isMultiSelected(q.id, opt.id)"
                    (change)="toggleMulti(q.id, opt.id, $event.checked)">
                    {{ opt.label }}
                  </mat-checkbox>
                </div>
              }
            </div>
            <button mat-button color="primary" (click)="saveSelectAnswer(q)">Kaydet</button>
          }
          @if (q.isCustom) {
            <button mat-button color="warn" (click)="remove(q)">Sil</button>
          }
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [
    '.full{width:100%} mat-card{margin-bottom:1rem;}',
    '.options-list{display:flex;flex-direction:column;gap:.5rem;}',
    '.option-item{display:flex;gap:.5rem;align-items:center;padding:.25rem .5rem;border:1px solid rgba(0,0,0,.08);border-radius:.375rem;}'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ProjectWorkflowApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  projectId = '';
  projectName = '';
  project: ProjectDetailDto | null = null;
  questions: ProjectQuestionDto[] = [];
  textAnswerByQuestionId: Record<string, string> = {};
  singleSelectedOptionIdByQuestionId: Record<string, string> = {};
  multiSelectedOptionIdsByQuestionId: Record<string, Set<string>> = {};

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
            this.cdr.markForCheck();
            return EMPTY;
          }
          return this.api.getProjectById(this.projectId);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((project) => {
        this.project = project;
        this.projectName = project.name;
        this.questions = [...project.questions];
        this.hydrateAnswerStateFromServer(project.questions);
        this.cdr.markForCheck();
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
      .subscribe((project) => {
        this.project = project;
        this.questions = project.questions;
        this.hydrateAnswerStateFromServer(project.questions);
        this.cdr.markForCheck();
      });
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
      .subscribe((project) => {
        this.project = project;
        this.questions = project.questions;
        this.hydrateAnswerStateFromServer(project.questions);
        this.cdr.markForCheck();
      });
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
          this.api.removeProjectQuestion({ projectQuestionId: question.id })
        ),
        switchMap(() => this.api.getProjectById(this.projectId)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((project) => {
        this.project = project;
        this.questions = project.questions;
        this.hydrateAnswerStateFromServer(project.questions);
        this.cdr.markForCheck();
      });
  }

  setText(questionId: string, value: string): void {
    this.textAnswerByQuestionId[questionId] = value ?? '';
  }

  setSingle(questionId: string, optionId: string): void {
    this.singleSelectedOptionIdByQuestionId[questionId] = optionId ?? '';
  }

  isMultiSelected(questionId: string, optionId: string): boolean {
    return this.multiSelectedOptionIdsByQuestionId[questionId]?.has(optionId) ?? false;
  }

  toggleMulti(questionId: string, optionId: string, checked: boolean): void {
    const set = this.multiSelectedOptionIdsByQuestionId[questionId] ?? new Set<string>();
    if (checked) set.add(optionId);
    else set.delete(optionId);
    this.multiSelectedOptionIdsByQuestionId[questionId] = set;
  }

  saveTextAnswer(question: ProjectQuestionDto): void {
    const value = this.textAnswerByQuestionId[question.id] ?? '';
    this.saveAnswerPayload(
      question,
      JSON.stringify({
        questionId: question.id,
        answerType: question.answerType,
        methodCode: question.methodCode ?? null,
        categorycode: question.categoryCode ?? null,
        url: question.url ?? null,
        value
      })
    );
  }

  saveSelectAnswer(question: ProjectQuestionDto): void {
    if (question.answerType === 'SingleSelect') {
      const selectedOptionId = this.singleSelectedOptionIdByQuestionId[question.id] ?? null;
      const selected = selectedOptionId
        ? question.options
            .filter((o) => o.id === selectedOptionId)
            .map((o) => ({ optionId: o.id, code: o.code, label: o.label }))
        : [];
      this.saveAnswerPayload(
        question,
        JSON.stringify({
          questionId: question.id,
          answerType: question.answerType,
          methodCode: question.methodCode ?? null,
          categoryCode: question.categoryCode ?? null,
          url: question.url ?? null,
          options: (question.options ?? []).map((o) => ({ optionId: o.id, code: o.code, label: o.label })),
          selectedOptions: selected
        })
      );
      return;
    }

    const selectedOptionIds = Array.from(this.multiSelectedOptionIdsByQuestionId[question.id] ?? []);
    const selected = question.options
      .filter((o) => selectedOptionIds.includes(o.id))
      .map((o) => ({ optionId: o.id, code: o.code, label: o.label }));
    this.saveAnswerPayload(
      question,
      JSON.stringify({
        questionId: question.id,
        answerType: question.answerType,
        methodCode: question.methodCode ?? null,
        categoryCode: question.categoryCode ?? null,
        url: question.url ?? null,
        options: (question.options ?? []).map((o) => ({ optionId: o.id, code: o.code, label: o.label })),
        selectedOptions: selected
      })
    );
  }

  private saveAnswerPayload(question: ProjectQuestionDto, valueJson: string): void {
    this.api
      .saveProjectAnswer({
        projectQuestionId: question.id,
        answerType: question.answerType,
        valueJson
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private hydrateAnswerStateFromServer(questions: ProjectQuestionDto[]): void {
    for (const q of questions ?? []) {
      const answers = q.answers ?? [];
      if (!answers.length) continue;

      // pick latest by answeredAt if present, else last
      const latest = [...answers].sort((a, b) => {
        const atA = a.answeredAt ? Date.parse(a.answeredAt) : 0;
        const atB = b.answeredAt ? Date.parse(b.answeredAt) : 0;
        return atA - atB;
      }).at(-1);
      if (!latest?.valueJson) continue;

      let parsed: any;
      try {
        parsed = JSON.parse(latest.valueJson);
      } catch {
        continue;
      }

      if (q.answerType === 'Text') {
        const value = parsed?.value;
        if (typeof value === 'string') {
          this.textAnswerByQuestionId[q.id] = value;
        }
        continue;
      }

      // Prefer selectedOptions array (your format)
      const selectedOptions = Array.isArray(parsed?.selectedOptions) ? parsed.selectedOptions : null;
      if (selectedOptions) {
        const ids = selectedOptions
          .map((x: any) => x?.optionId)
          .filter((x: any) => typeof x === 'string');
        if (q.answerType === 'SingleSelect') {
          this.singleSelectedOptionIdByQuestionId[q.id] = ids.at(0) ?? '';
        } else {
          this.multiSelectedOptionIdsByQuestionId[q.id] = new Set(ids);
        }
        continue;
      }

      // Backward-compat fallbacks
      if (q.answerType === 'SingleSelect') {
        const id = parsed?.selectedOptionId;
        if (typeof id === 'string') this.singleSelectedOptionIdByQuestionId[q.id] = id;
      } else {
        const ids = Array.isArray(parsed?.selectedOptionIds) ? parsed.selectedOptionIds : [];
        const normalized = ids.filter((x: any) => typeof x === 'string');
        if (normalized.length) this.multiSelectedOptionIdsByQuestionId[q.id] = new Set(normalized);
      }
    }
  }
}
