/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as l10n from '@vscode/l10n';
import * as vscode from 'vscode';
import { ILogService } from '../../../platform/log/common/logService';
import { ITasksService } from '../../../platform/tasks/common/tasksService';
import { IWorkspaceService } from '../../../platform/workspace/common/workspaceService';
import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { URI } from '../../../util/vs/base/common/uri';

export class StartTaskChatContribution extends Disposable {
	constructor(
		@ITasksService private readonly tasksService: ITasksService,
		@IWorkspaceService private readonly workspaceService: IWorkspaceService,
		@ILogService private readonly logService: ILogService,
	) {
		super();
		this.registerCommands();
	}

	private registerCommands(): void {
		// Register the slash command for start task
		this._register(vscode.commands.registerCommand('github.copilot.chat.startTask', async (query: string, stream: vscode.ChatResponseStream) => {
			try {
				// Show initial message
				stream.markdown(l10n.t('🔧 **Task Manager**\n\nLet me help you with workspace tasks.\n'));

				const workspaceFolders = this.getWorkspaceFoldersAsVSCode();
				if (!workspaceFolders || workspaceFolders.length === 0) {
					stream.markdown(l10n.t('❌ No workspace folder is open. Please open a workspace to manage tasks.'));
					return;
				}

				// Parse the query to understand what the user wants
				const lowerQuery = (query || '').toLowerCase().trim();

				if (lowerQuery.includes('list') || lowerQuery.includes('show') || !lowerQuery || lowerQuery === 'help') {
					await this.listTasks(stream, workspaceFolders);
				} else if (lowerQuery.includes('start') || lowerQuery.includes('run')) {
					await this.startTask(stream, workspaceFolders, query);
				} else if (lowerQuery.includes('stop') || lowerQuery.includes('kill')) {
					await this.stopTask(stream, workspaceFolders);
				} else {
					// General task search
					await this.searchTasks(stream, workspaceFolders, query);
				}

			} catch (error) {
				this.logService.logger.error('StartTaskChatContribution error:', error);
				stream.markdown(l10n.t('❌ An error occurred: {0}', error instanceof Error ? error.message : String(error)));
			}
		}));
	}

	private getWorkspaceFoldersAsVSCode(): vscode.WorkspaceFolder[] {
		// Convert our URI[] to vscode.WorkspaceFolder[]
		const folders = this.workspaceService.getWorkspaceFolders();
		return folders.map((uri, index) => ({
			uri: vscode.Uri.from(uri),
			name: uri.path.split('/').pop() || uri.toString(),
			index
		}));
	}

	private async listTasks(stream: vscode.ChatResponseStream, workspaceFolders: readonly vscode.WorkspaceFolder[]): Promise<void> {
		let totalTasks = 0;
		let runningTasks = 0;

		stream.markdown(l10n.t('## Available Tasks\n'));

		for (const workspaceFolder of workspaceFolders) {
			const tasks = this.tasksService.getTasks(URI.from(workspaceFolder.uri));
			const visibleTasks = tasks.filter(task => task.type && !task.hide);

			if (visibleTasks.length === 0) {
				continue;
			}

			totalTasks += visibleTasks.length;

			// Show workspace folder name if there are multiple
			if (workspaceFolders.length > 1) {
				stream.markdown(l10n.t('### {0}\n', workspaceFolder.name));
			}

			for (const task of visibleTasks) {
				const isRunning = this.tasksService.isTaskActive(task);
				if (isRunning) {
					runningTasks++;
				}

				const status = isRunning ? '🟢 Running' : '⚪ Ready';
				const taskName = task.label || task.type || 'Unnamed Task';
				const taskDescription = task.command ? ` - \`${task.command}\`` : '';

				stream.markdown(l10n.t('- **{0}** {1}{2}\n', taskName, status, taskDescription));

				// Add start button for non-running tasks
				if (!isRunning) {
					stream.button({
						title: l10n.t('▶️ Start "{0}"', taskName),
						command: 'github.copilot.startTask',
						arguments: [task, URI.from(workspaceFolder.uri)]
					});
				} else {
					stream.button({
						title: l10n.t('⏹️ Stop "{0}"', taskName),
						command: 'vscode.tasks.terminate',
						arguments: [task]
					});
				}
			}
		}

		if (totalTasks === 0) {
			stream.markdown(l10n.t('No tasks found in the workspace. You can create tasks in `.vscode/tasks.json`.'));
		} else {
			stream.markdown(l10n.t('\n📊 **Summary:** {0} total tasks, {1} running\n', totalTasks, runningTasks));
		}

		// Add quick action buttons
		stream.button({
			title: l10n.t('🎯 Quick Start Task'),
			command: 'github.copilot.startTask.quickPick'
		});
	}

	private async startTask(stream: vscode.ChatResponseStream, workspaceFolders: readonly vscode.WorkspaceFolder[], query: string): Promise<void> {
		// Extract task name from query
		const taskNameMatch = query.match(/(?:start|run)\s+(.+)/i);
		const taskName = taskNameMatch?.[1]?.trim();

		if (!taskName) {
			stream.markdown(l10n.t('Please specify a task name. For example: "start build" or "run test"'));
			stream.button({
				title: l10n.t('🎯 Show All Tasks'),
				command: 'github.copilot.startTask.quickPick'
			});
			return;
		}

		// Find matching tasks
		const matchingTasks = [];
		for (const workspaceFolder of workspaceFolders) {
			const tasks = this.tasksService.getTasks(URI.from(workspaceFolder.uri));
			for (const task of tasks) {
				if (task.type && !task.hide) {
					const taskLabel = (task.label || task.type || '').toLowerCase();
					if (taskLabel.includes(taskName.toLowerCase())) {
						matchingTasks.push({ task, workspaceFolder: URI.from(workspaceFolder.uri) });
					}
				}
			}
		}

		if (matchingTasks.length === 0) {
			stream.markdown(l10n.t('❌ No tasks found matching "{0}".', taskName));
			stream.button({
				title: l10n.t('🎯 Show All Tasks'),
				command: 'github.copilot.startTask.quickPick'
			});
			return;
		}

		if (matchingTasks.length === 1) {
			const { task, workspaceFolder } = matchingTasks[0];
			const taskDisplayName = task.label || task.type || 'Unnamed Task';

			stream.markdown(l10n.t('🚀 Starting task "{0}"...', taskDisplayName));

			stream.button({
				title: l10n.t('▶️ Start "{0}"', taskDisplayName),
				command: 'github.copilot.startTask',
				arguments: [task, workspaceFolder]
			});

			return;
		}

		// Multiple matches - show options
		stream.markdown(l10n.t('🔍 Found {0} tasks matching "{1}":\n', matchingTasks.length, taskName));

		for (const { task, workspaceFolder } of matchingTasks) {
			const taskDisplayName = task.label || task.type || 'Unnamed Task';
			const isRunning = this.tasksService.isTaskActive(task);
			const status = isRunning ? '🟢 Running' : '⚪ Ready';

			stream.markdown(l10n.t('- **{0}** {1}\n', taskDisplayName, status));

			if (!isRunning) {
				stream.button({
					title: l10n.t('▶️ Start "{0}"', taskDisplayName),
					command: 'github.copilot.startTask',
					arguments: [task, workspaceFolder]
				});
			}
		}
	}

	private async stopTask(stream: vscode.ChatResponseStream, workspaceFolders: readonly vscode.WorkspaceFolder[]): Promise<void> {
		// Find running tasks
		const runningTasks = [];
		for (const workspaceFolder of workspaceFolders) {
			const tasks = this.tasksService.getTasks(URI.from(workspaceFolder.uri));
			for (const task of tasks) {
				if (task.type && !task.hide && this.tasksService.isTaskActive(task)) {
					runningTasks.push({ task, workspaceFolder: URI.from(workspaceFolder.uri) });
				}
			}
		}

		if (runningTasks.length === 0) {
			stream.markdown(l10n.t('ℹ️ No tasks are currently running.'));
			return;
		}

		stream.markdown(l10n.t('🔴 **Running Tasks:**\n'));

		for (const { task } of runningTasks) {
			const taskDisplayName = task.label || task.type || 'Unnamed Task';
			stream.markdown(l10n.t('- **{0}** 🟢 Running\n', taskDisplayName));

			stream.button({
				title: l10n.t('⏹️ Stop "{0}"', taskDisplayName),
				command: 'vscode.tasks.terminate',
				arguments: [task]
			});
		}
	}

	private async searchTasks(stream: vscode.ChatResponseStream, workspaceFolders: readonly vscode.WorkspaceFolder[], query: string): Promise<void> {
		stream.markdown(l10n.t('🔍 Searching for tasks related to "{0}"...\n', query));

		const matchingTasks = [];
		for (const workspaceFolder of workspaceFolders) {
			const tasks = this.tasksService.getTasks(URI.from(workspaceFolder.uri));
			for (const task of tasks) {
				if (task.type && !task.hide) {
					const searchText = `${task.label || ''} ${task.type || ''} ${task.command || ''}`.toLowerCase();
					if (searchText.includes(query.toLowerCase())) {
						matchingTasks.push({ task, workspaceFolder: URI.from(workspaceFolder.uri) });
					}
				}
			}
		}

		if (matchingTasks.length === 0) {
			stream.markdown(l10n.t('❌ No tasks found matching "{0}".', query));
			stream.button({
				title: l10n.t('📋 Show All Tasks'),
				command: 'github.copilot.startTask.quickPick'
			});
			return;
		}

		stream.markdown(l10n.t('Found {0} matching tasks:\n', matchingTasks.length));

		for (const { task, workspaceFolder } of matchingTasks) {
			const taskDisplayName = task.label || task.type || 'Unnamed Task';
			const isRunning = this.tasksService.isTaskActive(task);
			const status = isRunning ? '🟢 Running' : '⚪ Ready';
			const taskDescription = task.command ? ` - \`${task.command}\`` : '';

			stream.markdown(l10n.t('- **{0}** {1}{2}\n', taskDisplayName, status, taskDescription));

			if (!isRunning) {
				stream.button({
					title: l10n.t('▶️ Start "{0}"', taskDisplayName),
					command: 'github.copilot.startTask',
					arguments: [task, workspaceFolder]
				});
			}
		}
	}
}
