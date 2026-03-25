import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  AddTemplateQuestionRequest,
  TemplateAnswerType,
  TemplateQuestionDto,
  TemplateQuestionOptionDto,
  UpdateTemplateQuestionRequestOption
} from '../../../../core/models/project-workflow.models';

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="grid-2">
      <mat-form-field>
        <mat-label>Code</mat-label>
        <input matInput formControlName="code" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Soru</mat-label>
        <input matInput formControlName="text" />
      </mat-form-field>
      <mat-form-field class="full-width">
        <mat-label>Aciklama</mat-label>
        <textarea matInput formControlName="description" rows="2"></textarea>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Answer Type</mat-label>
        <mat-select formControlName="answerType">
          <mat-option value="Text">Text</mat-option>
          <mat-option value="SingleSelect">SingleSelect</mat-option>
          <mat-option value="MultiSelect">MultiSelect</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Order</mat-label>
        <input matInput type="number" formControlName="order" />
      </mat-form-field>

      <mat-checkbox formControlName="isRequired">Zorunlu</mat-checkbox>

      @if (showOptions) {
        <div class="options-wrap" formArrayName="options">
          <div class="header-row">
            <h4>Options</h4>
            <button mat-stroked-button type="button" (click)="addOption()">Option Ekle</button>
          </div>

          @for (ctrl of options.controls; track $index) {
            <div class="option-row" [formGroupName]="$index">
              <mat-form-field><mat-label>Code</mat-label><input matInput formControlName="code" /></mat-form-field>
              <mat-form-field><mat-label>Label</mat-label><input matInput formControlName="label" /></mat-form-field>
              <mat-form-field><mat-label>Value</mat-label><input matInput formControlName="value" /></mat-form-field>
              <mat-form-field><mat-label>Order</mat-label><input matInput type="number" formControlName="order" /></mat-form-field>
              <mat-checkbox formControlName="isDefault">Default</mat-checkbox>
              <button mat-button color="warn" type="button" (click)="removeOption($index)">Sil</button>
            </div>
          }
        </div>
      }

      @if (errorMessage) {
        <p class="error">{{ errorMessage }}</p>
      }

      <button mat-raised-button color="primary" type="submit">
        {{ editMode ? 'Soruyu Guncelle' : 'Soru Ekle' }}
      </button>
    </form>
  `,
  styles: [
    '.options-wrap{grid-column:1/-1;}',
    '.full-width{grid-column:1/-1;}',
    '.option-row{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.5rem;align-items:center;}',
    '.header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;}',
    '.error{color:#b00020;grid-column:1/-1;}'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionFormComponent {
  private readonly fb = inject(FormBuilder);

  @Input() mode: 'project' | 'template' = 'project';
  @Input() stepId = '';
  @Input() editMode = false;
  @Input() set question(value: TemplateQuestionDto | null) {
    this.questionInput = value;
    if (!value) {
      this.resetForCreate();
      return;
    }

    this.form.patchValue({
      id: value.id,
      code: value.code,
      text: value.text,
      description: value.description ?? '',
      answerType: value.answerType,
      isRequired: value.isRequired,
      order: value.order
    });

    this.options.clear();
    for (const option of value.options ?? []) {
      this.options.push(this.createOptionGroup(option));
    }
  }

  @Output() readonly createQuestion = new EventEmitter<{ text: string; answerType: string }>();
  @Output() readonly submitTemplateQuestion = new EventEmitter<{
    request: AddTemplateQuestionRequest;
    optionIdsToRemove: string[];
    editQuestionId: string | null;
    existingOptionIds: string[];
    optionsSnapshot: UpdateTemplateQuestionRequestOption[];
  }>();

  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    id: [''],
    code: ['Q-001', Validators.required],
    text: ['', Validators.required],
    description: [''],
    answerType: ['Text' as TemplateAnswerType, Validators.required],
    isRequired: [true],
    order: [1, [Validators.required, Validators.min(1)]],
    options: this.fb.array([], [this.optionsValidator()])
  });

  submit(): void {
    if (this.mode === 'project') {
      if (this.form.controls.text.invalid || this.form.controls.answerType.invalid) {
        this.form.controls.text.markAsTouched();
        this.form.controls.answerType.markAsTouched();
        return;
      }
      this.createQuestion.emit({
        text: this.form.controls.text.value,
        answerType: this.form.controls.answerType.value
      });
      this.resetForCreate();
      return;
    }

    this.errorMessage = '';
    if (this.form.invalid || !this.stepId) {
      this.errorMessage = !this.stepId ? 'Lutfen once bir step secin.' : 'Form alanlarini kontrol edin.';
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const rawOptions = value.options as Array<{
      id: string;
      code: string;
      label: string;
      value: string;
      order: number;
      isDefault: boolean;
    }>;

    const optionsPayload =
      value.answerType === 'Text'
        ? []
        : rawOptions.map((x) => ({
            templateQuestionId: value.id,
            code: x.code.trim(),
            label: x.label.trim(),
            value: x.value?.trim() || undefined,
            order: Number(x.order),
            isActive: true,
            isDefault: x.isDefault,
            id: x.id
          }));

    const request: AddTemplateQuestionRequest = {
      stepId: this.stepId,
      code: value.code.trim(),
      text: value.text.trim(),
      description: value.description.trim(),
      answerType: value.answerType,
      isRequired: value.isRequired,
      order: Number(value.order),
      options: optionsPayload.map((x) => ({
        templateQuestionId: x.templateQuestionId,
        code: x.code,
        label: x.label,
        value: x.value,
        order: x.order,
        isActive: x.isActive,
        isDefault: x.isDefault
      }))
    };

    const existingOptionIds = optionsPayload.map((x) => x.id).filter((x): x is string => Boolean(x));
    const oldOptionIds = this.editMode
      ? (this.questionInput?.options ?? []).map((x) => x.id)
      : [];
    const optionIdsToRemove = oldOptionIds.filter((id) => !existingOptionIds.includes(id));

    this.submitTemplateQuestion.emit({
      request,
      optionIdsToRemove,
      editQuestionId: value.id || null,
      existingOptionIds,
      optionsSnapshot: rawOptions.map((x) => ({
        optionId: x.id || null,
        code: x.code.trim(),
        label: x.label.trim(),
        value: x.value?.trim() || null,
        order: Number(x.order),
        isDefault: x.isDefault,
        isActive: true
      }))
    });

    if (!this.editMode) {
      this.resetForCreate();
    }
  }

  get showOptions(): boolean {
    return this.form.controls.answerType.value !== 'Text';
  }

  get options(): FormArray {
    return this.form.controls.options;
  }

  addOption(): void {
    this.options.push(this.createOptionGroup());
  }

  removeOption(index: number): void {
    this.options.removeAt(index);
  }

  private questionInput: TemplateQuestionDto | null = null;

  private createOptionGroup(option?: Partial<TemplateQuestionOptionDto>) {
    return this.fb.nonNullable.group({
      id: [option?.id ?? ''],
      code: [option?.code ?? '', Validators.required],
      label: [option?.label ?? '', Validators.required],
      value: [option?.value ?? ''],
      order: [option?.order ?? this.options.length + 1, [Validators.required, Validators.min(1)]],
      isDefault: [option?.isDefault ?? false]
    });
  }

  private optionsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent;
      const answerType = parent?.get('answerType')?.value as TemplateAnswerType | undefined;
      const options = (control.value ?? []) as Array<{
        code: string;
        label: string;
        order: number;
        isDefault: boolean;
      }>;

      if (!answerType || answerType === 'Text') {
        return null;
      }

      if (!options.length) {
        return { noOptions: true };
      }

      const codes = options.map((o) => o.code?.trim().toLowerCase()).filter(Boolean);
      if (new Set(codes).size !== codes.length) {
        return { duplicateCode: true };
      }

      if (options.some((o) => !o.label?.trim())) {
        return { invalidLabel: true };
      }

      if (options.some((o) => Number.isNaN(Number(o.order)))) {
        return { invalidOrder: true };
      }

      if (answerType === 'SingleSelect') {
        const defaultCount = options.filter((o) => o.isDefault).length;
        if (defaultCount > 1) {
          return { multipleDefault: true };
        }
      }

      return null;
    };
  }

  private resetForCreate(): void {
    this.questionInput = null;
    this.form.reset({
      id: '',
      code: 'Q-001',
      text: '',
      description: '',
      answerType: 'Text',
      isRequired: true,
      order: 1
    });
    this.options.clear();
  }
}
