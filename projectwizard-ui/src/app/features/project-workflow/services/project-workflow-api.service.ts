import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AddProjectQuestionRequest,
  AddTemplateQuestionOptionRequest,
  AddTemplateQuestionRequest,
  AddTemplateStepRequest,
  AddTemplateStepResultDto,
  ApiEnvelope,
  ApplyTemplateRequest,
  CreateProjectRequest,
  CreateTemplateRequest,
  CreateTemplateResultDto,
  ProjectDetailDto,
  ProjectProgressDto,
  ProjectQuestionDto,
  ProjectWorkflowTemplateStepDto,
  ProjectWorkflowTemplateDto,
  RemoveTemplateQuestionOptionRequest,
  ProjectSummaryDto,
  ProjectTaskDto,
  RemoveProjectQuestionRequest,
  RebuildTasksRequest,
  SaveProjectAnswerRequest,
  TemplateDetailDto,
  TemplateQuestionOptionDto,
  UpdateTemplateQuestionRequest,
  UpdateTemplateQuestionOptionRequest,
  UpdateSubTaskStatusRequest,
  UpdateTaskStatusRequest
} from '../../../core/models/project-workflow.models';

@Injectable({ providedIn: 'root' })
export class ProjectWorkflowApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getProjects(companyId: number): Observable<ProjectSummaryDto[]> {
    if (environment.useMockApi) {
      return of(MOCK_PROJECTS).pipe(delay(300));
    }
    const params = new HttpParams().set('companyId', companyId);
    return this.http
      .get<ApiEnvelope<ProjectSummaryDto[]>>(`${this.baseUrl}/GetProjects`, { params })
      .pipe(map((x) => x.data));
  }

  createProject(payload: CreateProjectRequest): Observable<number> {
    if (environment.useMockApi) {
      return of(Math.floor(Math.random() * 1000) + 100).pipe(delay(300));
    }
    return this.http
      .post<ApiEnvelope<number>>(`${this.baseUrl}/CreateProject`, payload)
      .pipe(map((x) => x.data));
  }

  getProjectById(projectId: number): Observable<ProjectDetailDto> {
    if (environment.useMockApi) {
      return of(MOCK_PROJECT_DETAIL(projectId)).pipe(delay(300));
    }
    const params = new HttpParams().set('projectId', projectId);
    return this.http
      .get<ApiEnvelope<ProjectDetailDto>>(`${this.baseUrl}/GetProjectById`, { params })
      .pipe(map((x) => x.data));
  }

  createTemplate(payload: CreateTemplateRequest): Observable<string> {
    if (environment.useMockApi) {
      return of('11111111-1111-1111-1111-111111111111').pipe(delay(200));
    }
    return this.http
      .post<ApiEnvelope<CreateTemplateResultDto>>(`${this.baseUrl}/CreateTemplate`, payload)
      .pipe(map((x) => x.data.id));
  }

  getProjectWorkflowTemplates(
    isActive?: boolean | null
  ): Observable<ProjectWorkflowTemplateDto[]> {
    if (environment.useMockApi) {
      const filtered =
        isActive === null || isActive === undefined
          ? MOCK_WORKFLOW_TEMPLATES
          : MOCK_WORKFLOW_TEMPLATES.filter((x) => x.isActive === isActive);
      return of(filtered).pipe(delay(200));
    }

    let params = new HttpParams();
    if (isActive !== null && isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }

    return this.http
      .get<ApiEnvelope<ProjectWorkflowTemplateDto[]>>(
        `${this.baseUrl}/GetProjectWorkflowTemplates`,
        { params }
      )
      .pipe(map((x) => x.data));
  }

  addTemplateStep(payload: AddTemplateStepRequest): Observable<AddTemplateStepResultDto> {
    const mockStep: AddTemplateStepResultDto = {
      id: crypto.randomUUID(),
      templateId: payload.templateId,
      title: payload.title,
      order: payload.order
    };
    return this.postData<AddTemplateStepResultDto>('AddTemplateStep', payload, mockStep);
  }

  getProjectWorkflowTemplateSteps(templateId: string): Observable<ProjectWorkflowTemplateStepDto[]> {
    if (environment.useMockApi) {
      return of(
        MOCK_TEMPLATE_STEPS.filter((x) => x.templateId.toLowerCase() === templateId.toLowerCase())
      ).pipe(delay(200));
    }
    const params = new HttpParams().set('templateId', templateId);
    return this.http
      .get<ApiEnvelope<ProjectWorkflowTemplateStepDto[]>>(
        `${this.baseUrl}/GetProjectWorkflowTemplateSteps`,
        { params }
      )
      .pipe(map((x) => x.data));
  }

  addTemplateQuestion(payload: AddTemplateQuestionRequest): Observable<string> {
    return this.postData<string>(
      'AddTemplateQuestion',
      payload,
      '4b1355d9-4f5a-4b7e-bfd1-9c1af55779ad'
    );
  }

  updateTemplateQuestion(payload: UpdateTemplateQuestionRequest): Observable<boolean> {
    return this.postData<boolean>('UpdateTemplateQuestion', payload, true);
  }

  addTemplateQuestionOption(payload: AddTemplateQuestionOptionRequest): Observable<string> {
    return this.postData<string>(
      'AddTemplateQuestionOption',
      payload,
      '8ec4ab03-60f2-4f35-96fb-2145f36f1c3f'
    );
  }

  updateTemplateQuestionOption(payload: UpdateTemplateQuestionOptionRequest): Observable<boolean> {
    return this.postData<boolean>('UpdateTemplateQuestionOption', payload, true);
  }

  removeTemplateQuestionOption(payload: RemoveTemplateQuestionOptionRequest): Observable<boolean> {
    return this.postData<boolean>('RemoveTemplateQuestionOption', payload, true);
  }

  getTemplateQuestionOptions(templateQuestionId: string): Observable<TemplateQuestionOptionDto[]> {
    if (environment.useMockApi) {
      return of(
        MOCK_TEMPLATE_QUESTION_OPTIONS.filter(
          (x) => x.templateQuestionId.toLowerCase() === templateQuestionId.toLowerCase()
        )
      ).pipe(delay(200));
    }

    const params = new HttpParams().set('templateQuestionId', templateQuestionId);
    return this.http
      .get<ApiEnvelope<TemplateQuestionOptionDto[]>>(
        `${this.baseUrl}/GetTemplateQuestionOptions`,
        { params }
      )
      .pipe(map((x) => x.data));
  }

  getTemplateById(templateId: string): Observable<TemplateDetailDto> {
    if (environment.useMockApi) {
      return of(MOCK_TEMPLATE(templateId)).pipe(delay(250));
    }
    const params = new HttpParams().set('templateId', templateId);
    return this.http
      .get<ApiEnvelope<TemplateDetailDto>>(`${this.baseUrl}/GetTemplateById`, { params })
      .pipe(map((x) => this.normalizeTemplateDetail(x.data)));
  }

  applyTemplateToProject(payload: ApplyTemplateRequest): Observable<boolean> {
    return this.postData<boolean>('ApplyTemplateToProject', payload, true);
  }

  addProjectQuestion(payload: AddProjectQuestionRequest): Observable<number> {
    return this.postData<number>('AddProjectQuestion', payload, Math.floor(Math.random() * 1000));
  }

  removeProjectQuestion(payload: RemoveProjectQuestionRequest): Observable<boolean> {
    return this.postData<boolean>('RemoveProjectQuestion', payload, true);
  }

  saveProjectAnswer(payload: SaveProjectAnswerRequest): Observable<boolean> {
    return this.postData<boolean>('SaveProjectAnswer', payload, true);
  }

  rebuildTasksFromAnswers(payload: RebuildTasksRequest): Observable<boolean> {
    return this.postData<boolean>('RebuildTasksFromAnswers', payload, true);
  }

  getProjectTasks(projectId: number): Observable<ProjectTaskDto[]> {
    if (environment.useMockApi) {
      return of(MOCK_TASKS).pipe(delay(400));
    }
    const params = new HttpParams().set('projectId', projectId);
    return this.http
      .get<ApiEnvelope<ProjectTaskDto[]>>(`${this.baseUrl}/GetProjectTasks`, { params })
      .pipe(map((x) => x.data));
  }

  updateTaskStatus(payload: UpdateTaskStatusRequest): Observable<boolean> {
    return this.postData<boolean>('UpdateTaskStatus', payload, true);
  }

  updateSubTaskStatus(payload: UpdateSubTaskStatusRequest): Observable<boolean> {
    return this.postData<boolean>('UpdateSubTaskStatus', payload, true);
  }

  getProjectProgress(projectId: number): Observable<ProjectProgressDto> {
    if (environment.useMockApi) {
      return of(MOCK_PROGRESS).pipe(delay(250));
    }
    const params = new HttpParams().set('projectId', projectId);
    return this.http
      .get<ApiEnvelope<ProjectProgressDto>>(`${this.baseUrl}/GetProjectProgress`, { params })
      .pipe(map((x) => x.data));
  }

  private postData<T>(path: string, payload: unknown, mockData: T): Observable<T> {
    if (environment.useMockApi) {
      return of(mockData).pipe(delay(200));
    }
    return this.http
      .post<ApiEnvelope<T>>(`${this.baseUrl}/${path}`, payload)
      .pipe(map((x) => x.data));
  }

  private normalizeTemplateDetail(data: TemplateDetailDto): TemplateDetailDto {
    const resolvedId = data.templateId || data.id || '';
    return {
      ...data,
      templateId: resolvedId
    };
  }

}

const MOCK_PROJECTS: ProjectSummaryDto[] = [
  { projectId: 1, companyId: 1, name: 'ERP Gecis', status: 'InProgress', completionPercent: 46 },
  { projectId: 2, companyId: 1, name: 'Onboarding Revizyon', status: 'Draft', completionPercent: 12 }
];

const MOCK_PROJECT_DETAIL = (id: number): ProjectDetailDto => ({
  projectId: id,
  companyId: 1,
  name: `Proje ${id}`,
  status: 'InProgress',
  completionPercent: 46,
  questions: [
    {
      projectQuestionId: 1,
      text: 'Musteri sistemi hangi ERP versiyonunda?',
      answerType: 'Text',
      required: true,
      order: 1,
      isCustom: false,
      answer: 'v11'
    }
  ]
});

const MOCK_TEMPLATE = (templateId: string): TemplateDetailDto => ({
  templateId,
  id: templateId,
  code: 'TMP-001',
  name: 'Standart Onboarding',
  version: 1,
  isActive: true,
  steps: [
    {
      id: 'fc406e86-27ba-4e4a-bdde-c6175f9a85bc',
      templateStepId: 'fc406e86-27ba-4e4a-bdde-c6175f9a85bc',
      title: 'Kesif',
      order: 1,
      questions: [
        {
          id: '6f9a21ca-fc26-4cd7-a99f-b6ca18f3d2b9',
          code: 'Q-001',
          text: 'Kac kullanici var?',
          answerType: 'SingleSelect',
          isRequired: true,
          order: 1,
          options: [
            {
              id: '8ec4ab03-60f2-4f35-96fb-2145f36f1c3f',
              templateQuestionId: '6f9a21ca-fc26-4cd7-a99f-b6ca18f3d2b9',
              code: 'OPT-001',
              label: '1-10',
              value: '1-10',
              order: 1,
              isActive: true,
              isDefault: true
            }
          ]
        }
      ]
    }
  ]
});

const MOCK_TASKS: ProjectTaskDto[] = [
  {
    taskId: 1,
    title: 'Proje kick-off toplantisi',
    status: 'InProgress',
    actionType: 'OpenUrl',
    actionPayload: 'https://meet.example.com',
    subtasks: [
      { subTaskId: 101, title: 'Toplanti daveti gonder', status: 'Done' },
      { subTaskId: 102, title: 'Ajanda hazirla', status: 'InProgress' }
    ]
  },
  {
    taskId: 2,
    title: 'Veri esitligi kontrolu',
    status: 'Todo',
    actionType: 'ShowMappedData',
    actionPayload: '{"mappedRecords":120,"missing":3}',
    subtasks: []
  }
];

const MOCK_PROGRESS: ProjectProgressDto = {
  completionPercent: 46,
  totalCompleted: 11,
  totalCount: 24,
  steps: [
    { stepTitle: 'Kesif', completed: 4, total: 8 },
    { stepTitle: 'Kurulum', completed: 5, total: 10 },
    { stepTitle: 'Canliya Gecis', completed: 2, total: 6 }
  ]
};

const MOCK_WORKFLOW_TEMPLATES: ProjectWorkflowTemplateDto[] = [
  {
    id: '246dbc46-fd4e-4fe0-9561-fb2d6704a73b',
    code: 'TMP-001',
    name: 'Standart Onboarding',
    version: 1,
    isActive: true
  },
  {
    id: '7f4e9d9d-fd3a-4bc6-8659-2ed2bf992a11',
    code: 'TMP-002',
    name: 'Legacy Onboarding',
    version: 2,
    isActive: false
  }
];

const MOCK_TEMPLATE_STEPS: ProjectWorkflowTemplateStepDto[] = [
  {
    id: 'fc406e86-27ba-4e4a-bdde-c6175f9a85bc',
    templateId: '246dbc46-fd4e-4fe0-9561-fb2d6704a73b',
    title: 'Kesif',
    order: 1
  },
  {
    id: 'ac4f20f4-257f-4f41-8dc2-e66ff82e0b67',
    templateId: '246dbc46-fd4e-4fe0-9561-fb2d6704a73b',
    title: 'Kurulum',
    order: 2
  }
];

const MOCK_TEMPLATE_QUESTION_OPTIONS: TemplateQuestionOptionDto[] = [
  {
    id: '8ec4ab03-60f2-4f35-96fb-2145f36f1c3f',
    templateQuestionId: '6f9a21ca-fc26-4cd7-a99f-b6ca18f3d2b9',
    code: 'OPT-001',
    label: '1-10',
    value: '1-10',
    order: 1,
    isActive: true,
    isDefault: true
  },
  {
    id: 'f3faefe5-2e8d-4ff2-a022-e1818c085084',
    templateQuestionId: '6f9a21ca-fc26-4cd7-a99f-b6ca18f3d2b9',
    code: 'OPT-002',
    label: '11-50',
    value: '11-50',
    order: 2,
    isActive: true,
    isDefault: false
  }
];
