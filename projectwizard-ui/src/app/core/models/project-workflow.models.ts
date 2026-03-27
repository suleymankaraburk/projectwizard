export interface ApiEnvelope<T> {
  isSuccess: boolean;
  message: string;
  data: T;
}

export type ProjectStatus = 'Draft' | 'InProgress' | 'Completed';
export type TaskStatus = 'Todo' | 'InProgress' | 'Completed';
export type ActionType = 'OpenUrl' | 'ShowMappedData' | null;

export interface EmissionCategoryMethodDto {
  categoryCode: string;
  categoryName?: string | null;
  methodCode: string;
  methodNameTR?: string | null;
  methodNameEN?: string | null;
}

export interface ProjectSummaryDto {
  projectId: string;
  companyId: string;
  name: string;
  status: ProjectStatus;
  completionPercent: number;
  templateId?: string | null;
}

export interface CreateProjectRequest {
  companyId: string;
  name: string;
}

export interface ProjectStepLiteDto {
  id: string;
  title: string;
  order: number;
}

export interface ProjectQuestionOptionDto {
  id: string;
  projectQuestionId: string;
  templateOptionId?: string | null;
  code: string;
  label: string;
  value?: string | null;
  order: number;
  isActive: boolean;
}

export interface ProjectQuestionDto {
  id: string;
  projectId: string;
  stepId: string;
  text: string;
  url?: string | null;
  categoryCode?: string | null;
  methodCode?: string | null;
  answerType: string;
  isRequired: boolean;
  isCustom: boolean;
  isActive: boolean;
  options: ProjectQuestionOptionDto[];
  answers?: ProjectQuestionAnswerDto[];
}

export interface ProjectQuestionAnswerDto {
  id: string;
  projectQuestionId: string;
  answerType: string;
  valueJson: string;
  answeredByUserId?: string | null;
  answeredAt?: string | null;
}

export interface ProjectDetailDto {
  id: string;
  templateId: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  steps: ProjectStepLiteDto[];
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
  description: string;
  url?: string | null;
  categoryCode?: string | null;
  methodCode?: string | null;
  answerType: TemplateAnswerType;
  isRequired: boolean;
  order: number;
  options?: AddTemplateQuestionOptionRequest[];
}

export interface TemplateQuestionDto {
  id: string;
  templateQuestionId?: string | null;
  code: string;
  text: string;
  description?: string | null;
  url?: string | null;
  categoryCode?: string | null;
  methodCode?: string | null;
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
  description: string;
  url?: string | null;
  categoryCode?: string | null;
  methodCode?: string | null;
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
  projectId: string;
  templateId: string;
}

export interface AddProjectQuestionRequest {
  projectId: string;
  text: string;
  answerType: string;
  required: boolean;
  order: number;
}

export interface RemoveProjectQuestionRequest {
  projectQuestionId: string;
}

export interface SaveProjectAnswerRequest {
  projectQuestionId: string;
  answerType: string;
  valueJson: string;
}

export interface RebuildTasksRequest {
  projectId: string;
}

export interface ProjectTaskDto {
  taskId: string;
  title: string;
  status: TaskStatus;
  actionType: ActionType;
  actionPayload?: string | null;
  subtasks: ProjectSubTaskDto[];
}

export interface ProjectSubTaskDto {
  subTaskId: string;
  title: string;
  status: TaskStatus;
}

export interface UpdateTaskStatusRequest {
  projectId: string;
  taskId: string;
  status: string;
}

export interface UpdateSubTaskStatusRequest {
  subTaskId: string;
  status: TaskStatus;
}

export interface StepProgressDto {
  stepId: string;
  stepTitle: string;
  completedTaskCount: number;
  totalTaskCount: number;
  estimatedDuration?: string | null;
}

export interface ProjectProgressDto {
  projectId: string;
  completionPercent: number;
  steps: StepProgressDto[];
}
