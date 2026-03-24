import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProjectWorkflowApiService } from './project-workflow-api.service';

describe('ProjectWorkflowApiService', () => {
  let service: ProjectWorkflowApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectWorkflowApiService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ProjectWorkflowApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch projects list', () => {
    service.getProjects(3).subscribe((data) => {
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
