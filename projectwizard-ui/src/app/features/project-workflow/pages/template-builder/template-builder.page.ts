import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import {
  AddTemplateQuestionRequest,
  AddTemplateQuestionOptionRequest,
  EmissionCategoryMethodDto,
  TemplateStepDto,
  TemplateQuestionDto,
  UpdateTemplateQuestionRequest,
  UpdateTemplateQuestionRequestOption,
  ProjectWorkflowTemplateStepDto,
  ProjectWorkflowTemplateDto,
  TemplateDetailDto,
  TemplateQuestionOptionDto
} from '../../../../core/models/project-workflow.models';
import { QuestionFormComponent } from '../../components/question-form/question-form.component';
import { StepCardComponent } from '../../components/step-card/step-card.component';
import { ProjectWorkflowApiService } from '../../services/project-workflow-api.service';

/** visibilityRuleJson içindeki benzersiz questionCode değerleri */
function extractQuestionCodesFromVisibilityRule(json: string | null | undefined): string[] {
  if (!json?.trim()) return [];
  try {
    const o = JSON.parse(json) as { conditions?: Array<{ questionCode?: string }> };
    const conds = o?.conditions;
    if (!Array.isArray(conds)) return [];
    const codes = new Set<string>();
    for (const c of conds) {
      const qc = String(c?.questionCode ?? '').trim();
      if (qc) codes.add(qc);
    }
    return Array.from(codes);
  } catch {
    return [];
  }
}

@Component({
  selector: 'app-template-builder-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    QuestionFormComponent,
    StepCardComponent
  ],
  template: `
    <mat-card>
      <mat-card-title>Template Secimi</mat-card-title>
      <mat-card-content>
        <div class="grid-2">
          <mat-form-field>
            <mat-label>Aktiflik Filtresi</mat-label>
            <mat-select [value]="isActiveFilter" (selectionChange)="onFilterChange($event.value)">
              <mat-option [value]="null">Tumleri</mat-option>
              <mat-option [value]="true">Sadece Aktif</mat-option>
              <mat-option [value]="false">Sadece Pasif</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Template</mat-label>
            <mat-select [value]="templateId" (selectionChange)="onTemplateChange($event.value)">
              @for (item of templates; track item.id) {
                <mat-option [value]="item.id">
                  {{ item.code }} - {{ item.name }} (v{{ item.version }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card>
      <mat-card-title>Template Builder</mat-card-title>
      <mat-card-content>
        <form [formGroup]="templateForm" class="grid-2" (ngSubmit)="createTemplate()">
          <mat-form-field>
            <mat-label>Template Name</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit">Template Olustur</button>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card>
      <mat-card-content>
        <form [formGroup]="stepForm" class="grid-2" (ngSubmit)="addStep()">
          <mat-form-field><mat-label>Step Title</mat-label><input matInput formControlName="title" /></mat-form-field>
          <button mat-stroked-button color="primary">Step Ekle</button>
        </form>

        <mat-form-field>
          <mat-label>Step</mat-label>
          <mat-select [(value)]="selectedStepId">
            @for (stepItem of templateSteps; track stepItem.id) {
              <mat-option [value]="stepItem.id">
                {{ stepItem.order }} - {{ stepItem.title }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <app-question-form
          mode="template"
          [stepId]="selectedStepId"
          [question]="editingQuestion"
          [templateAllQuestions]="allTemplateQuestions"
          [emissionCategoryMethods]="emissionCategoryMethods"
          [editMode]="editingQuestion !== null"
          (cancelTemplateEdit)="cancelEditing()"
          (submitTemplateQuestion)="upsertQuestion($event)" />
      </mat-card-content>
    </mat-card>

    @for (step of template?.steps ?? []; track step.templateStepId) {
      <app-step-card [step]="step" />
      @for (q of step.questions; track q.id) {
        <div class="question-row">
          <div class="question-meta">
            <div class="question-title">{{ q.order }} - {{ q.text }}</div>
            <div class="question-sub">{{ q.answerType }}</div>
          </div>
          <button mat-stroked-button color="primary" (click)="editQuestion(q, step)">Duzenle</button>
        </div>
      }
    }
  `,
  styles: [
    'mat-card{margin-bottom:1rem}',
    '.question-row{display:flex;gap:1rem;align-items:center;justify-content:space-between;margin:0 0 1rem 0;padding:.5rem .75rem;border:1px solid rgba(0,0,0,.08);border-radius:.5rem;}',
    '.question-meta{display:flex;flex-direction:column;gap:.125rem;min-width:0;}',
    '.question-title{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.question-sub{font-size:.85rem;opacity:.75;}'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateBuilderPage {
  private readonly api = inject(ProjectWorkflowApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  templateId = '';
  isActiveFilter: boolean | null = true;
  templates: ProjectWorkflowTemplateDto[] = [];
  templateSteps: ProjectWorkflowTemplateStepDto[] = [];
  selectedStepId = '';
  editingQuestion: TemplateQuestionDto | null = null;
  private currentEditingQuestionId: string | null = null;
  template: TemplateDetailDto | null = null;
  emissionCategoryMethods: EmissionCategoryMethodDto[] = [];

  get allTemplateQuestions(): TemplateQuestionDto[] {
    return (this.template?.steps ?? []).flatMap((s) => s.questions ?? []);
  }

  readonly templateForm = this.fb.nonNullable.group({
    name: ['Standart', Validators.required]
  });
  readonly stepForm = this.fb.nonNullable.group({
    title: ['Kesif', Validators.required]
  });
  constructor() {
    this.loadTemplates(this.isActiveFilter);
    this.loadEmissionCategoryMethods();
  }

  private loadEmissionCategoryMethods(): void {
    this.api
      .getEmissionCategoryMethods()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        this.emissionCategoryMethods = items ?? [];
        this.cdr.markForCheck();
      });
  }

  createTemplate(): void {
    this.api
      .createTemplate(this.templateForm.getRawValue())
      .pipe(
        switchMap((id) => (this.templateId = id, this.api.getTemplateById(id))),
        switchMap((x) => this.hydrateTemplateQuestionOptions(x)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((x) => {
        this.template = x;
        this.templateId = x.templateId || x.id || this.templateId;
        this.loadTemplates(this.isActiveFilter);
        this.loadTemplateSteps(this.templateId);
        this.cdr.markForCheck();
      });
  }

  addStep(): void {
    const templateId = this.getResolvedTemplateId();
    if (!templateId) return;
    this.api
      .addTemplateStep({
        templateId,
        title: this.stepForm.getRawValue().title,
        order: (this.template?.steps.length ?? 0) + 1
      })
      .pipe(
        switchMap((createdStep) =>
          this.api.getProjectWorkflowTemplateSteps(templateId).pipe(
            switchMap((steps) => {
              this.templateSteps = steps;
              this.selectedStepId = createdStep.id || steps.at(-1)?.id || '';
              return this.api
                .getTemplateById(templateId)
                .pipe(switchMap((d) => this.hydrateTemplateQuestionOptions(d)));
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((x) => {
        this.template = x;
        this.templateId = x.templateId || x.id || templateId;
        this.cdr.markForCheck();
      });
  }

  private getResolvedTemplateId(): string {
    return this.templateId || this.template?.templateId || this.template?.id || '';
  }

  onFilterChange(value: boolean | null): void {
    this.isActiveFilter = value;
    this.loadTemplates(value);
  }

  onTemplateChange(selectedTemplateId: string): void {
    this.templateId = selectedTemplateId;
    this.api
      .getTemplateById(selectedTemplateId)
      .pipe(
        switchMap((x) => this.hydrateTemplateQuestionOptions(x)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((x) => {
        this.template = x;
        this.loadTemplateSteps(selectedTemplateId);
        this.cdr.markForCheck();
      });
  }

  private loadTemplates(isActive: boolean | null): void {
    this.api
      .getProjectWorkflowTemplates(isActive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        this.templates = items;

        if (!this.templateId && items.length) {
          this.onTemplateChange(items[0].id);
          return;
        }

        const exists = items.some((x) => x.id === this.templateId);
        if (!exists && items.length) {
          this.onTemplateChange(items[0].id);
        }
      });
  }

  /**
   * GetTemplateById çoğu soruda options döndürmeyebilir; görünürlük kurallarında seçenek eşlemesi için
   * tüm seçmeli soruların seçeneklerini GetTemplateQuestionOptions ile doldurur.
   */
  private hydrateTemplateQuestionOptions(detail: TemplateDetailDto): Observable<TemplateDetailDto> {
    if (environment.useMockApi) {
      return of(detail);
    }

    const steps = detail.steps ?? [];
    const loads: Observable<{ key: string; options: TemplateQuestionOptionDto[] }>[] = [];

    for (const step of steps) {
      for (const q of step.questions ?? []) {
        if (q.answerType === 'Text') continue;
        if (Array.isArray(q.options) && q.options.length > 0) continue;
        const tid = String(q.templateQuestionId ?? q.id ?? '').trim();
        if (!tid) continue;
        const mapKey = String(q.id ?? q.templateQuestionId ?? tid).trim();
        loads.push(
          this.api.getTemplateQuestionOptions(tid).pipe(
            map((options) => ({ key: mapKey, options: options ?? [] }))
          )
        );
      }
    }

    if (!loads.length) {
      return of(detail);
    }

    return forkJoin(loads).pipe(
      map((rows) => {
        const byKey = new Map(rows.map((r) => [r.key, r.options]));
        const newSteps = steps.map((step) => ({
          ...step,
          questions: (step.questions ?? []).map((q) => {
            const k = String(q.id ?? q.templateQuestionId ?? '').trim();
            const loaded = k ? byKey.get(k) : undefined;
            if (loaded?.length) {
              return { ...q, options: loaded };
            }
            return q;
          })
        }));
        return { ...detail, steps: newSteps };
      })
    );
  }

  private loadTemplateSteps(templateId: string): void {
    if (!templateId) {
      this.templateSteps = [];
      this.selectedStepId = '';
      return;
    }

    this.api
      .getProjectWorkflowTemplateSteps(templateId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((steps) => {
        this.templateSteps = [...steps].sort((a, b) => a.order - b.order);
        const exists = this.templateSteps.some((x) => x.id === this.selectedStepId);
        if (!exists) {
          this.selectedStepId = this.templateSteps.at(0)?.id ?? '';
        }
      });
  }

  editQuestion(question: TemplateQuestionDto, step: TemplateStepDto): void {
    this.selectedStepId = step.id || step.templateStepId || this.selectedStepId;
    this.currentEditingQuestionId = question.id;
    const templateQuestionId = question.templateQuestionId ?? question.id;
    // Fill base question data immediately; options will be loaded async.
    this.editingQuestion = {
      ...question,
      options: []
    };
    this.cdr.markForCheck();

    const selfCode = (question.code ?? '').trim().toLowerCase();
    const refCodes = extractQuestionCodesFromVisibilityRule(question.visibilityRuleJson).filter(
      (c) => c.trim().toLowerCase() !== selfCode
    );

    const flat = (this.template?.steps ?? []).flatMap((s) => s.questions ?? []);
    const depOptionLoads: Observable<{
      mergeKey: string;
      mergeCode: string;
      options: TemplateQuestionOptionDto[];
    }>[] = [];

    for (const code of refCodes) {
      const refQ = flat.find((q) => (q.code ?? '').trim() === code.trim());
      if (!refQ || refQ.answerType === 'Text') continue;
      const tid = String(refQ.templateQuestionId ?? refQ.id ?? '').trim();
      if (!tid) continue;
      const mergeKey = String(refQ.id ?? refQ.templateQuestionId ?? tid).trim();
      const mergeCode = String(refQ.code ?? '').trim();
      depOptionLoads.push(
        this.api.getTemplateQuestionOptions(tid).pipe(
          map((options) => ({
            mergeKey,
            mergeCode,
            options: options ?? []
          }))
        )
      );
    }

    const editing$ = this.api.getTemplateQuestionOptions(String(templateQuestionId));
    const deps$ =
      depOptionLoads.length > 0
        ? forkJoin(depOptionLoads)
        : of(
            [] as Array<{
              mergeKey: string;
              mergeCode: string;
              options: TemplateQuestionOptionDto[];
            }>
          );

    forkJoin({ editing: editing$, deps: deps$ })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ editing, deps }) => {
        if (this.currentEditingQuestionId !== question.id) return;
        this.editingQuestion = {
          ...question,
          options: editing
        };
        this.mergeQuestionsOptionsIntoTemplate(deps);
        this.cdr.markForCheck();
      });
  }

  /** Görünürlük kuralındaki bağımlı soruların seçeneklerini şablon ağacına yazar (id veya code ile eşleşir). */
  private mergeQuestionsOptionsIntoTemplate(
    updates: Array<{ mergeKey: string; mergeCode: string; options: TemplateQuestionOptionDto[] }>
  ): void {
    if (!this.template?.steps?.length || !updates.length) return;
    const byId = new Map(updates.map((u) => [u.mergeKey, u.options]));
    const byCode = new Map(
      updates.filter((u) => u.mergeCode).map((u) => [u.mergeCode, u.options] as const)
    );
    this.template = {
      ...this.template,
      steps: this.template.steps.map((step) => ({
        ...step,
        questions: (step.questions ?? []).map((q) => {
          const k = String(q.id ?? q.templateQuestionId ?? '').trim();
          const c = String(q.code ?? '').trim();
          const opts = byId.get(k) ?? (c ? byCode.get(c) : undefined);
          if (opts && opts.length > 0) {
            return { ...q, options: opts };
          }
          return q;
        })
      }))
    };
  }

  upsertQuestion(event: {
    request: AddTemplateQuestionRequest;
    optionIdsToRemove: string[];
    editQuestionId: string | null;
    existingOptionIds: string[];
    optionsSnapshot: UpdateTemplateQuestionRequestOption[];
  }): void {
    const templateId = this.getResolvedTemplateId();
    if (!templateId) return;

    if (!event.editQuestionId) {
      this.createQuestionWithOptions(event.request, templateId);
      return;
    }

    this.updateTemplateQuestion(event, templateId);
  }

  cancelEditing(): void {
    this.editingQuestion = null;
    this.currentEditingQuestionId = null;
    this.cdr.markForCheck();
  }

  private createQuestionWithOptions(request: AddTemplateQuestionRequest, templateId: string): void {
    this.api
      .addTemplateQuestion({ ...request, options: [] })
      .pipe(
        switchMap((created) => {
          const resolvedQuestionId =
            typeof created === 'string'
              ? created
              : String(
                  (created as any)?.id ??
                    (created as any)?.questionId ??
                    (created as any)?.templateQuestionId ??
                    ''
                );

          if (!resolvedQuestionId) {
            throw new Error('AddTemplateQuestion did not return a question id.');
          }

          const optionCalls = (request.options ?? []).map((opt) =>
            this.api.addTemplateQuestionOption({ ...opt, templateQuestionId: resolvedQuestionId })
          );
          return optionCalls.length ? forkJoin(optionCalls) : of([]);
        }),
        switchMap(() => this.api.getTemplateById(templateId)),
        switchMap((x) => this.hydrateTemplateQuestionOptions(x)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((x) => {
        this.template = x;
        this.templateId = x.templateId || x.id || templateId;
        this.editingQuestion = null;
        this.currentEditingQuestionId = null;
        this.cdr.markForCheck();
      });
  }

  private updateTemplateQuestion(
    event: {
      request: AddTemplateQuestionRequest;
      optionIdsToRemove: string[];
      editQuestionId: string | null;
      existingOptionIds: string[];
      optionsSnapshot: UpdateTemplateQuestionRequestOption[];
    },
    templateId: string
  ): void {
    const updatePayload: UpdateTemplateQuestionRequest = {
      questionId: event.editQuestionId!,
      code: event.request.code,
      text: event.request.text,
      description: event.request.description,
      url: event.request.url ?? null,
      categoryCode: event.request.categoryCode ?? null,
      methodCode: event.request.methodCode ?? null,
      answerType: event.request.answerType,
      isRequired: event.request.isRequired,
      order: event.request.order,
      visibilityRuleJson: event.request.visibilityRuleJson ?? null,
      options:
        event.request.answerType === 'Text'
          ? []
          : event.optionsSnapshot.map((opt) => ({
              optionId: opt.optionId,
              code: opt.code,
              label: opt.label,
              value: opt.value,
              order: opt.order,
              isDefault: opt.isDefault,
              isActive: opt.isActive
            }))
    };

    this.api
      .updateTemplateQuestion(updatePayload)
      .pipe(
        switchMap(() => this.api.getTemplateById(templateId)),
        switchMap((x) => this.hydrateTemplateQuestionOptions(x)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((x) => {
        this.template = x;
        this.templateId = x.templateId || x.id || templateId;
        this.editingQuestion = null;
        this.currentEditingQuestionId = null;
        this.cdr.markForCheck();
      });
  }
}
