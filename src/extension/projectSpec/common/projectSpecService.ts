/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type * as vscode from 'vscode';
import { createServiceIdentifier } from '../../../util/common/services';
import { URI } from '../../../util/vs/base/common/uri';

export interface ProjectSpec {
	id: string;
	name: string;
	description?: string;
	requirements: string;
	design: string;
	tasks: TaskItem[];
	created: Date;
	modified: Date;
}

export interface TaskItem {
	id: string;
	title: string;
	description?: string;
	status: TaskStatus;
	priority?: TaskPriority;
	assignee?: string;
	created: Date;
	modified: Date;
	taskDefinition?: vscode.TaskDefinition;
}

export enum TaskStatus {
	Todo = 'todo',
	InProgress = 'in-progress',
	Done = 'done',
	Blocked = 'blocked'
}

export enum TaskPriority {
	Low = 'low',
	Medium = 'medium',
	High = 'high',
	Critical = 'critical'
}

export interface IProjectSpecService {
	_serviceBrand: undefined;

	/**
	 * Get all project specs in the workspace
	 */
	getProjectSpecs(): Promise<ProjectSpec[]>;

	/**
	 * Get a specific project spec by ID
	 */
	getProjectSpec(id: string): Promise<ProjectSpec | undefined>;

	/**
	 * Create a new project spec
	 */
	createProjectSpec(name: string, requirements?: string, design?: string): Promise<ProjectSpec>;

	/**
	 * Update an existing project spec
	 */
	updateProjectSpec(spec: ProjectSpec): Promise<void>;

	/**
	 * Delete a project spec
	 */
	deleteProjectSpec(id: string): Promise<void>;

	/**
	 * Add a task to a project spec
	 */
	addTask(specId: string, task: Omit<TaskItem, 'id' | 'created' | 'modified'>): Promise<TaskItem>;

	/**
	 * Update a task
	 */
	updateTask(specId: string, task: TaskItem): Promise<void>;

	/**
	 * Delete a task
	 */
	deleteTask(specId: string, taskId: string): Promise<void>;

	/**
	 * Get the current active project spec
	 */
	getActiveProjectSpec(): Promise<ProjectSpec | undefined>;

	/**
	 * Set the active project spec
	 */
	setActiveProjectSpec(id: string): Promise<void>;

	/**
	 * Import project spec from markdown files (like your screenshot shows)
	 */
	importFromMarkdown(workspaceFolder: URI, filePath: string): Promise<ProjectSpec>;

	/**
	 * Export project spec to markdown files
	 */
	exportToMarkdown(spec: ProjectSpec, workspaceFolder: URI): Promise<void>;

	/**
	 * Event fired when specs change
	 */
	onDidChangeSpecs: vscode.Event<void>;
}

export const IProjectSpecService = createServiceIdentifier<IProjectSpecService>('IProjectSpecService');
