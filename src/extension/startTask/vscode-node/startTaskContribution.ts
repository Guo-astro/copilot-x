/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as l10n from '@vscode/l10n';
import * as vscode from 'vscode';
import { ILogService } from '../../../platform/log/common/logService';
import { ITasksService, TaskStatus } from '../../../platform/tasks/common/tasksService';
import { ITelemetryService } from '../../../platform/telemetry/common/telemetry';
import { IWorkspaceService } from '../../../platform/workspace/common/workspaceService';
import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { URI } from '../../../util/vs/base/common/uri';

interface TaskQuickPickItem extends vscode.QuickPickItem {
	task: vscode.TaskDefinition;
	workspaceFolder: URI;
}

export class StartTaskContribution extends Disposable {
	constructor(
		@ITasksService private readonly tasksService: ITasksService,
		@IWorkspaceService private readonly workspaceService: IWorkspaceService,
		@ILogService private readonly logService: ILogService,
		@ITelemetryService private readonly telemetryService: ITelemetryService,
	) {
		super();
		this.registerCommands();
	}

	private registerCommands(): void {
		this._register(vscode.commands.registerCommand('github.copilot.startTask', async (task?: vscode.TaskDefinition, workspaceFolder?: URI) => {
			if (task && workspaceFolder) {
				// Direct task execution
				await this.executeTask(task, workspaceFolder);
			} else {
				// Show quick pick
				await vscode.commands.executeCommand('github.copilot.startTask.quickPick');
			}
		}));

		this._register(vscode.commands.registerCommand('github.copilot.startTask.quickPick', async () => {
			await this.showTaskQuickPick();
		}));
	}

	private async showTaskQuickPick(): Promise<void> {
		try {
			const workspaceFolders = this.workspaceService.getWorkspaceFolders();
			if (!workspaceFolders || workspaceFolders.length === 0) {
				vscode.window.showErrorMessage(l10n.t('No workspace folder is open.'));
				return;
			}

			// Collect all tasks from all workspace folders
			const taskItems: TaskQuickPickItem[] = [];
			for (const workspaceFolder of workspaceFolders) {
				const tasks = this.tasksService.getTasks(workspaceFolder);
				for (const task of tasks) {
					if (task.type && !task.hide) {
						const isRunning = this.tasksService.isTaskActive(task);
						const workspaceName = workspaceFolders.length > 1 ? ` (${workspaceFolder.scheme === 'file' ? workspaceFolder.fsPath.split('/').pop() : workspaceFolder.toString()})` : '';

						taskItems.push({
							label: `$(${isRunning ? 'loading~spin' : 'play'}) ${task.label || task.type}${workspaceName}`,
							description: task.command ? `${task.type}: ${task.command}` : task.type,
							detail: isRunning ? l10n.t('Currently running') : task.command,
							task,
							workspaceFolder: workspaceFolder,
							buttons: isRunning ? [
								{
									iconPath: new vscode.ThemeIcon('stop'),
									tooltip: l10n.t('Stop Task')
								}
							] : undefined
						});
					}
				}
			}

			if (taskItems.length === 0) {
				vscode.window.showInformationMessage(l10n.t('No tasks found in the workspace.'));
				return;
			}

			// Sort tasks: running tasks first, then by label
			taskItems.sort((a, b) => {
				const aRunning = this.tasksService.isTaskActive(a.task);
				const bRunning = this.tasksService.isTaskActive(b.task);

				if (aRunning && !bRunning) {
					return -1;
				}
				if (!aRunning && bRunning) {
					return 1;
				}

				return (a.task.label || a.task.type || '').localeCompare(b.task.label || b.task.type || '');
			});

			const quickPick = vscode.window.createQuickPick<TaskQuickPickItem>();
			quickPick.title = l10n.t('Start Task');
			quickPick.placeholder = l10n.t('Select a task to start');
			quickPick.items = taskItems;
			quickPick.matchOnDescription = true;
			quickPick.matchOnDetail = true;

			quickPick.onDidAccept(async () => {
				const selectedItem = quickPick.selectedItems[0];
				if (selectedItem) {
					quickPick.hide();
					await this.executeTask(selectedItem.task, selectedItem.workspaceFolder);
				}
			});

			quickPick.onDidTriggerItemButton(async (e) => {
				// Handle stop button click
				if (e.button.tooltip === l10n.t('Stop Task')) {
					await this.stopTask(e.item.task);
					// Refresh the quick pick
					await vscode.commands.executeCommand('github.copilot.startTask.quickPick');
				}
			});

			quickPick.onDidHide(() => quickPick.dispose());
			quickPick.show();

		} catch (error) {
			this.logService.logger.error('Error showing task quick pick:', error);
			vscode.window.showErrorMessage(l10n.t('Failed to show tasks: {0}', error instanceof Error ? error.message : String(error)));
		}
	}

	private async executeTask(task: vscode.TaskDefinition, workspaceFolder: URI): Promise<void> {
		try {
			this.logService.logger.info(`Starting task: ${task.label || task.type}`);

			// Check if task is already running
			if (this.tasksService.isTaskActive(task)) {
				const result = await vscode.window.showInformationMessage(
					l10n.t('Task "{0}" is already running.', task.label || task.type),
					l10n.t('Stop and Restart'),
					l10n.t('Cancel')
				);

				if (result === l10n.t('Stop and Restart')) {
					await this.stopTask(task);
					// Wait a bit for the task to stop
					await new Promise(resolve => setTimeout(resolve, 1000));
				} else {
					return;
				}
			}

			// Show progress notification
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: l10n.t('Starting task "{0}"...', task.label || task.type),
				cancellable: true
			}, async (progress, token) => {
				try {
					const result = await this.tasksService.executeTask(task, token, workspaceFolder);

					switch (result.status) {
						case TaskStatus.Started:
							vscode.window.showInformationMessage(
								l10n.t('Task "{0}" started successfully.', task.label || task.type)
							);
							break;
						case TaskStatus.Finished:
							vscode.window.showInformationMessage(
								l10n.t('Task "{0}" completed successfully.', task.label || task.type)
							);
							break;
						case TaskStatus.Error:
							vscode.window.showErrorMessage(
								l10n.t('Task "{0}" failed: {1}', task.label || task.type, result.error?.message || 'Unknown error')
							);
							break;
					}

					// Send telemetry
					this.telemetryService.sendMSFTTelemetryEvent('startTask.executed', {
						taskType: task.type || 'unknown',
						status: result.status,
						hasLabel: task.label ? 'true' : 'false',
						hasCommand: task.command ? 'true' : 'false'
					});

				} catch (error) {
					this.logService.logger.error('Task execution failed:', error);
					vscode.window.showErrorMessage(
						l10n.t('Failed to start task "{0}": {1}', task.label || task.type, error instanceof Error ? error.message : String(error))
					);
				}
			});

		} catch (error) {
			this.logService.logger.error('Error executing task:', error);
			vscode.window.showErrorMessage(l10n.t('Failed to start task: {0}', error instanceof Error ? error.message : String(error)));
		}
	}

	private async stopTask(task: vscode.TaskDefinition): Promise<void> {
		try {
			// Find running execution for this task
			const runningTasks = vscode.tasks.taskExecutions;
			const execution = runningTasks.find(exec =>
				exec.task.definition.type === task.type &&
				exec.task.definition.label === task.label
			);

			if (execution) {
				execution.terminate();
				vscode.window.showInformationMessage(
					l10n.t('Task "{0}" stopped.', task.label || task.type)
				);
			} else {
				vscode.window.showWarningMessage(
					l10n.t('Could not find running task "{0}" to stop.', task.label || task.type)
				);
			}
		} catch (error) {
			this.logService.logger.error('Error stopping task:', error);
			vscode.window.showErrorMessage(l10n.t('Failed to stop task: {0}', error instanceof Error ? error.message : String(error)));
		}
	}
}
