import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AddTemplateQuestionRequest,
  AddTemplateQuestionOptionRequest,
  TemplateStepDto,
  TemplateQuestionDto,
  ProjectWorkflowTemplateStepDto,
  ProjectWorkflowTemplateDto,
  TemplateDetailDto
} from '../../../../core/models/project-workflow.models';
import { QuestionFormComponent } from '../../components/question-form/question-form.component';
import { StepCardComponent } from '../../components/step-card/step-card.component';
import { ProjectWorkflowApiService } from '../../services/project-workflow-api.service';

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
          [editMode]="editingQuestion !== null"
          (submitTemplateQuestion)="upsertQuestion($event)" />
      </mat-card-content>
    </mat-card>

    @for (step of template?.steps ?? []; track step.templateStepId) {
      <app-step-card [step]="step" />
      @for (q of step.questions; track q.id) {
        <div class="question-actions">
          <button mat-button color="primary" (click)="editQuestion(q, step)">Duzenle</button>
        </div>
      }
    }
  `,
  styles: ['mat-card{margin-bottom:1rem}', '.question-actions{margin-bottom:1rem;}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateBuilderPage {
  private readonly api = inject(ProjectWorkflowApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  templateId = '';
  isActiveFilter: boolean | null = true;
  templates: ProjectWorkflowTemplateDto[] = [];
  templateSteps: ProjectWorkflowTemplateStepDto[] = [];
  selectedStepId = '';
  editingQuestion: TemplateQuestionDto | null = null;
  template: TemplateDetailDto | null = null;

  readonly templateForm = this.fb.nonNullable.group({
    name: ['Standart', Validators.required]
  });
  readonly stepForm = this.fb.nonNullable.group({
    title: ['Kesif', Validators.required]
  });
  constructor() {
    this.loadTemplates(this.isActiveFilter);
  }

  createTemplate(): void {
    this.api
      .createTemplate(this.templateForm.getRawValue())
      .pipe(
        switchMap((id) => (this.templateId = id, this.api.getTemplateById(id))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((x) => {
        this.template = x;
        this.templateId = x.templateId || x.id || this.templateId;
        this.loadTemplates(this.isActiveFilter);
        this.loadTemplateSteps(this.templateId);
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
              return this.api.getTemplateById(templateId);
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((x) => {
        this.template = x;
        this.templateId = x.templateId || x.id || templateId;
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((x) => {
        this.template = x;
        this.loadTemplateSteps(selectedTemplateId);
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
    this.selectedStepId = step.id;
    this.api
      .getTemplateQuestionOptions(question.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((options) => {
        this.editingQuestion = {
          ...question,
          options
        };
      });
  }

  upsertQuestion(event: {
    request: AddTemplateQuestionRequest;
    optionIdsToRemove: string[];
    editQuestionId: string | null;
    existingOptionIds: string[];
  }): void {
    const templateId = this.getResolvedTemplateId();
    if (!templateId) return;

    if (!event.editQuestionId) {
      this.createQuestionWithOptions(event.request, templateId);
      return;
    }

    this.syncQuestionOptions(event, templateId);
  }

  private createQuestionWithOptions(request: AddTemplateQuestionRequest, templateId: string): void {
    this.api
      .addTemplateQuestion({ ...request, options: [] })
      .pipe(
        switchMap((questionId) => {
          const optionCalls = (request.options ?? []).map((opt) =>
            this.api.addTemplateQuestionOption({ ...opt, templateQuestionId: questionId })
          );
          return optionCalls.length ? forkJoin(optionCalls) : of([]);
        }),
        switchMap(() => this.api.getTemplateById(templateId)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((x) => {
        this.template = x;
        this.templateId = x.templateId || x.id || templateId;
        this.editingQuestion = null;
      });
  }

  private syncQuestionOptions(
    event: {
      request: AddTemplateQuestionRequest;
      optionIdsToRemove: string[];
      editQuestionId: string | null;
      existingOptionIds: string[];
    },
    templateId: string
  ): void {
    const questionId = event.editQuestionId!;
    const options = event.request.options ?? [];

    const upserts = options.map((option) => {
      if (event.existingOptionIds.includes(option.templateQuestionId)) {
        return this.api.updateTemplateQuestionOption({
          id: option.templateQuestionId,
          templateQuestionId: questionId,
          code: option.code,
          label: option.label,
          value: option.value,
          order: option.order,
          isActive: option.isActive,
          isDefault: option.isDefault
        });
      }

      const addReq: AddTemplateQuestionOptionRequest = {
        templateQuestionId: questionId,
        code: option.code,
        label: option.label,
        value: option.value,
        order: option.order,
        isActive: option.isActive,
        isDefault: option.isDefault
      };
      return this.api.addTemplateQuestionOption(addReq);
    });

    const removals = event.optionIdsToRemove.map((id) => this.api.removeTemplateQuestionOption({ id }));

    const allOps = [...upserts, ...removals];

    (allOps.length ? forkJoin(allOps) : of([]))
      .pipe(switchMap(() => this.api.getTemplateById(templateId)), takeUntilDestroyed(this.destroyRef))
      .subscribe((x) => {
        this.template = x;
        this.templateId = x.templateId || x.id || templateId;
        this.editingQuestion = null;
      });
  }
}
