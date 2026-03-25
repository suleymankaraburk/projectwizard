import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectSummaryDto, ProjectWorkflowTemplateDto } from '../../../../core/models/project-workflow.models';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { ProgressCardComponent } from '../../../../shared/ui/progress-card/progress-card.component';
import { SkeletonListComponent } from '../../../../shared/ui/skeleton-list/skeleton-list.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge.component';
import { ProjectWorkflowApiService } from '../../services/project-workflow-api.service';

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-project-list-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    EmptyStateComponent,
    StatusBadgeComponent,
    ProgressCardComponent,
    SkeletonListComponent
  ],
  template: `
    <section class="toolbar">
      <button mat-raised-button color="primary" (click)="load()">Yenile</button>
    </section>

    <mat-card class="create-card">
      <mat-card-title>Proje Olustur</mat-card-title>
      <mat-card-content>
        <section class="toolbar">
          <mat-form-field>
            <mat-label>Company Id (GUID)</mat-label>
            <input matInput [(ngModel)]="createCompanyId" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Proje Adi</mat-label>
            <input matInput [(ngModel)]="newProjectName" />
          </mat-form-field>
          <button
            mat-raised-button
            color="primary"
            [disabled]="creating || !newProjectName.trim() || !isGuid(createCompanyId)"
            (click)="createProject()">
            Proje Ekle
          </button>
        </section>
      </mat-card-content>
    </mat-card>

    @if (loading) {
      <app-skeleton-list />
    } @else if (!projects.length) {
      <app-empty-state message="Bu filtreye ait proje bulunamadi." />
    } @else {
      <div class="grid-2">
        @for (project of projects; track project.projectId) {
          <mat-card>
            <mat-card-title>{{ project.name }}</mat-card-title>
            <mat-card-content>
              <app-status-badge [status]="project.status" />
              <app-progress-card
                [title]="'Ilerleme'"
                [percent]="project.completionPercent"
                [completed]="project.completionPercent"
                [total]="100" />
              <section class="toolbar apply-toolbar">
                <mat-form-field>
                  <mat-label>Template</mat-label>
                  <mat-select
                    [ngModel]="getTemplateId(project.projectId)"
                    (ngModelChange)="setTemplateId(project.projectId, $event)">
                    <mat-option [value]="''">Seciniz</mat-option>
                    @for (t of templates; track t.id) {
                      <mat-option [value]="t.id">
                        {{ t.code }} - {{ t.name }} (v{{ t.version }})
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <button
                  mat-stroked-button
                  color="primary"
                  [disabled]="
                    applyingProjectId === project.projectId || !getTemplateId(project.projectId).trim()
                  "
                  (click)="applyTemplate(project.projectId)">
                  Template Uygula
                </button>
              </section>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button [routerLink]="['/projects', project.projectId]">Detay</button>
              <button mat-button [routerLink]="['/tasks', project.projectId]">Task</button>
              <button mat-button [routerLink]="['/progress', project.projectId]">Progress</button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [
    '.toolbar{display:flex;gap:1rem;align-items:flex-end;margin-bottom:1rem}',
    '.create-card{margin-bottom:1rem}',
    '.apply-toolbar{margin-top:1rem;margin-bottom:0}'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectListPage {
  private readonly api = inject(ProjectWorkflowApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  loading = false;
  creating = false;
  applyingProjectId: string | null = null;
  projects: ProjectSummaryDto[] = [];
  templates: ProjectWorkflowTemplateDto[] = [];
  newProjectName = '';
  createCompanyId = '11111111-1111-1111-1111-111111111111';
  templateIdByProjectId: Record<string, string> = {};
  defaultTemplateId = '';

  constructor() {
    this.loadTemplates();
    this.load();
  }

  private loadTemplates(): void {
    this.api
      .getProjectWorkflowTemplates(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        this.templates = items ?? [];
        this.defaultTemplateId = this.templates.at(0)?.id ?? '';
        // If projects already loaded, fill missing template selections from templateId or default.
        for (const project of this.projects) {
          const current = this.templateIdByProjectId[project.projectId];
          if (!current || current === '') {
            this.templateIdByProjectId[project.projectId] =
              project.templateId ?? this.defaultTemplateId;
          }
        }
        this.cdr.markForCheck();
      });
  }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api
      .getProjects()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((data) => {
        this.projects = data;
        for (const project of data) {
          this.templateIdByProjectId[project.projectId] =
            project.templateId ?? this.templateIdByProjectId[project.projectId] ?? this.defaultTemplateId;
        }
        this.cdr.markForCheck();
      });
  }

  createProject(): void {
    const name = this.newProjectName.trim();
    if (!name || this.creating || !this.isGuid(this.createCompanyId)) return;

    this.creating = true;
    this.cdr.markForCheck();
    this.api
      .createProject({
        companyId: this.createCompanyId.trim(),
        name
      })
      .pipe(
        switchMap(() => this.api.getProjects()),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.creating = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((data) => {
        this.projects = data;
        this.newProjectName = '';
        this.cdr.markForCheck();
      });
  }

  isGuid(value: string): boolean {
    return GUID_PATTERN.test((value ?? '').trim());
  }

  applyTemplate(projectId: string): void {
    const templateId = this.getTemplateId(projectId).trim();
    if (!templateId || this.applyingProjectId === projectId) return;

    this.applyingProjectId = projectId;
    this.cdr.markForCheck();
    this.api
      .applyTemplateToProject({ projectId, templateId })
      .pipe(
        switchMap(() => this.api.getProjects()),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.applyingProjectId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe((data) => {
        this.projects = data;
        this.cdr.markForCheck();
      });
  }

  getTemplateId(projectId: string): string {
    return this.templateIdByProjectId[projectId] ?? this.defaultTemplateId;
  }

  setTemplateId(projectId: string, templateId: string): void {
    this.templateIdByProjectId[projectId] = templateId;
  }
}
