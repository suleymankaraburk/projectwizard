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
  EmissionCategoryMethodDto,
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
  TemplateAnswerType,
  TemplateDetailDto,
  TemplateQuestionDto,
  TemplateQuestionOptionDto,
  TemplateStepDto,
  UpdateTemplateQuestionRequest,
  UpdateTemplateQuestionOptionRequest,
  UpdateSubTaskStatusRequest,
  UpdateTaskStatusRequest
} from '../../../core/models/project-workflow.models';

@Injectable({ providedIn: 'root' })
export class ProjectWorkflowApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getProjects(): Observable<ProjectSummaryDto[]> {
    if (environment.useMockApi) {
      return of(MOCK_PROJECTS).pipe(delay(300));
    }
    const params = new HttpParams();
    return this.http
      .get<ApiEnvelope<ProjectSummaryDto[]>>(`${this.baseUrl}/GetProjects`, { params })
      .pipe(
        map((x) => {
          const data: unknown = x.data;
          const list = Array.isArray(data)
            ? data
            : Array.isArray((data as any)?.items)
              ? (data as any).items
              : [];

          return (list as any[]).map((p) => ({
            projectId: String(p.projectId ?? p.projectID ?? p.id),
            companyId: p.companyId ?? p.companyID ?? p.companyGuid ?? p.companyGUID,
            name: p.name ?? p.projectName,
            status: p.status,
            completionPercent: p.completionPercent ?? p.completionPercentage ?? p.progress ?? 0,
            templateId:
              p.templateId ??
              p.templateID ??
              p.templateGuid ??
              p.templateGUID ??
              p.appliedTemplateId ??
              p.appliedTemplateID ??
              p.currentTemplateId ??
              null
          })) as ProjectSummaryDto[];
        })
      );
  }

  createProject(payload: CreateProjectRequest): Observable<string> {
    if (environment.useMockApi) {
      return of(crypto.randomUUID()).pipe(delay(300));
    }
    return this.http
      .post<ApiEnvelope<string>>(`${this.baseUrl}/CreateProject`, payload)
      .pipe(map((x) => x.data));
  }

  getProjectById(projectId: string): Observable<ProjectDetailDto> {
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

  getEmissionCategoryMethods(): Observable<EmissionCategoryMethodDto[]> {
    if (environment.useMockApi) {
      return of([]).pipe(delay(200));
    }
    return this.http
      .get<unknown>(`${environment.emissionApiBaseUrl}/GetEmissionCategoryMethods`)
      .pipe(
        map((res) => {
          const raw = Array.isArray(res) ? res : (res as any)?.data;
          const list = Array.isArray(raw) ? raw : [];
          return list.map((x: any) => ({
            categoryCode: String(x.categoryCode ?? ''),
            categoryName: x.categoryName ?? null,
            methodCode: String(x.methodCode ?? ''),
            methodNameTR: x.methodNameTR ?? null,
            methodNameEN: x.methodNameEN ?? null
          })) as EmissionCategoryMethodDto[];
        })
      );
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

  getProjectTasks(projectId: string): Observable<ProjectTaskDto[]> {
    if (environment.useMockApi) {
      return of(MOCK_TASKS).pipe(delay(400));
    }
    const params = new HttpParams().set('projectId', projectId);
    return this.http
      .get<unknown>(`${this.baseUrl}/GetProjectTasks`, { params })
      .pipe(
        map((res) => {
          const raw = Array.isArray(res) ? res : (res as any)?.data;
          const list = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.items) ? (raw as any).items : [];
          return list.map((t: any) => ({
            taskId: String(t.taskId ?? t.id ?? ''),
            title: t.title ?? t.name ?? '',
            status: t.status,
            actionType: t.actionType ?? null,
            actionPayload: t.actionPayload ?? null,
            subtasks: Array.isArray(t.subtasks)
              ? t.subtasks.map((s: any) => ({
                  subTaskId: String(s.subTaskId ?? s.id ?? ''),
                  title: s.title ?? s.name ?? '',
                  status: s.status
                }))
              : []
          })) as ProjectTaskDto[];
        })
      );
  }

  updateTaskStatus(payload: UpdateTaskStatusRequest): Observable<boolean> {
    return this.postData<boolean>('UpdateTaskStatus', payload, true);
  }

  updateSubTaskStatus(payload: UpdateSubTaskStatusRequest): Observable<boolean> {
    return this.postData<boolean>('UpdateSubTaskStatus', payload, true);
  }

  getProjectProgress(projectId: string): Observable<ProjectProgressDto> {
    if (environment.useMockApi) {
      return of(MOCK_PROGRESS).pipe(delay(250));
    }
    const params = new HttpParams().set('projectId', projectId);
    return this.http
      .get<unknown>(`${this.baseUrl}/GetProjectProgress`, { params })
      .pipe(
        map((res) => {
          const data = (res as any)?.data ?? res;
          const stepsRaw = Array.isArray(data?.steps) ? data.steps : [];
          return {
            projectId: String(data?.projectId ?? projectId),
            completionPercent: Number(data?.completionPercent ?? 0),
            steps: stepsRaw.map((s: any) => ({
              stepId: String(s.stepId ?? s.id ?? ''),
              stepTitle: String(s.stepTitle ?? s.title ?? ''),
              completedTaskCount: Number(s.completedTaskCount ?? s.completed ?? 0),
              totalTaskCount: Number(s.totalTaskCount ?? s.total ?? 0),
              estimatedDuration: s.estimatedDuration ?? null
            }))
          } as ProjectProgressDto;
        })
      );
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
    const d = data as unknown as Record<string, unknown>;
    const resolvedId = String(
      data.templateId ?? data.id ?? d['templateId'] ?? d['TemplateId'] ?? d['id'] ?? ''
    );

    const rawSteps = this.coerceArray(
      d['steps'] ?? d['Steps'] ?? d['templateSteps'] ?? d['TemplateSteps']
    );
    let steps = rawSteps.map((s) => this.normalizeTemplateStep(s as Record<string, unknown>));

    const rootQuestions = this.coerceArray(d['questions'] ?? d['Questions']);
    if (rootQuestions.length) {
      steps = this.mergeRootQuestionsIntoSteps(steps, rootQuestions);
    }

    if (!steps.length && rootQuestions.length) {
      steps = this.stepsFromFlatQuestionsOnly(rootQuestions);
    }

    return {
      ...data,
      templateId: resolvedId,
      steps
    };
  }

  private coerceArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private normalizeTemplateStep(step: Record<string, unknown>): TemplateStepDto {
    const id = String(
      step['id'] ?? step['templateStepId'] ?? step['TemplateStepId'] ?? step['stepId'] ?? ''
    );
    const nested = this.coerceArray(step['questions'] ?? step['Questions']);
    const questions = nested.map((q) => this.normalizeTemplateQuestion(q));

    return {
      id: id || String(step['templateStepId'] ?? step['TemplateStepId'] ?? ''),
      templateStepId: (step['templateStepId'] ?? step['TemplateStepId'] ?? id) as string | undefined,
      title: String(step['title'] ?? step['Title'] ?? ''),
      order: Number(step['order'] ?? step['Order'] ?? 0),
      questions
    };
  }

  private normalizeTemplateQuestion(q: unknown): TemplateQuestionDto {
    const row = q as Record<string, unknown> & {
      VisibilityRuleJson?: string | null;
      visibilityRuleJSON?: string | null;
    };
    const raw =
      row['visibilityRuleJson'] ?? row['VisibilityRuleJson'] ?? row['visibilityRuleJSON'];
    const visibilityRuleJson =
      raw == null || raw === ''
        ? null
        : typeof raw === 'string'
          ? raw
          : JSON.stringify(raw);

    const id = String(
      row['id'] ?? row['templateQuestionId'] ?? row['TemplateQuestionId'] ?? row['questionId'] ?? ''
    );
    const code = String(row['code'] ?? row['Code'] ?? '');
    const text = String(row['text'] ?? row['Text'] ?? '');
    const answerType = (row['answerType'] ??
      row['AnswerType'] ??
      'Text') as TemplateAnswerType;
    const optionsRaw = this.coerceArray(row['options'] ?? row['Options']);

    return {
      ...(row as unknown as TemplateQuestionDto),
      id,
      templateQuestionId: (row['templateQuestionId'] ?? row['TemplateQuestionId'] ?? id) as
        | string
        | null
        | undefined,
      code,
      text,
      description: (row['description'] ?? row['Description'] ?? null) as string | null,
      url: (row['url'] ?? row['Url'] ?? null) as string | null,
      categoryCode: (row['categoryCode'] ?? row['CategoryCode'] ?? null) as string | null,
      methodCode: (row['methodCode'] ?? row['MethodCode'] ?? null) as string | null,
      answerType,
      isRequired: Boolean(row['isRequired'] ?? row['IsRequired'] ?? true),
      order: Number(row['order'] ?? row['Order'] ?? 0),
      visibilityRuleJson,
      options: optionsRaw as TemplateQuestionDto['options']
    };
  }

  private mergeRootQuestionsIntoSteps(
    steps: TemplateStepDto[],
    rootQuestions: unknown[]
  ): TemplateStepDto[] {
    const result = steps.map((st) => ({
      ...st,
      questions: [...(st.questions ?? [])]
    }));

    const findStep = (sid: string) =>
      result.find(
        (st) =>
          (st.id && st.id === sid) ||
          (st.templateStepId && st.templateStepId === sid) ||
          String(st.templateStepId ?? '') === sid ||
          String(st.id ?? '') === sid
      );

    for (const q of rootQuestions) {
      const qNorm = this.normalizeTemplateQuestion(q);
      if (!qNorm.id && !qNorm.code) continue;

      const raw = q as Record<string, unknown>;
      const sid = String(
        raw['stepId'] ??
          raw['templateStepId'] ??
          raw['StepId'] ??
          raw['TemplateStepId'] ??
          ''
      ).trim();

      let st = sid ? findStep(sid) : undefined;
      if (!st && result.length === 1) {
        st = result[0];
      }
      // Kök listede stepId yoksa (veya eşleşmezse) sorular kaybolmasın diye ilk adıma düşür.
      if (!st && result.length > 0 && !sid) {
        st = result[0];
      }
      if (!st) continue;

      const dup = st.questions.some((x) => x.id && qNorm.id && x.id === qNorm.id);
      if (!dup) {
        st.questions.push(qNorm);
      }
    }

    for (const st of result) {
      st.questions.sort((a, b) => a.order - b.order);
    }
    return result;
  }

  private stepsFromFlatQuestionsOnly(rootQuestions: unknown[]): TemplateStepDto[] {
    type Pack = { order: number; title: string; questions: TemplateQuestionDto[] };
    const byStep = new Map<string, Pack>();

    for (const q of rootQuestions) {
      const qNorm = this.normalizeTemplateQuestion(q);
      const raw = q as Record<string, unknown>;
      const sid = String(
        raw['stepId'] ??
          raw['templateStepId'] ??
          raw['StepId'] ??
          raw['TemplateStepId'] ??
          'orphan'
      ).trim() || 'orphan';

      if (!byStep.has(sid)) {
        byStep.set(sid, {
          order: Number(raw['stepOrder'] ?? raw['StepOrder'] ?? 9999),
          title: String(raw['stepTitle'] ?? raw['StepTitle'] ?? ''),
          questions: []
        });
      }
      byStep.get(sid)!.questions.push(qNorm);
    }

    return Array.from(byStep.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([stepId, pack]) => ({
        id: stepId,
        templateStepId: stepId,
        title: pack.title,
        order: pack.order,
        questions: pack.questions.sort((a, b) => a.order - b.order)
      }));
  }

}

const MOCK_PROJECTS: ProjectSummaryDto[] = [
  {
    projectId: '42110c71-9ba8-4291-a052-827af590382c',
    companyId: '11111111-1111-1111-1111-111111111111',
    name: 'ERP Gecis',
    status: 'InProgress',
    completionPercent: 46
  },
  {
    projectId: '9d9fdd7b-b7b2-4d3a-9f30-2e6a0a2b7e7b',
    companyId: '11111111-1111-1111-1111-111111111111',
    name: 'Onboarding Revizyon',
    status: 'Draft',
    completionPercent: 12
  }
];

const MOCK_PROJECT_DETAIL = (id: string): ProjectDetailDto => ({
  id,
  templateId: '11111111-1111-1111-1111-111111111111',
  name: `Proje ${id}`,
  status: 'InProgress',
  progress: 46,
  steps: [{ id: 'fc406e86-27ba-4e4a-bdde-c6175f9a85bc', title: 'Kesif', order: 1 }],
  questions: [
    {
      id: '775f487f-f4ae-436e-bd72-00ef8fd83d98',
      projectId: id,
      stepId: 'fc406e86-27ba-4e4a-bdde-c6175f9a85bc',
      text: 'Musteri sistemi hangi ERP versiyonunda?',
      url: null,
      answerType: 'Text',
      isRequired: true,
      isCustom: false,
      isActive: true,
      options: []
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
    taskId: '1',
    title: 'Proje kick-off toplantisi',
    status: 'InProgress',
    actionType: 'OpenUrl',
    actionPayload: 'https://meet.example.com',
    subtasks: [
      { subTaskId: '101', title: 'Toplanti daveti gonder', status: 'Completed' },
      { subTaskId: '102', title: 'Ajanda hazirla', status: 'InProgress' }
    ]
  },
  {
    taskId: '2',
    title: 'Veri esitligi kontrolu',
    status: 'Todo',
    actionType: 'ShowMappedData',
    actionPayload: '{"mappedRecords":120,"missing":3}',
    subtasks: []
  }
];

const MOCK_PROGRESS: ProjectProgressDto = {
  projectId: '42110c71-9ba8-4291-a052-827af590382c',
  completionPercent: 46,
  steps: [
    {
      stepId: 'fc406e86-27ba-4e4a-bdde-c6175f9a85bc',
      stepTitle: 'Kesif',
      completedTaskCount: 4,
      totalTaskCount: 8,
      estimatedDuration: '2 gun'
    },
    {
      stepId: 'ac4f20f4-257f-4f41-8dc2-e66ff82e0b67',
      stepTitle: 'Kurulum',
      completedTaskCount: 5,
      totalTaskCount: 10,
      estimatedDuration: '4 gun'
    },
    {
      stepId: 'b38be8bf-2f5c-4d69-9e6f-42aa01f55339',
      stepTitle: 'Canliya Gecis',
      completedTaskCount: 2,
      totalTaskCount: 6,
      estimatedDuration: '1 gun'
    }
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
