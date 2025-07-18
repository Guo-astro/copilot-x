/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { ProjectSpecTool } from '../../../tools/vscode-node/projectSpecTool';
import { IProjectSpecService, ProjectSpec, TaskPriority, TaskStatus } from '../../common/projectSpecService';

describe('ProjectSpecTool', () => {
	let tool: ProjectSpecTool;
	let mockProjectSpecService: IProjectSpecService;
	let mockProject: ProjectSpec;

	beforeEach(() => {
		mockProject = {
			id: 'test-project-1',
			name: 'Test E-commerce Platform',
			description: 'A comprehensive e-commerce solution',
			requirements: 'Must support OAuth2 authentication, PCI compliance for payments, mobile-first design',
			design: 'Microservices architecture with React frontend, Node.js backend, PostgreSQL database',
			tasks: [
				{
					id: 'task-1',
					title: 'Implement user authentication',
					description: 'OAuth2 and SAML support',
					status: TaskStatus.InProgress,
					priority: TaskPriority.High,
					created: new Date('2023-01-01'),
					modified: new Date('2023-01-02')
				},
				{
					id: 'task-2',
					title: 'Setup payment processing',
					description: 'Stripe integration with PCI compliance',
					status: TaskStatus.Todo,
					priority: TaskPriority.Critical,
					created: new Date('2023-01-01'),
					modified: new Date('2023-01-01')
				},
				{
					id: 'task-3',
					title: 'Design responsive UI',
					description: 'Mobile-first responsive design',
					status: TaskStatus.Done,
					priority: TaskPriority.Medium,
					created: new Date('2023-01-01'),
					modified: new Date('2023-01-01')
				}
			],
			created: new Date('2023-01-01'),
			modified: new Date('2023-01-02')
		};

		mockProjectSpecService = {
			_serviceBrand: undefined,
			getProjectSpecs: vi.fn().mockResolvedValue([mockProject]),
			getProjectSpec: vi.fn().mockResolvedValue(mockProject),
			getActiveProjectSpec: vi.fn().mockResolvedValue(mockProject),
			setActiveProjectSpec: vi.fn(),
			createProjectSpec: vi.fn(),
			updateProjectSpec: vi.fn(),
			deleteProjectSpec: vi.fn(),
			addTask: vi.fn(),
			updateTask: vi.fn(),
			deleteTask: vi.fn(),
			importFromMarkdown: vi.fn(),
			exportToMarkdown: vi.fn(),
			onDidChangeSpecs: vi.fn()
		};

		tool = new ProjectSpecTool(mockProjectSpecService);
	});

	describe('Tool Registration', () => {
		it('should have correct tool name', () => {
			expect(ProjectSpecTool.toolName).toBe('project_spec');
		});

		it('should be properly instantiated', () => {
			expect(tool).toBeDefined();
			expect(tool.invoke).toBeDefined();
		});
	});

	describe('Tool Actions', () => {
		it('should return project status by default', async () => {
			const options = {
				input: {},
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result).toBeDefined();
			expect(result.content).toContain('Test E-commerce Platform');
			expect(result.content).toContain('3 tasks');
			expect(result.content).toContain('1 completed');
			expect(result.content).toContain('1 in progress');
			expect(result.content).toContain('1 todo');
		});

		it('should return requirements when action is "requirements"', async () => {
			const options = {
				input: { action: 'requirements' as const },
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result).toBeDefined();
			expect(result.content).toContain('Requirements');
			expect(result.content).toContain('OAuth2 authentication');
			expect(result.content).toContain('PCI compliance');
			expect(result.content).toContain('mobile-first design');
		});

		it('should return design when action is "design"', async () => {
			const options = {
				input: { action: 'design' as const },
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result).toBeDefined();
			expect(result.content).toContain('Design');
			expect(result.content).toContain('Microservices architecture');
			expect(result.content).toContain('React frontend');
			expect(result.content).toContain('Node.js backend');
			expect(result.content).toContain('PostgreSQL database');
		});

		it('should return task list when action is "tasks"', async () => {
			const options = {
				input: { action: 'tasks' as const },
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result).toBeDefined();
			expect(result.content).toContain('Task List');
			expect(result.content).toContain('Implement user authentication');
			expect(result.content).toContain('Setup payment processing');
			expect(result.content).toContain('Design responsive UI');
			expect(result.content).toContain('🔄 IN PROGRESS');
			expect(result.content).toContain('📝 TODO');
			expect(result.content).toContain('✅ DONE');
		});

		it('should return all project specs when action is "list"', async () => {
			const options = {
				input: { action: 'list' as const },
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result).toBeDefined();
			expect(result.content).toContain('Project Specifications');
			expect(result.content).toContain('Test E-commerce Platform');
			expect(result.content).toContain('ACTIVE');
		});
	});

	describe('Context Handling', () => {
		it('should handle no active project', async () => {
			mockProjectSpecService.getActiveProjectSpec = vi.fn().mockResolvedValue(undefined);

			const options = {
				input: { action: 'status' as const },
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result).toBeDefined();
			expect(result.content).toContain('No active project specification');
		});

		it('should handle empty requirements', async () => {
			const projectWithEmptyRequirements = { ...mockProject, requirements: '' };
			mockProjectSpecService.getActiveProjectSpec = vi.fn().mockResolvedValue(projectWithEmptyRequirements);

			const options = {
				input: { action: 'requirements' as const },
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result).toBeDefined();
			expect(result.content).toContain('No requirements defined');
		});

		it('should handle empty design', async () => {
			const projectWithEmptyDesign = { ...mockProject, design: '' };
			mockProjectSpecService.getActiveProjectSpec = vi.fn().mockResolvedValue(projectWithEmptyDesign);

			const options = {
				input: { action: 'design' as const },
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result).toBeDefined();
			expect(result.content).toContain('No design documentation defined');
		});

		it('should handle project with no tasks', async () => {
			const projectWithNoTasks = { ...mockProject, tasks: [] };
			mockProjectSpecService.getActiveProjectSpec = vi.fn().mockResolvedValue(projectWithNoTasks);

			const options = {
				input: { action: 'tasks' as const },
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result).toBeDefined();
			expect(result.content).toContain('No tasks defined');
		});
	});

	describe('Task Status Formatting', () => {
		it('should correctly format different task statuses', async () => {
			const options = {
				input: { action: 'tasks' }
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result.content).toContain('🔄 IN PROGRESS - Implement user authentication');
			expect(result.content).toContain('📝 TODO - Setup payment processing');
			expect(result.content).toContain('✅ DONE - Design responsive UI');
		});

		it('should show task priorities', async () => {
			const options = {
				input: { action: 'tasks' },
				token: {} as vscode.CancellationToken
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result.content).toContain('HIGH');
			expect(result.content).toContain('CRITICAL');
			expect(result.content).toContain('MEDIUM');
		});
	});

	describe('Progress Calculation', () => {
		it('should correctly calculate task progress', async () => {
			const options = {
				input: { action: 'status' },
				token: {} as vscode.CancellationToken
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			// 1 done out of 3 total = 33% completion
			expect(result.content).toContain('1 completed');
			expect(result.content).toContain('1 in progress');
			expect(result.content).toContain('1 todo');
			expect(result.content).toContain('3 tasks');
		});

		it('should handle 100% completion', async () => {
			const allDoneTasks = mockProject.tasks.map(task => ({ ...task, status: TaskStatus.Done }));
			const completedProject = { ...mockProject, tasks: allDoneTasks };
			mockProjectSpecService.getActiveProjectSpec = vi.fn().mockResolvedValue(completedProject);

			const options = {
				input: { action: 'status' },
				token: {} as vscode.CancellationToken
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result.content).toContain('3 completed');
			expect(result.content).toContain('0 in progress');
			expect(result.content).toContain('0 todo');
		});
	});

	describe('Error Handling', () => {
		it('should handle service errors gracefully', async () => {
			mockProjectSpecService.getActiveProjectSpec = vi.fn().mockRejectedValue(new Error('Service error'));

			const options = {
				input: { action: 'status' },
				token: {} as vscode.CancellationToken
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			expect(result).toBeDefined();
			expect(result.content).toContain('Error');
		});

		it('should handle unknown actions gracefully', async () => {
			const options = {
				input: { action: 'unknown-action' },
				token: {} as vscode.CancellationToken
			};

			const result = await tool.invoke(options as any, {} as vscode.CancellationToken);

			// Should default to status action
			expect(result).toBeDefined();
			expect(result.content).toContain('Test E-commerce Platform');
		});
	});

	describe('Integration Context', () => {
		it('should provide comprehensive context for agent', async () => {
			// Test that the tool provides all necessary context for AI agent decisions
			const requirementsResult = await tool.invoke({
				input: { action: 'requirements' }
			} as any, {} as vscode.CancellationToken);

			const designResult = await tool.invoke({
				input: { action: 'design' }
			} as any, {} as vscode.CancellationToken);

			const tasksResult = await tool.invoke({
				input: { action: 'tasks' }
			} as any, {} as vscode.CancellationToken);

			// Agent should have access to:
			// 1. Project requirements (what needs to be built)
			expect(requirementsResult.content).toContain('OAuth2');
			expect(requirementsResult.content).toContain('PCI compliance');

			// 2. Design decisions (how it should be built)
			expect(designResult.content).toContain('Microservices');
			expect(designResult.content).toContain('React');

			// 3. Current task status (what's being worked on)
			expect(tasksResult.content).toContain('user authentication');
			expect(tasksResult.content).toContain('IN PROGRESS');
		});
	});
});
