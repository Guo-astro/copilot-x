/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it } from 'vitest';
import { IProjectSpecService, TaskPriority, TaskStatus } from '../../common/projectSpecService';
import { ProjectSpecChatContribution } from '../projectSpecChatContribution';
import { ProjectSpecService } from '../projectSpecService';

describe('Project Specification System Integration', () => {
	let service: IProjectSpecService;
	let chatContribution: ProjectSpecChatContribution;

	beforeEach(() => {
		// Note: This uses a real service instance for integration testing
		// In a real test environment, you'd want to use a test-specific file system
		const mockFileSystemService = {
			_serviceBrand: undefined,
			readFile: async () => new Uint8Array(),
			writeFile: async () => { },
			exists: async () => false,
			readdir: async () => [],
			createFile: async () => { },
			delete: async () => { },
			copy: async () => { },
			move: async () => { },
			stat: async () => ({ type: 1, ctime: 0, mtime: 0, size: 0 }),
			watch: () => ({ dispose: () => { } }),
			onDidChangeCapabilities: () => ({ dispose: () => { } }),
			onDidChangeFile: () => ({ dispose: () => { } }),
			getCapabilities: () => ({ readonly: false }),
			hasProvider: () => true,
			activateProvider: async () => { },
			canHandleResource: () => true,
			hasCapability: () => true,
			listCapabilities: () => [],
		} as any;

		service = new ProjectSpecService(mockFileSystemService);
		chatContribution = new ProjectSpecChatContribution(service);
	});

	describe('End-to-End Workflow', () => {
		it('should create project, add tasks, and track progress', async () => {
			// 1. Create a new project specification
			const project = await service.createProjectSpec(
				'E-commerce Platform',
				'Must support OAuth2, payments, mobile-first design',
				'React frontend, Node.js backend, PostgreSQL database'
			);

			expect(project.name).toBe('E-commerce Platform');
			expect(project.requirements).toContain('OAuth2');
			expect(project.design).toContain('React frontend');

			// 2. Set it as active project
			await service.setActiveProjectSpec(project.id);
			const activeProject = await service.getActiveProjectSpec();
			expect(activeProject?.id).toBe(project.id);

			// 3. Add tasks to the project
			const authTask = await service.addTask(project.id, {
				title: 'Implement OAuth2 authentication',
				description: 'Support Google, GitHub, and Microsoft OAuth2',
				status: TaskStatus.Todo,
				priority: TaskPriority.High
			});

			await service.addTask(project.id, {
				title: 'Integrate Stripe payments',
				description: 'Support credit cards and PayPal',
				status: TaskStatus.Todo,
				priority: TaskPriority.Critical
			});

			const uiTask = await service.addTask(project.id, {
				title: 'Create responsive UI',
				description: 'Mobile-first responsive design',
				status: TaskStatus.InProgress,
				priority: TaskPriority.Medium
			});

			// 4. Verify tasks were added
			const updatedProject = await service.getActiveProjectSpec();
			expect(updatedProject?.tasks).toHaveLength(3);

			// 5. Update task status (simulating development progress)
			await service.updateTask(project.id, {
				...authTask,
				status: TaskStatus.InProgress
			});

			await service.updateTask(project.id, {
				...uiTask,
				status: TaskStatus.Done
			});

			// 6. Verify progress tracking
			const finalProject = await service.getActiveProjectSpec();
			const tasks = finalProject?.tasks || [];

			const todoTasks = tasks.filter(t => t.status === TaskStatus.Todo);
			const inProgressTasks = tasks.filter(t => t.status === TaskStatus.InProgress);
			const doneTasks = tasks.filter(t => t.status === TaskStatus.Done);

			expect(todoTasks).toHaveLength(1); // payment task
			expect(inProgressTasks).toHaveLength(1); // auth task (updated)
			expect(doneTasks).toHaveLength(1); // ui task (completed)

			// 7. Verify critical tasks are tracked
			const criticalTasks = tasks.filter(t => t.priority === TaskPriority.Critical);
			expect(criticalTasks).toHaveLength(1);
			expect(criticalTasks[0].title).toContain('Stripe');
		});

		it('should handle multiple projects and context switching', async () => {
			// Create multiple projects
			const ecommerceProject = await service.createProjectSpec(
				'E-commerce Platform',
				'OAuth2, payments, mobile design',
				'React + Node.js'
			);

			const blogProject = await service.createProjectSpec(
				'Blog CMS',
				'User management, content editing, SEO',
				'Next.js + Prisma'
			);

			// Add tasks to each project
			await service.addTask(ecommerceProject.id, {
				title: 'Setup payment gateway',
				status: TaskStatus.Todo,
				priority: TaskPriority.High
			});

			await service.addTask(blogProject.id, {
				title: 'Create post editor',
				status: TaskStatus.InProgress,
				priority: TaskPriority.Medium
			});

			// Switch active project context
			await service.setActiveProjectSpec(ecommerceProject.id);
			let activeProject = await service.getActiveProjectSpec();
			expect(activeProject?.name).toBe('E-commerce Platform');
			expect(activeProject?.tasks).toHaveLength(1);

			await service.setActiveProjectSpec(blogProject.id);
			activeProject = await service.getActiveProjectSpec();
			expect(activeProject?.name).toBe('Blog CMS');
			expect(activeProject?.tasks).toHaveLength(1);

			// Verify projects maintain separate task lists
			const allProjects = await service.getProjectSpecs();
			expect(allProjects).toHaveLength(2);

			const ecommerce = allProjects.find(p => p.name === 'E-commerce Platform');
			const blog = allProjects.find(p => p.name === 'Blog CMS');

			expect(ecommerce?.tasks[0].title).toContain('payment gateway');
			expect(blog?.tasks[0].title).toContain('post editor');
		});

		it('should provide context for AI agent decisions', async () => {
			// Create a project with comprehensive context
			const project = await service.createProjectSpec(
				'Task Management App',
				`Requirements:
				- User authentication with OAuth2
				- Real-time collaboration features
				- Task assignment and tracking
				- Email notifications
				- Mobile app support
				- GDPR compliance`,
				`Design:
				- Frontend: React with TypeScript
				- Backend: Node.js Express API
				- Database: PostgreSQL with Prisma ORM
				- Real-time: Socket.io
				- Authentication: JWT tokens
				- Deployment: Docker containers on AWS`
			);

			await service.setActiveProjectSpec(project.id);

			// Add realistic tasks with dependencies
			await service.addTask(project.id, {
				title: 'Setup user authentication system',
				description: 'Implement OAuth2 with Google, GitHub. JWT token management.',
				status: TaskStatus.InProgress,
				priority: TaskPriority.Critical
			});

			await service.addTask(project.id, {
				title: 'Create task CRUD operations',
				description: 'RESTful API for task creation, reading, updating, deletion',
				status: TaskStatus.Todo,
				priority: TaskPriority.High
			});

			await service.addTask(project.id, {
				title: 'Implement real-time notifications',
				description: 'Socket.io integration for live task updates',
				status: TaskStatus.Todo,
				priority: TaskPriority.Medium
			});

			// Simulate agent context access
			const activeProject = await service.getActiveProjectSpec();

			// Agent should have access to:
			// 1. Project requirements (what needs to be built)
			expect(activeProject?.requirements).toContain('OAuth2');
			expect(activeProject?.requirements).toContain('Real-time collaboration');
			expect(activeProject?.requirements).toContain('GDPR compliance');

			// 2. Design decisions (how it should be built)
			expect(activeProject?.design).toContain('React with TypeScript');
			expect(activeProject?.design).toContain('PostgreSQL with Prisma');
			expect(activeProject?.design).toContain('Socket.io');

			// 3. Current development state (what's being worked on)
			const inProgressTasks = activeProject?.tasks.filter(t => t.status === TaskStatus.InProgress);
			const todoTasks = activeProject?.tasks.filter(t => t.status === TaskStatus.Todo);

			expect(inProgressTasks).toHaveLength(1);
			expect(inProgressTasks?.[0].title).toContain('authentication');

			expect(todoTasks).toHaveLength(2);
			expect(todoTasks?.some(t => t.title.includes('CRUD'))).toBe(true);
			expect(todoTasks?.some(t => t.title.includes('real-time'))).toBe(true);

			// 4. Priority information for decision making
			const criticalTasks = activeProject?.tasks.filter(t => t.priority === TaskPriority.Critical);
			const highTasks = activeProject?.tasks.filter(t => t.priority === TaskPriority.High);

			expect(criticalTasks).toHaveLength(1);
			expect(highTasks).toHaveLength(1);
		});

		it('should maintain data consistency across operations', async () => {
			const project = await service.createProjectSpec('Consistency Test');

			// Test concurrent task additions
			const task1Promise = service.addTask(project.id, {
				title: 'Task 1',
				status: TaskStatus.Todo
			});

			const task2Promise = service.addTask(project.id, {
				title: 'Task 2',
				status: TaskStatus.Todo
			});

			const [task1, task2] = await Promise.all([task1Promise, task2Promise]);

			// Verify both tasks were added
			const updatedProject = await service.getProjectSpecs();
			const targetProject = updatedProject.find(p => p.id === project.id);

			expect(targetProject?.tasks).toHaveLength(2);
			expect(targetProject?.tasks.map(t => t.title)).toContain('Task 1');
			expect(targetProject?.tasks.map(t => t.title)).toContain('Task 2');

			// Test task updates don't interfere with each other
			await service.updateTask(project.id, { ...task1, status: TaskStatus.Done });
			await service.updateTask(project.id, { ...task2, status: TaskStatus.InProgress });

			const finalProject = await service.getActiveProjectSpec();
			const updatedTask1 = finalProject?.tasks.find(t => t.id === task1.id);
			const updatedTask2 = finalProject?.tasks.find(t => t.id === task2.id);

			expect(updatedTask1?.status).toBe(TaskStatus.Done);
			expect(updatedTask2?.status).toBe(TaskStatus.InProgress);
		});
	});

	describe('System Integration Validation', () => {
		it('should confirm all components work together', async () => {
			// This test validates the entire system architecture

			// 1. Service layer works
			const project = await service.createProjectSpec('Integration Test');
			expect(project).toBeDefined();

			// 2. Chat contribution integrates with service
			expect(chatContribution).toBeDefined();

			// 3. Event system works (service emits events)
			let eventFired = false;
			service.onDidChangeSpecs(() => {
				eventFired = true;
			});

			await service.addTask(project.id, {
				title: 'Test Task',
				status: TaskStatus.Todo
			});

			expect(eventFired).toBe(true);

			// 4. Data model consistency
			const retrievedProject = await service.getProjectSpecs();
			expect(retrievedProject[0].tasks).toHaveLength(1);
			expect(retrievedProject[0].tasks[0].title).toBe('Test Task');

			// 5. Context management works
			await service.setActiveProjectSpec(project.id);
			const activeProject = await service.getActiveProjectSpec();
			expect(activeProject?.id).toBe(project.id);
		});
	});
});
