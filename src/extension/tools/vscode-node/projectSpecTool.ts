/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { IProjectSpecService, ProjectSpec, TaskItem } from '../../projectSpec/common/projectSpecService';
import { ToolName } from '../common/toolNames';
import { ICopilotTool, ToolRegistry } from '../common/toolsRegistry';

interface IProjectSpecParams {
	action: 'list' | 'status' | 'requirements' | 'design' | 'tasks';
	projectId?: string;
}

export class ProjectSpecTool implements ICopilotTool<IProjectSpecParams> {
	public static readonly toolName = ToolName.ProjectSpec;

	constructor(
		@IProjectSpecService private readonly projectSpecService: IProjectSpecService,
	) {
	}

	async invoke(options: vscode.LanguageModelToolInvocationOptions<IProjectSpecParams>, token: vscode.CancellationToken): Promise<vscode.LanguageModelToolResult> {
		const action = options.input.action || 'status';

		try {
			switch (action) {
				case 'list':
					return this.listProjects();
				case 'status':
					return this.getStatus();
				case 'requirements':
					return this.getRequirements();
				case 'design':
					return this.getDesign();
				case 'tasks':
					return this.getTasks();
				default:
					return new vscode.LanguageModelToolResult([
						new vscode.LanguageModelTextPart(`Unknown action: ${action}. Available actions: list, status, requirements, design, tasks`)
					]);
			}
		} catch (error) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Error accessing project specs: ${error instanceof Error ? error.message : String(error)}`)
			]);
		}
	}

	private async listProjects(): Promise<vscode.LanguageModelToolResult> {
		const specs = await this.projectSpecService.getProjectSpecs();

		if (specs.length === 0) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart('No project specifications found.')
			]);
		}

		const specList = specs.map((spec: ProjectSpec) => {
			const taskCount = spec.tasks.length;
			const completedTasks = spec.tasks.filter((t: TaskItem) => t.status === 'done').length;
			return `- **${spec.name}**: ${spec.description || 'No description'} (${completedTasks}/${taskCount} tasks completed)`;
		}).join('\n');

		return new vscode.LanguageModelToolResult([
			new vscode.LanguageModelTextPart(`Available Project Specifications:\n${specList}`)
		]);
	}

	private async getStatus(): Promise<vscode.LanguageModelToolResult> {
		const specs = await this.projectSpecService.getProjectSpecs();

		if (specs.length === 0) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart('No project specifications found. The project needs to be initialized with requirements and design documents.')
			]);
		}

		const activeSpec = await this.projectSpecService.getActiveProjectSpec();
		if (!activeSpec) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`No active project specification. Available specs: ${specs.map((s: ProjectSpec) => s.name).join(', ')}`)
			]);
		}

		const totalTasks = activeSpec.tasks.length;
		const completedTasks = activeSpec.tasks.filter((t: TaskItem) => t.status === 'done').length;
		const inProgressTasks = activeSpec.tasks.filter((t: TaskItem) => t.status === 'in-progress').length;
		const pendingTasks = activeSpec.tasks.filter((t: TaskItem) => t.status === 'todo').length;

		const status = `## Project Status: ${activeSpec.name}

**Description**: ${activeSpec.description || 'No description provided'}

**Overall Progress**: ${completedTasks}/${totalTasks} tasks completed (${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)

**Task Breakdown**:
- ✅ Completed: ${completedTasks}
- 🔄 In Progress: ${inProgressTasks}
- ⏳ Pending: ${pendingTasks}

**Requirements**: ${activeSpec.requirements ? 'Documented' : 'Not documented'}
**Design**: ${activeSpec.design ? 'Documented' : 'Not documented'}`;

		return new vscode.LanguageModelToolResult([
			new vscode.LanguageModelTextPart(status)
		]);
	}

	private async getRequirements(): Promise<vscode.LanguageModelToolResult> {
		const activeSpec = await this.projectSpecService.getActiveProjectSpec();
		if (!activeSpec) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart('No active project specification found.')
			]);
		}

		if (!activeSpec.requirements || activeSpec.requirements.trim() === '') {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Project "${activeSpec.name}" has no requirements documented yet.`)
			]);
		}

		const requirements = `## Requirements for ${activeSpec.name}

${activeSpec.requirements}`;

		return new vscode.LanguageModelToolResult([
			new vscode.LanguageModelTextPart(requirements)
		]);
	}

	private async getDesign(): Promise<vscode.LanguageModelToolResult> {
		const activeSpec = await this.projectSpecService.getActiveProjectSpec();
		if (!activeSpec) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart('No active project specification found.')
			]);
		}

		if (!activeSpec.design || activeSpec.design.trim() === '') {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Project "${activeSpec.name}" has no design documentation yet.`)
			]);
		}

		const design = `## Design Documentation for ${activeSpec.name}

${activeSpec.design}`;

		return new vscode.LanguageModelToolResult([
			new vscode.LanguageModelTextPart(design)
		]);
	}

	private async getTasks(): Promise<vscode.LanguageModelToolResult> {
		const activeSpec = await this.projectSpecService.getActiveProjectSpec();
		if (!activeSpec) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart('No active project specification found.')
			]);
		}

		if (activeSpec.tasks.length === 0) {
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(`Project "${activeSpec.name}" has no tasks defined yet.`)
			]);
		}

		const tasksByStatus = {
			todo: activeSpec.tasks.filter((t: TaskItem) => t.status === 'todo'),
			'in-progress': activeSpec.tasks.filter((t: TaskItem) => t.status === 'in-progress'),
			done: activeSpec.tasks.filter((t: TaskItem) => t.status === 'done'),
			blocked: activeSpec.tasks.filter((t: TaskItem) => t.status === 'blocked')
		};

		let tasksOutput = `## Task List for ${activeSpec.name}\n\n`;

		for (const [status, tasks] of Object.entries(tasksByStatus)) {
			if (tasks.length > 0) {
				const statusIcon = status === 'done' ? '✅' : status === 'in-progress' ? '🔄' : status === 'blocked' ? '🚫' : '⏳';
				tasksOutput += `### ${statusIcon} ${status.charAt(0).toUpperCase() + status.slice(1)} (${tasks.length})\n\n`;

				tasks.forEach((task: TaskItem, index: number) => {
					const priority = task.priority ? ` (${task.priority} priority)` : '';
					tasksOutput += `${index + 1}. **${task.title}**${priority}\n`;
					if (task.description) {
						tasksOutput += `   ${task.description}\n`;
					}
					tasksOutput += '\n';
				});
			}
		}

		return new vscode.LanguageModelToolResult([
			new vscode.LanguageModelTextPart(tasksOutput)
		]);
	}
}

ToolRegistry.registerTool(ProjectSpecTool);
