/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IFileSystemService } from '../../../platform/filesystem/common/fileSystemService';
import { Emitter } from '../../../util/vs/base/common/event';
import { URI } from '../../../util/vs/base/common/uri';
import { generateUuid } from '../../../util/vs/base/common/uuid';
import { IProjectSpecService, ProjectSpec, TaskItem, TaskStatus } from '../common/projectSpecService';

export class ProjectSpecService implements IProjectSpecService {
	_serviceBrand: undefined;

	private readonly _onDidChangeSpecs = new Emitter<void>();
	readonly onDidChangeSpecs = this._onDidChangeSpecs.event;

	private _specs: Map<string, ProjectSpec> = new Map();
	private _activeSpecId: string | undefined;

	constructor(
		@IFileSystemService private readonly fileSystemService: IFileSystemService,
	) {
		this.loadSpecs();
	}

	async getProjectSpecs(): Promise<ProjectSpec[]> {
		return Array.from(this._specs.values());
	}

	async getProjectSpec(id: string): Promise<ProjectSpec | undefined> {
		return this._specs.get(id);
	}

	async createProjectSpec(name: string, requirements?: string, design?: string): Promise<ProjectSpec> {
		const spec: ProjectSpec = {
			id: generateUuid(),
			name,
			description: '',
			requirements: requirements || '',
			design: design || '',
			tasks: [],
			created: new Date(),
			modified: new Date()
		};

		this._specs.set(spec.id, spec);
		await this.saveSpecs();
		this._onDidChangeSpecs.fire();
		return spec;
	}

	async updateProjectSpec(spec: ProjectSpec): Promise<void> {
		spec.modified = new Date();
		this._specs.set(spec.id, spec);
		await this.saveSpecs();
		this._onDidChangeSpecs.fire();
	}

	async deleteProjectSpec(id: string): Promise<void> {
		this._specs.delete(id);
		if (this._activeSpecId === id) {
			this._activeSpecId = undefined;
		}
		await this.saveSpecs();
		this._onDidChangeSpecs.fire();
	}

	async addTask(specId: string, task: Omit<TaskItem, 'id' | 'created' | 'modified'>): Promise<TaskItem> {
		const spec = this._specs.get(specId);
		if (!spec) {
			throw new Error(`Project spec with id ${specId} not found`);
		}

		const newTask: TaskItem = {
			...task,
			id: generateUuid(),
			created: new Date(),
			modified: new Date()
		};

		spec.tasks.push(newTask);
		spec.modified = new Date();
		await this.saveSpecs();
		this._onDidChangeSpecs.fire();
		return newTask;
	}

	async updateTask(specId: string, task: TaskItem): Promise<void> {
		const spec = this._specs.get(specId);
		if (!spec) {
			throw new Error(`Project spec with id ${specId} not found`);
		}

		const taskIndex = spec.tasks.findIndex(t => t.id === task.id);
		if (taskIndex === -1) {
			throw new Error(`Task with id ${task.id} not found`);
		}

		task.modified = new Date();
		spec.tasks[taskIndex] = task;
		spec.modified = new Date();
		await this.saveSpecs();
		this._onDidChangeSpecs.fire();
	}

	async deleteTask(specId: string, taskId: string): Promise<void> {
		const spec = this._specs.get(specId);
		if (!spec) {
			throw new Error(`Project spec with id ${specId} not found`);
		}

		const taskIndex = spec.tasks.findIndex(t => t.id === taskId);
		if (taskIndex === -1) {
			throw new Error(`Task with id ${taskId} not found`);
		}

		spec.tasks.splice(taskIndex, 1);
		spec.modified = new Date();
		await this.saveSpecs();
		this._onDidChangeSpecs.fire();
	}

	async getActiveProjectSpec(): Promise<ProjectSpec | undefined> {
		if (!this._activeSpecId) {
			return undefined;
		}
		return this._specs.get(this._activeSpecId);
	}

	async setActiveProjectSpec(id: string): Promise<void> {
		if (!this._specs.has(id)) {
			throw new Error(`Project spec with id ${id} not found`);
		}
		this._activeSpecId = id;
		await this.saveSpecs();
		this._onDidChangeSpecs.fire();
	}

	async importFromMarkdown(workspaceFolder: URI, filePath: string): Promise<ProjectSpec> {
		const fileUri = URI.joinPath(workspaceFolder, filePath);
		const content = await this.fileSystemService.readFile(fileUri);
		const text = content.toString();

		// Parse markdown content to extract requirements, design, and tasks
		const spec = this.parseMarkdownToSpec(text, filePath);
		this._specs.set(spec.id, spec);
		await this.saveSpecs();
		this._onDidChangeSpecs.fire();
		return spec;
	}

	async exportToMarkdown(spec: ProjectSpec, workspaceFolder: URI): Promise<void> {
		const requirementsFile = URI.joinPath(workspaceFolder, 'requirements.md');
		const designFile = URI.joinPath(workspaceFolder, 'design.md');

		// Export requirements
		const requirementsContent = this.generateRequirementsMarkdown(spec);
		await this.fileSystemService.writeFile(requirementsFile, Buffer.from(requirementsContent));

		// Export design
		const designContent = this.generateDesignMarkdown(spec);
		await this.fileSystemService.writeFile(designFile, Buffer.from(designContent));
	}

	private parseMarkdownToSpec(content: string, fileName: string): ProjectSpec {
		// Basic markdown parsing - this could be enhanced
		const lines = content.split('\n');
		let requirements = '';
		let design = '';
		let currentSection = '';

		for (const line of lines) {
			if (line.startsWith('# Requirements')) {
				currentSection = 'requirements';
				continue;
			} else if (line.startsWith('# Design')) {
				currentSection = 'design';
				continue;
			}

			if (currentSection === 'requirements') {
				requirements += line + '\n';
			} else if (currentSection === 'design') {
				design += line + '\n';
			}
		}

		return {
			id: generateUuid(),
			name: fileName.replace('.md', ''),
			requirements: requirements.trim(),
			design: design.trim(),
			tasks: [],
			created: new Date(),
			modified: new Date()
		};
	}

	private generateRequirementsMarkdown(spec: ProjectSpec): string {
		return `# Requirements Document

## Introduction

${spec.requirements}

## Task List

${spec.tasks.map(task => `- [${task.status === TaskStatus.Done ? 'x' : ' '}] ${task.title}`).join('\n')}
`;
	}

	private generateDesignMarkdown(spec: ProjectSpec): string {
		return `# Design Document

${spec.design}
`;
	}

	private async loadSpecs(): Promise<void> {
		// In a real implementation, this would load from workspace storage
		// For now, we'll start with empty specs
		this._specs.clear();
	}

	private async saveSpecs(): Promise<void> {
		// In a real implementation, this would save to workspace storage
		// For now, this is a no-op
	}
}
