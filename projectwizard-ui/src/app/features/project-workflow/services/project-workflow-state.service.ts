import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProjectDetailDto, ProjectTaskDto } from '../../../core/models/project-workflow.models';

@Injectable({ providedIn: 'root' })
export class ProjectWorkflowStateService {
  readonly projectDetail$ = new BehaviorSubject<ProjectDetailDto | null>(null);
  readonly tasks$ = new BehaviorSubject<ProjectTaskDto[]>([]);
  readonly loading$ = new BehaviorSubject<boolean>(false);

  setLoading(value: boolean): void {
    this.loading$.next(value);
  }

  setProjectDetail(value: ProjectDetailDto | null): void {
    this.projectDetail$.next(value);
  }

  setTasks(value: ProjectTaskDto[]): void {
    this.tasks$.next(value);
  }
}
