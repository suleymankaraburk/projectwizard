export interface ApiEnvelope<T> {
  isSuccess: boolean;
  message: string;
  data: T;
}

export type ProjectStatus = 'Draft' | 'InProgress' | 'Completed';
export type TaskStatus = 'Todo' | 'InProgress' | 'Done';
export type ActionType = 'OpenUrl' | 'ShowMappedData' | null;

export interface ProjectSummaryDto {
  projectId: number;
  companyId: number;
  name: string;
  status: ProjectStatus;
  completionPercent: number;
}

export interface CreateProjectRequest {
  companyId: number;
  name: string;
}

export interface ProjectDetailDto extends ProjectSummaryDto {
  questions: ProjectQuestionDto[];
}

export interface CreateTemplateRequest {
  name: string;
}

export interface CreateTemplateResultDto {
  id: string;
  code: string;
  name: string;
  version: number;
  isActive: boolean;
}

export interface ProjectWorkflowTemplateDto {
  id: string;
  code: string;
  name: string;
  version: number;
  isActive: boolean;
}

export interface AddTemplateStepRequest {
  templateId: string;
  title: string;
  order: number;
}

export interface AddTemplateStepResultDto {
  id: string;
  templateId: string;
  title: string;
  order: number;
}

export interface ProjectWorkflowTemplateStepDto {
  id: string;
  templateId: string;
  title: string;
  order: number;
}

export interface AddTemplateQuestionRequest {
  stepId: string;
  code: string;
  text: string;
  answerType: TemplateAnswerType;
  isRequired: boolean;
  order: number;
  options?: AddTemplateQuestionOptionRequest[];
}

export interface TemplateQuestionDto {
  id: string;
  templateQuestionId?: number;
  code: string;
  text: string;
  answerType: TemplateAnswerType;
  isRequired: boolean;
  order: number;
  options: TemplateQuestionOptionDto[];
}

export interface TemplateStepDto {
  id: string;
  templateStepId?: string;
  title: string;
  order: number;
  questions: TemplateQuestionDto[];
}

export interface TemplateDetailDto {
  id?: string;
  templateId: string;
  code?: string;
  name: string;
  version?: number;
  isActive?: boolean;
  steps: TemplateStepDto[];
}

export type TemplateAnswerType = 'Text' | 'SingleSelect' | 'MultiSelect';

export interface TemplateQuestionOptionDto {
  id: string;
  templateQuestionId: string;
  code: string;
  label: string;
  value?: string | null;
  order: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface AddTemplateQuestionOptionRequest {
  templateQuestionId: string;
  code: string;
  label: string;
  value?: string;
  order: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface UpdateTemplateQuestionOptionRequest {
  id: string;
  templateQuestionId: string;
  code: string;
  label: string;
  value?: string;
  order: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface RemoveTemplateQuestionOptionRequest {
  id: string;
}

export interface UpdateTemplateQuestionRequest {
  questionId: string;
  code: string;
  text: string;
  answerType: TemplateAnswerType;
  isRequired: boolean;
  order: number;
  options: UpdateTemplateQuestionRequestOption[];
}

export interface UpdateTemplateQuestionRequestOption {
  optionId: string | null;
  code: string;
  label: string;
  value: string | null;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface ApplyTemplateRequest {
  projectId: number;
  templateId: string;
}

export interface AddProjectQuestionRequest {
  projectId: number;
  text: string;
  answerType: string;
  required: boolean;
  order: number;
}

export interface RemoveProjectQuestionRequest {
  projectQuestionId: number;
}

export interface SaveProjectAnswerRequest {
  projectQuestionId: number;
  answer: string;
}

export interface RebuildTasksRequest {
  projectId: number;
}

export interface ProjectQuestionDto {
  projectQuestionId: number;
  text: string;
  answerType: string;
  required: boolean;
  order: number;
  isCustom: boolean;
  answer?: string | null;
}

export interface ProjectTaskDto {
  taskId: number;
  title: string;
  status: TaskStatus;
  actionType: ActionType;
  actionPayload?: string | null;
  subtasks: ProjectSubTaskDto[];
}

export interface ProjectSubTaskDto {
  subTaskId: number;
  title: string;
  status: TaskStatus;
}

export interface UpdateTaskStatusRequest {
  taskId: number;
  status: TaskStatus;
}

export interface UpdateSubTaskStatusRequest {
  subTaskId: number;
  status: TaskStatus;
}

export interface StepProgressDto {
  stepTitle: string;
  completed: number;
  total: number;
}

export interface ProjectProgressDto {
  completionPercent: number;
  totalCompleted: number;
  totalCount: number;
  steps: StepProgressDto[];
}
