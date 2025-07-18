/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IFileSystemService } from '../../../../platform/filesystem/common/fileSystemService';
import { IProjectSpecService, ProjectSpec, TaskItem, TaskPriority, TaskStatus } from '../../common/projectSpecService';
import { ProjectSpecService } from '../projectSpecService';

describe('ProjectSpecService', () => {
	let service: IProjectSpecService;
	let mockFileSystemService: IFileSystemService;

	beforeEach(() => {
		mockFileSystemService = {
			_serviceBrand: undefined,
			readFile: vi.fn(),
			writeFile: vi.fn(),
			exists: vi.fn(),
			readdir: vi.fn(),
			createFile: vi.fn(),
			delete: vi.fn(),
			copy: vi.fn(),
			move: vi.fn(),
			stat: vi.fn(),
			watch: vi.fn(),
			onDidChangeCapabilities: vi.fn(),
			onDidChangeFile: vi.fn(),
			getCapabilities: vi.fn(),
			hasProvider: vi.fn(),
			activateProvider: vi.fn(),
			canHandleResource: vi.fn(),
			hasCapability: vi.fn(),
			listCapabilities: vi.fn(),
		} as any;

		service = new ProjectSpecService(mockFileSystemService);
	});

	describe('Project Management', () => {
		it('should create a new project spec', async () => {
			const spec = await service.createProjectSpec('Test Project', 'Test requirements', 'Test design');

			expect(spec).toBeDefined();
			expect(spec.name).toBe('Test Project');
			expect(spec.requirements).toBe('Test requirements');
			expect(spec.design).toBe('Test design');
			expect(spec.id).toBeDefined();
			expect(spec.tasks).toEqual([]);
		});

		it('should list all project specs', async () => {
			await service.createProjectSpec('Project 1');
			await service.createProjectSpec('Project 2');

			const specs = await service.getProjectSpecs();

			expect(specs).toHaveLength(2);
			expect(specs[0].name).toBe('Project 1');
			expect(specs[1].name).toBe('Project 2');
		});

		it('should set and get active project spec', async () => {
			const spec1 = await service.createProjectSpec('Project 1');
			const spec2 = await service.createProjectSpec('Project 2');

			// Initially no active spec
			let activeSpec = await service.getActiveProjectSpec();
			expect(activeSpec).toBeUndefined();

			// Set active spec
			await service.setActiveProjectSpec(spec1.id);
			activeSpec = await service.getActiveProjectSpec();
			expect(activeSpec?.id).toBe(spec1.id);

			// Change active spec
			await service.setActiveProjectSpec(spec2.id);
			activeSpec = await service.getActiveProjectSpec();
			expect(activeSpec?.id).toBe(spec2.id);
		});

		it('should update project spec', async () => {
			const spec = await service.createProjectSpec('Original Name');

			const updatedSpec: ProjectSpec = {
				...spec,
				name: 'Updated Name',
				requirements: 'Updated requirements',
				design: 'Updated design'
			};

			await service.updateProjectSpec(updatedSpec);

			const specs = await service.getProjectSpecs();
			const retrievedSpec = specs.find(s => s.id === spec.id);

			expect(retrievedSpec?.name).toBe('Updated Name');
			expect(retrievedSpec?.requirements).toBe('Updated requirements');
			expect(retrievedSpec?.design).toBe('Updated design');
		});

		it('should delete project spec', async () => {
			const spec = await service.createProjectSpec('To Delete');

			let specs = await service.getProjectSpecs();
			expect(specs).toHaveLength(1);

			await service.deleteProjectSpec(spec.id);

			specs = await service.getProjectSpecs();
			expect(specs).toHaveLength(0);
		});
	});

	describe('Task Management', () => {
		let projectSpec: ProjectSpec;

		beforeEach(async () => {
			projectSpec = await service.createProjectSpec('Test Project');
		});

		it('should add task to project spec', async () => {
			const taskData = {
				title: 'Test Task',
				description: 'Test description',
				status: TaskStatus.Todo,
				priority: TaskPriority.Medium
			};

			const task = await service.addTask(projectSpec.id, taskData);

			expect(task).toBeDefined();
			expect(task.title).toBe('Test Task');
			expect(task.description).toBe('Test description');
			expect(task.status).toBe(TaskStatus.Todo);
			expect(task.priority).toBe(TaskPriority.Medium);
			expect(task.id).toBeDefined();

			// Verify task was added to project
			const specs = await service.getProjectSpecs();
			const updatedSpec = specs.find(s => s.id === projectSpec.id);
			expect(updatedSpec?.tasks).toHaveLength(1);
			expect(updatedSpec?.tasks[0].id).toBe(task.id);
		});

		it('should update task', async () => {
			const task = await service.addTask(projectSpec.id, {
				title: 'Original Title',
				status: TaskStatus.Todo,
				priority: TaskPriority.Low
			});

			const updatedTask: TaskItem = {
				...task,
				title: 'Updated Title',
				status: TaskStatus.InProgress,
				priority: TaskPriority.High,
				description: 'Updated description'
			};

			await service.updateTask(projectSpec.id, updatedTask);

			const specs = await service.getProjectSpecs();
			const spec = specs.find(s => s.id === projectSpec.id);
			const retrievedTask = spec?.tasks.find(t => t.id === task.id);

			expect(retrievedTask?.title).toBe('Updated Title');
			expect(retrievedTask?.status).toBe(TaskStatus.InProgress);
			expect(retrievedTask?.priority).toBe(TaskPriority.High);
			expect(retrievedTask?.description).toBe('Updated description');
		});

		it('should delete task', async () => {
			const task1 = await service.addTask(projectSpec.id, {
				title: 'Task 1',
				status: TaskStatus.Todo
			});

			const task2 = await service.addTask(projectSpec.id, {
				title: 'Task 2',
				status: TaskStatus.Todo
			});

			let specs = await service.getProjectSpecs();
			let spec = specs.find(s => s.id === projectSpec.id);
			expect(spec?.tasks).toHaveLength(2);

			await service.deleteTask(projectSpec.id, task1.id);

			specs = await service.getProjectSpecs();
			spec = specs.find(s => s.id === projectSpec.id);
			expect(spec?.tasks).toHaveLength(1);
			expect(spec?.tasks[0].id).toBe(task2.id);
		});

		it('should handle multiple tasks with different statuses', async () => {
			await service.addTask(projectSpec.id, { title: 'Todo Task', status: TaskStatus.Todo });
			await service.addTask(projectSpec.id, { title: 'In Progress Task', status: TaskStatus.InProgress });
			await service.addTask(projectSpec.id, { title: 'Done Task', status: TaskStatus.Done });
			await service.addTask(projectSpec.id, { title: 'Blocked Task', status: TaskStatus.Blocked });

			const specs = await service.getProjectSpecs();
			const spec = specs.find(s => s.id === projectSpec.id);

			expect(spec?.tasks).toHaveLength(4);

			const todoTasks = spec?.tasks.filter(t => t.status === TaskStatus.Todo);
			const inProgressTasks = spec?.tasks.filter(t => t.status === TaskStatus.InProgress);
			const doneTasks = spec?.tasks.filter(t => t.status === TaskStatus.Done);
			const blockedTasks = spec?.tasks.filter(t => t.status === TaskStatus.Blocked);

			expect(todoTasks).toHaveLength(1);
			expect(inProgressTasks).toHaveLength(1);
			expect(doneTasks).toHaveLength(1);
			expect(blockedTasks).toHaveLength(1);
		});
	});

	describe('Event Emission', () => {
		it('should emit events when specs change', async () => {
			let eventFired = false;

			// Subscribe to events
			service.onDidChangeSpecs(() => {
				eventFired = true;
			});

			await service.createProjectSpec('Test Project');

			expect(eventFired).toBe(true);
		});

		it('should emit events when tasks change', async () => {
			const spec = await service.createProjectSpec('Test Project');
			let eventCount = 0;

			service.onDidChangeSpecs(() => {
				eventCount++;
			});

			await service.addTask(spec.id, { title: 'Task 1', status: TaskStatus.Todo });
			await service.addTask(spec.id, { title: 'Task 2', status: TaskStatus.Todo });

			expect(eventCount).toBe(2);
		});
	});

	describe('Error Handling', () => {
		it('should throw error when updating non-existent project', async () => {
			const nonExistentSpec: ProjectSpec = {
				id: 'non-existent',
				name: 'Test',
				requirements: '',
				design: '',
				tasks: [],
				created: new Date(),
				modified: new Date()
			};

			await expect(service.updateProjectSpec(nonExistentSpec))
				.rejects.toThrow('Project specification not found');
		});

		it('should throw error when adding task to non-existent project', async () => {
			await expect(service.addTask('non-existent', { title: 'Test', status: TaskStatus.Todo }))
				.rejects.toThrow('Project specification not found');
		});

		it('should throw error when updating task in non-existent project', async () => {
			const task: TaskItem = {
				id: 'task-id',
				title: 'Test',
				status: TaskStatus.Todo,
				priority: TaskPriority.Medium,
				created: new Date(),
				modified: new Date()
			};

			await expect(service.updateTask('non-existent', task))
				.rejects.toThrow('Project specification not found');
		});

		it('should throw error when deleting task from non-existent project', async () => {
			await expect(service.deleteTask('non-existent', 'task-id'))
				.rejects.toThrow('Project specification not found');
		});

		it('should throw error when setting non-existent project as active', async () => {
			await expect(service.setActiveProjectSpec('non-existent'))
				.rejects.toThrow('Project specification not found');
		});
	});

	describe('Data Integrity', () => {
		it('should generate unique IDs for projects', async () => {
			const spec1 = await service.createProjectSpec('Project 1');
			const spec2 = await service.createProjectSpec('Project 2');

			expect(spec1.id).not.toBe(spec2.id);
		});

		it('should generate unique IDs for tasks', async () => {
			const spec = await service.createProjectSpec('Test Project');

			const task1 = await service.addTask(spec.id, { title: 'Task 1', status: TaskStatus.Todo });
			const task2 = await service.addTask(spec.id, { title: 'Task 2', status: TaskStatus.Todo });

			expect(task1.id).not.toBe(task2.id);
		});

		it('should update modification timestamps', async () => {
			const spec = await service.createProjectSpec('Test Project');
			const originalModified = spec.modified;

			// Wait a bit to ensure timestamp difference
			await new Promise(resolve => setTimeout(resolve, 1));

			const updatedSpec = { ...spec, name: 'Updated Name' };
			await service.updateProjectSpec(updatedSpec);

			const specs = await service.getProjectSpecs();
			const retrievedSpec = specs.find(s => s.id === spec.id);

			expect(retrievedSpec?.modified.getTime()).toBeGreaterThan(originalModified.getTime());
		});

		it('should maintain task order', async () => {
			const spec = await service.createProjectSpec('Test Project');

			await service.addTask(spec.id, { title: 'First Task', status: TaskStatus.Todo });
			await service.addTask(spec.id, { title: 'Second Task', status: TaskStatus.Todo });
			await service.addTask(spec.id, { title: 'Third Task', status: TaskStatus.Todo });

			const specs = await service.getProjectSpecs();
			const retrievedSpec = specs.find(s => s.id === spec.id);

			expect(retrievedSpec?.tasks[0].title).toBe('First Task');
			expect(retrievedSpec?.tasks[1].title).toBe('Second Task');
			expect(retrievedSpec?.tasks[2].title).toBe('Third Task');
		});
	});
});
