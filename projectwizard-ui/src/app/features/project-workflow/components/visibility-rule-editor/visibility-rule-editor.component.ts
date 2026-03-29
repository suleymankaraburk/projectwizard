import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  TemplateAnswerType,
  TemplateQuestionDto,
  TemplateQuestionOptionDto
} from '../../../../core/models/project-workflow.models';

const COMPARISONS: Record<TemplateAnswerType, readonly string[]> = {
  Text: ['Equals', 'NotEquals', 'Exists'],
  SingleSelect: ['Equals', 'NotEquals', 'In', 'NotIn', 'Exists'],
  MultiSelect: ['Contains', 'In', 'NotIn', 'Exists']
};

const COMPARISON_LABELS: Record<string, string> = {
  Equals: 'Eşittir (Equals)',
  NotEquals: 'Eşit değildir (NotEquals)',
  In: 'Listede (In)',
  NotIn: 'Listede değil (NotIn)',
  Contains: 'İçerir (Contains)',
  Exists: 'Cevap vardır (Exists)'
};

function extractDepsFromRuleJson(json: string | null | undefined): string[] {
  if (!json?.trim()) return [];
  try {
    const o = JSON.parse(json) as { conditions?: unknown };
    const conds = o?.conditions;
    if (!Array.isArray(conds)) return [];
    return conds
      .map((c: { questionCode?: string }) => String(c?.questionCode ?? '').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function wouldCreateVisibilityCycle(
  allQuestions: TemplateQuestionDto[],
  selfCode: string,
  newRuleJson: string | null
): boolean {
  const self = selfCode.trim();
  if (!self) return false;
  const adj = new Map<string, string[]>();
  for (const q of allQuestions) {
    const code = (q.code ?? '').trim();
    if (!code) continue;
    const json = code === self ? newRuleJson : (q.visibilityRuleJson ?? null);
    adj.set(code, extractDepsFromRuleJson(json));
  }
  if (!adj.has(self)) adj.set(self, extractDepsFromRuleJson(newRuleJson));

  const visited = new Set<string>();
  const stack = new Set<string>();
  function dfs(u: string): boolean {
    if (stack.has(u)) return true;
    if (visited.has(u)) return false;
    visited.add(u);
    stack.add(u);
    for (const v of adj.get(u) ?? []) {
      if (!v || !adj.has(v)) continue;
      if (dfs(v)) return true;
    }
    stack.delete(u);
    return false;
  }
  return dfs(self);
}

@Component({
  selector: 'app-visibility-rule-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vre" [formGroup]="form">
      <h4 class="vre-title">Bu soru için görünürlük kuralı</h4>
      <p class="vre-hint">Kural yoksa soru her zaman görünür. Kurallar diğer soruların kodlarına (questionCode) göre tanımlanır.</p>

      <mat-checkbox formControlName="enabled"> Görünürlük kuralı kullan </mat-checkbox>

      @if (form.controls.enabled.value) {
        @if (conditions.length > 1) {
          <mat-form-field class="vre-op">
            <mat-label>Mantıksal operatör</mat-label>
            <mat-select formControlName="operator">
              <mat-option value="AND">AND — tüm koşullar sağlanmalı</mat-option>
              <mat-option value="OR">OR — koşullardan biri yeterli</mat-option>
            </mat-select>
          </mat-form-field>
        }

        <div class="vre-conditions" formArrayName="conditions">
          @for (grp of conditions.controls; track $index; let i = $index) {
            <div class="vre-row" [formGroupName]="i">
              <mat-form-field>
                <mat-label>Bağımlı soru</mat-label>
                <mat-select formControlName="questionCode" (selectionChange)="onRefChange(i)">
                  <mat-option value="">Seçiniz</mat-option>
                  @for (q of dependencyQuestions; track depQuestionTrackKey($index, q)) {
                    <mat-option [value]="q.code">{{ q.text }} ({{ q.code }})</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field>
                <mat-label>Karşılaştırma</mat-label>
                <mat-select formControlName="comparison">
                  @for (c of comparisonsForRow(i); track c) {
                    <mat-option [value]="c">{{ labelForComparison(c) }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              @if (showValueScalar(i)) {
                @if (refType(i) === 'Text') {
                  <mat-form-field class="vre-grow">
                    <mat-label>Değer (metin)</mat-label>
                    <input matInput formControlName="valueScalar" />
                  </mat-form-field>
                } @else if (refType(i) === 'SingleSelect' && !isMultiValueComparison(i)) {
                  <mat-form-field class="vre-grow">
                    <mat-label>Seçenek kodu</mat-label>
                    <mat-select formControlName="valueScalar" [compareWith]="compareOptionCodes">
                      @for (o of refOptions(i); track optionTrackKey(o)) {
                        <mat-option [value]="o.code">{{ o.label }} ({{ o.code }})</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                } @else if (refType(i) === 'MultiSelect' && rowComparison(i) === 'Contains') {
                  <mat-form-field class="vre-grow">
                    <mat-label>Seçenek kod(lar)ı</mat-label>
                    <mat-select formControlName="valueList" multiple [compareWith]="compareOptionCodes">
                      @for (o of refOptions(i); track optionTrackKey(o)) {
                        <mat-option [value]="o.code">{{ o.label }} ({{ o.code }})</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                }
              }

              @if (showValueMulti(i)) {
                <mat-form-field class="vre-grow">
                  <mat-label>Seçenek kodları</mat-label>
                  <mat-select formControlName="valueList" multiple [compareWith]="compareOptionCodes">
                    @for (o of refOptions(i); track optionTrackKey(o)) {
                      <mat-option [value]="o.code">{{ o.label }} ({{ o.code }})</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }

              <button mat-button color="warn" type="button" (click)="removeCondition(i)">Kaldır</button>
            </div>
          }
        </div>

        <button mat-stroked-button type="button" class="vre-add" (click)="addCondition()">Koşul ekle</button>

        @if (cycleWarning) {
          <p class="vre-warn">Uyarı: Bu kural ile sorular arasında döngüsel bağımlılık oluşabilir (A görünürlüğü B’ye, B’ninki A’ya bağlı gibi).</p>
        }

        @if (validationMessage) {
          <p class="vre-err">{{ validationMessage }}</p>
        }

        <div class="vre-preview">
          <div class="vre-preview-head">
            <span>Canlı JSON</span>
            <button mat-stroked-button type="button" (click)="copyJson()">JSON kopyala</button>
            <button mat-stroked-button type="button" (click)="copyEscaped()">Kaçırılmış string kopyala</button>
          </div>
          <pre class="vre-pre">{{ previewPretty }}</pre>
          <div class="vre-esc-label">API string (escape edilmiş)</div>
          <pre class="vre-pre vre-pre-sm">{{ previewEscaped }}</pre>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .vre {
        grid-column: 1 / -1;
        margin-top: 0.5rem;
        padding: 1rem;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 0.5rem;
        background: rgba(0, 0, 0, 0.02);
      }
      .vre-title {
        margin: 0 0 0.25rem;
        font-size: 1rem;
      }
      .vre-hint {
        margin: 0 0 0.75rem;
        font-size: 0.85rem;
        opacity: 0.85;
      }
      .vre-op {
        display: block;
        max-width: 320px;
        margin-top: 0.75rem;
      }
      .vre-conditions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 0.75rem;
      }
      .vre-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: flex-start;
        padding: 0.5rem;
        border-radius: 0.35rem;
        background: #fff;
        border: 1px solid rgba(0, 0, 0, 0.08);
      }
      .vre-row mat-form-field {
        min-width: 160px;
      }
      .vre-grow {
        flex: 1 1 220px;
        min-width: 200px;
      }
      .vre-add {
        margin-top: 0.5rem;
      }
      .vre-warn {
        color: #b45309;
        font-size: 0.875rem;
        margin: 0.75rem 0 0;
      }
      .vre-err {
        color: #b00020;
        font-size: 0.875rem;
        margin: 0.5rem 0 0;
      }
      .vre-preview {
        margin-top: 1rem;
      }
      .vre-preview-head {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 0.35rem;
      }
      .vre-pre {
        margin: 0;
        padding: 0.75rem;
        background: #1e1e1e;
        color: #d4d4d4;
        border-radius: 0.35rem;
        font-size: 0.8rem;
        overflow: auto;
        max-height: 200px;
      }
      .vre-pre-sm {
        max-height: 120px;
        font-size: 0.75rem;
      }
      .vre-esc-label {
        margin: 0.5rem 0 0.2rem;
        font-size: 0.8rem;
        opacity: 0.8;
      }
    `
  ]
})
export class VisibilityRuleEditorComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input() templateQuestions: TemplateQuestionDto[] = [];
  @Input() selfCode = '';
  @Input() visibilityRuleJson: string | null = null;
  @Output() readonly visibilityRuleJsonChange = new EventEmitter<string | null>();

  validationMessage = '';
  cycleWarning = false;
  previewPretty = '';
  previewEscaped = '';

  private lastPushedJson: string | null = null;
  private syncingFromInput = false;

  readonly form = this.fb.nonNullable.group({
    enabled: [false],
    operator: ['AND' as 'AND' | 'OR'],
    conditions: this.fb.array<FormGroup>([])
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.syncingFromInput) return;
      if (this.form.controls.enabled.value && this.conditions.length === 0) {
        this.conditions.push(this.createConditionGroup(), { emitEvent: false });
      }
      if (!this.form.controls.enabled.value) {
        if (this.conditions.length > 0) {
          this.conditions.clear({ emitEvent: false });
        }
        this.pushJson(null);
        this.refreshPreviewAndWarnings();
        return;
      }
      this.refreshPreviewAndWarnings();
      this.emitChange();
    });
  }

  get conditions(): FormArray<FormGroup> {
    return this.form.controls.conditions;
  }

  get dependencyQuestions(): TemplateQuestionDto[] {
    const self = (this.selfCode ?? '').trim().toLowerCase();
    return (this.templateQuestions ?? []).filter((q) => (q.code ?? '').trim().toLowerCase() !== self);
  }

  /** @for track: aynı code veya boş code ile tek satırda birleşmeyi önler */
  depQuestionTrackKey(index: number, q: TemplateQuestionDto): string {
    const id = String(q.id ?? q.templateQuestionId ?? '').trim();
    if (id) return `id:${id}`;
    const code = String(q.code ?? '').trim();
    return code ? `code:${code}:${index}` : `idx:${index}`;
  }

  optionTrackKey(o: TemplateQuestionOptionDto): string {
    const id = String(o.id ?? '').trim();
    return id ? `opt:${id}` : `ocode:${String(o.code ?? '')}`;
  }

  readonly compareOptionCodes = (a: unknown, b: unknown): boolean =>
    String(a ?? '') === String(b ?? '');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visibilityRuleJson']) {
      const next = (changes['visibilityRuleJson'].currentValue ?? null) as string | null;
      const norm = next?.trim() ? next.trim() : null;
      const isFirst = changes['visibilityRuleJson'].firstChange;
      if (!isFirst && norm === this.lastPushedJson) return;
      this.loadFromJson(norm);
      this.lastPushedJson = norm;
    }
    if (changes['selfCode'] || changes['templateQuestions']) {
      if (changes['templateQuestions'] && !this.syncingFromInput) {
        this.reassertConditionOptionSelections();
      }
      this.refreshPreviewAndWarnings();
      this.cdr.markForCheck();
    }
  }

  /** Seçenekler API'den sonradan dolduğunda mat-select seçimlerini yeniden bağlar */
  private reassertConditionOptionSelections(): void {
    for (let i = 0; i < this.conditions.length; i++) {
      const g = this.conditions.at(i);
      const sc = g.get('valueScalar');
      const vl = g.get('valueList');
      if (sc) {
        const v = sc.value;
        sc.setValue(v == null ? '' : String(v), { emitEvent: false });
      }
      if (vl) {
        const arr = (vl.value ?? []) as unknown[];
        vl.setValue(arr.map((x) => String(x)), { emitEvent: false });
      }
    }
  }

  addCondition(): void {
    this.conditions.push(this.createConditionGroup());
  }

  removeCondition(i: number): void {
    this.conditions.removeAt(i);
  }

  onRefChange(i: number): void {
    const g = this.conditions.at(i);
    const ref = this.getRefQuestion(g.controls['questionCode'].value);
    const comps = ref ? [...COMPARISONS[ref.answerType]] : ['Equals'];
    const cur = g.controls['comparison'].value;
    if (!comps.includes(cur)) {
      g.controls['comparison'].setValue(comps[0] ?? 'Equals');
    }
    g.controls['valueScalar'].setValue('');
    g.controls['valueList'].setValue([]);
  }

  refType(i: number): TemplateAnswerType | null {
    return this.getRefQuestion(this.rowCode(i))?.answerType ?? null;
  }

  rowCode(i: number): string {
    return String(this.conditions.at(i)?.get('questionCode')?.value ?? '').trim();
  }

  rowComparison(i: number): string {
    return String(this.conditions.at(i)?.get('comparison')?.value ?? '');
  }

  refOptions(i: number) {
    return this.getRefQuestion(this.rowCode(i))?.options ?? [];
  }

  comparisonsForRow(i: number): string[] {
    const ref = this.getRefQuestion(this.rowCode(i));
    if (!ref) return ['Equals', 'NotEquals', 'Exists'];
    return [...COMPARISONS[ref.answerType]];
  }

  isMultiValueComparison(i: number): boolean {
    const c = this.rowComparison(i);
    return c === 'In' || c === 'NotIn';
  }

  showValueScalar(i: number): boolean {
    const c = this.rowComparison(i);
    if (c === 'Exists') return false;
    const t = this.refType(i);
    if (!t) return true;
    if (t === 'Text') return true;
    if (t === 'SingleSelect' && !this.isMultiValueComparison(i)) return true;
    if (t === 'MultiSelect' && c === 'Contains') return true;
    return false;
  }

  showValueMulti(i: number): boolean {
    const c = this.rowComparison(i);
    if (c === 'Exists') return false;
    const t = this.refType(i);
    if (t === 'SingleSelect' && this.isMultiValueComparison(i)) return true;
    if (t === 'MultiSelect' && (c === 'In' || c === 'NotIn')) return true;
    return false;
  }

  labelForComparison(c: string): string {
    return COMPARISON_LABELS[c] ?? c;
  }

  /**
   * Kayıt anında kullanılır: formdaki güncel kuralı JSON string olarak döner; kural kapalıysa null.
   * Önce {@link validateForSubmit} ile doğrulama yapılmalıdır.
   */
  getSerializedRuleOrNull(): string | null {
    if (!this.form.controls.enabled.value) {
      return null;
    }
    if (this.quickValidate()) {
      return null;
    }
    return this.serializeOrNull();
  }

  validateForSubmit(): string | null {
    this.validationMessage = '';
    this.cdr.markForCheck();
    if (!this.form.controls.enabled.value) {
      return null;
    }
    if (this.conditions.length === 0) {
      this.validationMessage = 'En az bir koşul ekleyin.';
      this.cdr.markForCheck();
      return this.validationMessage;
    }
    const codes = new Set(
      (this.templateQuestions ?? []).map((q) => (q.code ?? '').trim()).filter(Boolean)
    );
    const self = (this.selfCode ?? '').trim();
    for (let i = 0; i < this.conditions.length; i++) {
      const g = this.conditions.at(i);
      const qc = String(g.controls['questionCode'].value ?? '').trim();
      const comp = String(g.controls['comparison'].value ?? '').trim();
      if (!qc) {
        this.validationMessage = `Satır ${i + 1}: bağımlı soru seçin.`;
        this.cdr.markForCheck();
        return this.validationMessage;
      }
      if (qc === self) {
        this.validationMessage = 'Kendi sorunuzu (code) bağımlılık olarak seçemezsiniz.';
        this.cdr.markForCheck();
        return this.validationMessage;
      }
      if (!codes.has(qc)) {
        this.validationMessage = `Satır ${i + 1}: "${qc}" şablonda tanımlı bir soru kodu değil.`;
        this.cdr.markForCheck();
        return this.validationMessage;
      }
      const allowed = this.comparisonsForRow(i);
      if (!allowed.includes(comp)) {
        this.validationMessage = `Satır ${i + 1}: geçersiz karşılaştırma "${comp}".`;
        this.cdr.markForCheck();
        return this.validationMessage;
      }
      if (comp === 'Exists') continue;
      const ref = this.getRefQuestion(qc);
      if (!ref) continue;
      if (comp === 'In' || comp === 'NotIn') {
        const list = (g.controls['valueList'].value ?? []) as string[];
        if (!Array.isArray(list) || list.length === 0) {
          this.validationMessage = `Satır ${i + 1}: In / NotIn için en az bir seçenek kodu seçin.`;
          this.cdr.markForCheck();
          return this.validationMessage;
        }
      } else if (ref.answerType === 'MultiSelect' && comp === 'Contains') {
        const list = (g.controls['valueList'].value ?? []) as string[];
        if (!Array.isArray(list) || list.length === 0) {
          this.validationMessage = `Satır ${i + 1}: Contains için en az bir seçenek kodu seçin.`;
          this.cdr.markForCheck();
          return this.validationMessage;
        }
      } else {
        const s = String(g.controls['valueScalar'].value ?? '').trim();
        if (!s) {
          this.validationMessage = `Satır ${i + 1}: değer zorunlu (Exists hariç).`;
          this.cdr.markForCheck();
          return this.validationMessage;
        }
      }
    }
    this.validationMessage = '';
    this.cdr.markForCheck();
    return null;
  }

  copyJson(): void {
    const raw = this.buildObjectOrNull();
    if (!raw) return;
    void navigator.clipboard?.writeText(JSON.stringify(raw));
  }

  copyEscaped(): void {
    const s = this.serializeOrNull();
    if (s == null) return;
    void navigator.clipboard?.writeText(JSON.stringify(s));
  }

  private emitChange(): void {
    if (this.syncingFromInput) return;
    if (!this.form.controls.enabled.value) {
      if (this.lastPushedJson !== null) {
        this.lastPushedJson = null;
        this.visibilityRuleJsonChange.emit(null);
      }
      this.refreshPreviewAndWarnings();
      return;
    }
    const err = this.quickValidate();
    if (err) {
      this.refreshPreviewAndWarnings();
      return;
    }
    const s = this.serializeOrNull();
    if (s !== this.lastPushedJson) {
      this.lastPushedJson = s;
      this.visibilityRuleJsonChange.emit(s);
    }
    this.refreshPreviewAndWarnings();
  }

  private quickValidate(): string | null {
    if (!this.form.controls.enabled.value) return null;
    for (let i = 0; i < this.conditions.length; i++) {
      const g = this.conditions.at(i);
      const qc = String(g.controls['questionCode'].value ?? '').trim();
      if (!qc) return 'empty';
      const comp = String(g.controls['comparison'].value ?? '');
      const ref = this.getRefQuestion(qc);
      if (comp === 'Exists') continue;
      if (comp === 'In' || comp === 'NotIn') {
        const list = (g.controls['valueList'].value ?? []) as string[];
        if (!list?.length) return 'bad';
      } else if (ref?.answerType === 'MultiSelect' && comp === 'Contains') {
        const list = (g.controls['valueList'].value ?? []) as string[];
        if (!list?.length) return 'bad';
      } else if (!String(g.controls['valueScalar'].value ?? '').trim()) {
        return 'bad';
      }
    }
    return null;
  }

  private refreshPreviewAndWarnings(): void {
    const enabled = this.form.controls.enabled.value;
    const invalid = enabled && (this.conditions.length === 0 || this.quickValidate());
    const obj = invalid ? null : this.buildObjectOrNull();
    this.previewPretty = !enabled
      ? '(kural yok)'
      : invalid
        ? '(eksik veya geçersiz alanlar — tamamlayın)'
        : JSON.stringify(obj, null, 0);
    const s = invalid ? null : this.serializeOrNull();
    this.previewEscaped = s != null ? JSON.stringify(s) : enabled && invalid ? '—' : 'null';
    this.cycleWarning =
      !!s &&
      wouldCreateVisibilityCycle(this.templateQuestions ?? [], this.selfCode ?? '', s);
    this.cdr.markForCheck();
  }

  private loadFromJson(json: string | null): void {
    this.syncingFromInput = true;
    try {
      this.conditions.clear({ emitEvent: false });
      if (!json?.trim()) {
        this.form.patchValue({ enabled: false, operator: 'AND' }, { emitEvent: false });
        this.refreshPreviewAndWarnings();
        this.cdr.markForCheck();
        return;
      }
      try {
        const o = JSON.parse(json) as {
          operator?: string;
          conditions?: Array<{ questionCode?: string; comparison?: string; value?: unknown }>;
        };
        const list = o?.conditions;
        if (!Array.isArray(list) || !list.length) {
          this.form.patchValue({ enabled: false, operator: 'AND' }, { emitEvent: false });
          this.refreshPreviewAndWarnings();
          this.cdr.markForCheck();
          return;
        }
        const op = o.operator === 'OR' ? 'OR' : 'AND';
        this.form.patchValue({ enabled: true, operator: op }, { emitEvent: false });
        for (const c of list) {
          this.conditions.push(this.conditionGroupFromApi(c), { emitEvent: false });
        }
      } catch {
        this.form.patchValue({ enabled: false, operator: 'AND' }, { emitEvent: false });
      }
      this.refreshPreviewAndWarnings();
      this.cdr.markForCheck();
    } finally {
      this.syncingFromInput = false;
    }
  }

  private conditionGroupFromApi(c: {
    questionCode?: string;
    comparison?: string;
    value?: unknown;
  }): FormGroup {
    const questionCode = String(c.questionCode ?? '');
    const comparison = String(c.comparison ?? 'Equals');
    let valueScalar = '';
    let valueList: string[] = [];
    if (comparison !== 'Exists' && c.value !== undefined && c.value !== null) {
      if (Array.isArray(c.value)) {
        valueList = c.value.map((x) => String(x));
      } else if (comparison === 'Contains' || comparison === 'In' || comparison === 'NotIn') {
        // Contains tek kod için string "1" gibi gelebilir; UI bu karşılaştırmalarda valueList kullanır.
        valueList = [String(c.value)];
      } else {
        valueScalar = String(c.value);
      }
    }
    return this.fb.nonNullable.group({
      questionCode: [questionCode, Validators.required],
      comparison: [comparison, Validators.required],
      valueScalar: [valueScalar],
      valueList: [valueList as string[]]
    });
  }

  private createConditionGroup(): FormGroup {
    return this.fb.nonNullable.group({
      questionCode: ['', Validators.required],
      comparison: ['Equals', Validators.required],
      valueScalar: [''],
      valueList: [[] as string[]]
    });
  }

  private getRefQuestion(code: string): TemplateQuestionDto | undefined {
    const t = (code ?? '').trim();
    return (this.templateQuestions ?? []).find((q) => (q.code ?? '').trim() === t);
  }

  private buildObjectOrNull(): Record<string, unknown> | null {
    if (!this.form.controls.enabled.value || this.conditions.length === 0) return null;
    if (this.quickValidate()) return null;
    const conditions = this.conditions.controls.map((g) => {
      const questionCode = String(g.controls['questionCode'].value ?? '').trim();
      const comparison = String(g.controls['comparison'].value ?? '');
      const row: Record<string, unknown> = { questionCode, comparison };
      if (comparison === 'Exists') return row;
      const ref = this.getRefQuestion(questionCode);
      if (comparison === 'In' || comparison === 'NotIn') {
        row['value'] = [...((g.controls['valueList'].value ?? []) as string[])];
        return row;
      }
      if (ref?.answerType === 'MultiSelect' && comparison === 'Contains') {
        const list = (g.controls['valueList'].value ?? []) as string[];
        row['value'] = list.length === 1 ? list[0] : [...list];
        return row;
      }
      row['value'] = String(g.controls['valueScalar'].value ?? '').trim();
      return row;
    });
    const op = this.form.controls.operator.value;
    if (conditions.length > 1) {
      return { operator: op, conditions };
    }
    return { conditions };
  }

  private serializeOrNull(): string | null {
    const o = this.buildObjectOrNull();
    return o ? JSON.stringify(o) : null;
  }

  private pushJson(s: string | null): void {
    this.lastPushedJson = s;
    this.visibilityRuleJsonChange.emit(s);
  }
}
