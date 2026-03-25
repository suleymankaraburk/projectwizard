import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ProjectWorkflowApiService } from '../../services/project-workflow-api.service';
import { ProjectCreatePage } from './project-create.page';

describe('ProjectCreatePage', () => {
  it('should submit and navigate to detail', () => {
    const createProject = vi.fn().mockReturnValue(of(77));
    const navigate = vi.fn().mockResolvedValue(true);

    TestBed.configureTestingModule({
      imports: [ProjectCreatePage],
      providers: [
        { provide: ProjectWorkflowApiService, useValue: { createProject } },
        { provide: Router, useValue: { navigate } }
      ]
    });

    const fixture = TestBed.createComponent(ProjectCreatePage);
    const component = fixture.componentInstance;
    component.form.patchValue({
      companyId: '11111111-1111-1111-1111-111111111111',
      name: 'Pilot Proje'
    });
    component.submit();

    expect(createProject).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/projects', 77]);
  });
});
