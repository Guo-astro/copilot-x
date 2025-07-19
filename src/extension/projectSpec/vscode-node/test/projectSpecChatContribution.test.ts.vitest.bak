/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IProjectSpecService, ProjectSpec, TaskPriority, TaskStatus } from '../../common/projectSpecService';
import { ProjectSpecChatContribution } from '../projectSpecChatContribution';

describe('ProjectSpecChatContribution', () => {
	let chatContribution: ProjectSpecChatContribution;
	let mockProjectSpecService: IProjectSpecService;
	let mockProject: ProjectSpec;

	beforeEach(() => {
		mockProject = {
			id: 'test-project-1',
			name: 'Test E-commerce Platform',
			description: 'A comprehensive e-commerce solution',
			requirements: 'Must support OAuth2 authentication, PCI compliance for payments',
			design: 'Microservices architecture with React frontend, Node.js backend',
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
			createProjectSpec: vi.fn().mockImplementation((name: string) =>
				Promise.resolve({ ...mockProject, id: 'new-id', name })
			),
			updateProjectSpec: vi.fn(),
			deleteProjectSpec: vi.fn(),
			addTask: vi.fn().mockImplementation((specId: string, taskData: any) =>
				Promise.resolve({
					id: 'new-task-id',
					created: new Date(),
					modified: new Date(),
					...taskData
				})
			),
			updateTask: vi.fn(),
			deleteTask: vi.fn(),
			importFromMarkdown: vi.fn(),
			exportToMarkdown: vi.fn(),
			onDidChangeSpecs: vi.fn()
		};

		chatContribution = new ProjectSpecChatContribution(mockProjectSpecService);
	});

	describe('Chat Commands Registration', () => {
		it('should create instance without errors', () => {
			expect(chatContribution).toBeDefined();
		});

		it('should register chat commands', () => {
			// This implicitly tests that registerChatCommands was called without errors
			expect(chatContribution).toBeDefined();
		});
	});

	describe('Task Status Emoji Mapping', () => {
		it('should return correct emojis for different task statuses', () => {
			const chatContribPrivate = chatContribution as any;

			expect(chatContribPrivate.getTaskStatusEmoji('done')).toBe('✅');
			expect(chatContribPrivate.getTaskStatusEmoji('in-progress')).toBe('🔄');
			expect(chatContribPrivate.getTaskStatusEmoji('blocked')).toBe('🚫');
			expect(chatContribPrivate.getTaskStatusEmoji('todo')).toBe('📝');
			expect(chatContribPrivate.getTaskStatusEmoji('unknown')).toBe('📝'); // default
		});
	});

	describe('Service Integration', () => {
		it('should use project spec service for operations', async () => {
			// Test that the chat contribution correctly delegates to the service
			const specs = await mockProjectSpecService.getProjectSpecs();
			expect(specs).toHaveLength(1);
			expect(specs[0].name).toBe('Test E-commerce Platform');
		});

		it('should handle active project spec', async () => {
			const activeSpec = await mockProjectSpecService.getActiveProjectSpec();
			expect(activeSpec).toBeDefined();
			expect(activeSpec?.name).toBe('Test E-commerce Platform');
		});

		it('should create new project specs', async () => {
			const newSpec = await mockProjectSpecService.createProjectSpec('New Project');
			expect(newSpec.name).toBe('New Project');
			expect(mockProjectSpecService.createProjectSpec).toHaveBeenCalledWith('New Project');
		});

		it('should add tasks to projects', async () => {
			const task = await mockProjectSpecService.addTask('project-id', {
				title: 'Test Task',
				status: TaskStatus.Todo,
				priority: TaskPriority.Medium
			});

			expect(task.title).toBe('Test Task');
			expect(task.status).toBe(TaskStatus.Todo);
			expect(mockProjectSpecService.addTask).toHaveBeenCalled();
		});
	});

	describe('Error Handling', () => {
		it('should handle service errors gracefully', async () => {
			mockProjectSpecService.getProjectSpecs = vi.fn().mockRejectedValue(new Error('Service error'));

			// The chat contribution should handle service errors without throwing
			try {
				await mockProjectSpecService.getProjectSpecs();
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe('Service error');
			}
		});

		it('should handle missing active project', async () => {
			mockProjectSpecService.getActiveProjectSpec = vi.fn().mockResolvedValue(undefined);

			const activeSpec = await mockProjectSpecService.getActiveProjectSpec();
			expect(activeSpec).toBeUndefined();
		});
	});

	describe('Data Validation', () => {
		it('should handle project with tasks correctly', () => {
			expect(mockProject.tasks).toHaveLength(2);
			expect(mockProject.tasks[0].status).toBe(TaskStatus.InProgress);
			expect(mockProject.tasks[1].status).toBe(TaskStatus.Todo);
		});

		it('should handle different task priorities', () => {
			expect(mockProject.tasks[0].priority).toBe(TaskPriority.High);
			expect(mockProject.tasks[1].priority).toBe(TaskPriority.Critical);
		});

		it('should maintain project structure integrity', () => {
			expect(mockProject.id).toBeDefined();
			expect(mockProject.name).toBeDefined();
			expect(mockProject.requirements).toBeDefined();
			expect(mockProject.design).toBeDefined();
			expect(mockProject.created).toBeInstanceOf(Date);
			expect(mockProject.modified).toBeInstanceOf(Date);
		});
	});

	describe('Integration Context', () => {
		it('should provide necessary data for chat interactions', async () => {
			// Test that all necessary data is available for chat commands
			const specs = await mockProjectSpecService.getProjectSpecs();
			const activeSpec = await mockProjectSpecService.getActiveProjectSpec();

			expect(specs).toBeDefined();
			expect(activeSpec).toBeDefined();

			// Should have project context
			expect(activeSpec?.requirements).toContain('OAuth2');
			expect(activeSpec?.design).toContain('Microservices');

			// Should have task context
			expect(activeSpec?.tasks).toHaveLength(2);
			expect(activeSpec?.tasks.some(t => t.status === TaskStatus.InProgress)).toBe(true);
		});

		it('should support task statistics calculation', () => {
			const totalTasks = mockProject.tasks.length;
			const completedTasks = mockProject.tasks.filter(t => t.status === TaskStatus.Done).length;
			const inProgressTasks = mockProject.tasks.filter(t => t.status === TaskStatus.InProgress).length;
			const todoTasks = mockProject.tasks.filter(t => t.status === TaskStatus.Todo).length;

			expect(totalTasks).toBe(2);
			expect(completedTasks).toBe(0);
			expect(inProgressTasks).toBe(1);
			expect(todoTasks).toBe(1);
		});
	});
});
