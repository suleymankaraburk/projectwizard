import { Injectable } from '@angular/core';
import { ProjectWorkflowApiService } from '../../features/project-workflow/services/project-workflow-api.service';

@Injectable({ providedIn: 'root' })
export class ProjectWorkflowClient {
  constructor(readonly api: ProjectWorkflowApiService) {}
}
