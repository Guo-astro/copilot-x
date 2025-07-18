/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { IProjectSpecService } from '../common/projectSpecService';

export class ProjectSpecChatContribution extends Disposable {

	constructor(
		@IProjectSpecService private readonly projectSpecService: IProjectSpecService,
	) {
		super();
		this.registerChatCommands();
	}

	private registerChatCommands(): void {
		// Register slash commands for project spec management
		this._register(vscode.commands.registerCommand('github.copilot.chat.projectSpec.create', async (name: string, stream: vscode.ChatResponseStream) => {
			try {
				const spec = await this.projectSpecService.createProjectSpec(name);
				stream.markdown(`Created new project spec: **${spec.name}**`);

				stream.button({
					title: '📋 Open Project Spec View',
					command: 'workbench.view.extension.github.copilot.projectSpec'
				});
			} catch (error) {
				stream.markdown(`❌ Failed to create project spec: ${error instanceof Error ? error.message : String(error)}`);
			}
		}));

		this._register(vscode.commands.registerCommand('github.copilot.chat.projectSpec.list', async (stream: vscode.ChatResponseStream) => {
			try {
				const specs = await this.projectSpecService.getProjectSpecs();
				const activeSpec = await this.projectSpecService.getActiveProjectSpec();

				if (specs.length === 0) {
					stream.markdown('No project specs found. Create one using `/spec create <name>`');
					return;
				}

				stream.markdown('## Project Specifications\n');

				for (const spec of specs) {
					const isActive = activeSpec?.id === spec.id;
					const activeIndicator = isActive ? '🔹 **ACTIVE**' : '';

					stream.markdown(`### ${spec.name} ${activeIndicator}\n`);

					if (spec.description) {
						stream.markdown(`${spec.description}\n`);
					}

					const taskCount = spec.tasks.length;
					const completedTasks = spec.tasks.filter(t => t.status === 'done').length;

					stream.markdown(`📊 Tasks: ${completedTasks}/${taskCount} completed\n`);

					if (spec.tasks.length > 0) {
						stream.markdown('**Recent Tasks:**\n');
						const recentTasks = spec.tasks.slice(-3);
						for (const task of recentTasks) {
							const statusEmoji = this.getTaskStatusEmoji(task.status);
							stream.markdown(`- ${statusEmoji} ${task.title}\n`);
						}
					}

					stream.markdown('---\n');
				}

				stream.button({
					title: '📋 Open Project Spec View',
					command: 'workbench.view.extension.github.copilot.projectSpec'
				});
			} catch (error) {
				stream.markdown(`❌ Failed to list project specs: ${error instanceof Error ? error.message : String(error)}`);
			}
		}));

		this._register(vscode.commands.registerCommand('github.copilot.chat.projectSpec.activate', async (name: string, stream: vscode.ChatResponseStream) => {
			try {
				const specs = await this.projectSpecService.getProjectSpecs();
				const spec = specs.find(s => s.name.toLowerCase().includes(name.toLowerCase()));

				if (!spec) {
					stream.markdown(`❌ Project spec "${name}" not found.`);

					if (specs.length > 0) {
						stream.markdown('\nAvailable specs:\n');
						for (const s of specs) {
							stream.markdown(`- ${s.name}\n`);
						}
					}
					return;
				}

				await this.projectSpecService.setActiveProjectSpec(spec.id);
				stream.markdown(`✅ Activated project spec: **${spec.name}**`);

				// Show current status
				const taskCount = spec.tasks.length;
				const completedTasks = spec.tasks.filter(t => t.status === 'done').length;
				stream.markdown(`\n📊 Progress: ${completedTasks}/${taskCount} tasks completed`);

				stream.button({
					title: '📋 Open Project Spec View',
					command: 'workbench.view.extension.github.copilot.projectSpec'
				});
			} catch (error) {
				stream.markdown(`❌ Failed to activate project spec: ${error instanceof Error ? error.message : String(error)}`);
			}
		}));

		this._register(vscode.commands.registerCommand('github.copilot.chat.projectSpec.addTask', async (title: string, stream: vscode.ChatResponseStream) => {
			try {
				const activeSpec = await this.projectSpecService.getActiveProjectSpec();

				if (!activeSpec) {
					stream.markdown('❌ No active project spec. Activate one first using `/spec activate <name>`');
					return;
				}

				const task = await this.projectSpecService.addTask(activeSpec.id, {
					title,
					description: '',
					status: 'todo' as any,
					priority: 'medium' as any
				});

				stream.markdown(`✅ Added task to **${activeSpec.name}**: ${task.title}`);

				stream.button({
					title: '🎯 Start Task',
					command: 'github.copilot.startTask.quickPick'
				});

				stream.button({
					title: '📋 View All Tasks',
					command: 'workbench.view.extension.github.copilot.projectSpec'
				});
			} catch (error) {
				stream.markdown(`❌ Failed to add task: ${error instanceof Error ? error.message : String(error)}`);
			}
		}));

		this._register(vscode.commands.registerCommand('github.copilot.chat.projectSpec.status', async (stream: vscode.ChatResponseStream) => {
			try {
				const activeSpec = await this.projectSpecService.getActiveProjectSpec();

				if (!activeSpec) {
					stream.markdown('❌ No active project spec.');

					const specs = await this.projectSpecService.getProjectSpecs();
					if (specs.length > 0) {
						stream.markdown('\nAvailable specs:\n');
						for (const spec of specs) {
							stream.markdown(`- ${spec.name}\n`);
						}
					} else {
						stream.markdown('\nNo project specs found. Create one to get started.');
					}
					return;
				}

				stream.markdown(`## ${activeSpec.name}\n`);

				if (activeSpec.description) {
					stream.markdown(`${activeSpec.description}\n`);
				}

				// Progress overview
				const totalTasks = activeSpec.tasks.length;
				const completedTasks = activeSpec.tasks.filter(t => t.status === 'done').length;
				const inProgressTasks = activeSpec.tasks.filter(t => t.status === 'in-progress').length;
				const todoTasks = activeSpec.tasks.filter(t => t.status === 'todo').length;
				const blockedTasks = activeSpec.tasks.filter(t => t.status === 'blocked').length;

				stream.markdown(`### 📊 Progress Overview\n`);
				stream.markdown(`- **Total Tasks:** ${totalTasks}\n`);
				stream.markdown(`- **✅ Completed:** ${completedTasks}\n`);
				stream.markdown(`- **🔄 In Progress:** ${inProgressTasks}\n`);
				stream.markdown(`- **📝 Todo:** ${todoTasks}\n`);
				if (blockedTasks > 0) {
					stream.markdown(`- **🚫 Blocked:** ${blockedTasks}\n`);
				}

				// Show current tasks
				if (activeSpec.tasks.length > 0) {
					stream.markdown(`\n### 📋 Current Tasks\n`);
					for (const task of activeSpec.tasks) {
						const statusEmoji = this.getTaskStatusEmoji(task.status);
						stream.markdown(`${statusEmoji} **${task.title}**\n`);
					}
				}

				stream.button({
					title: '📋 Open Project Spec View',
					command: 'workbench.view.extension.github.copilot.projectSpec'
				});
			} catch (error) {
				stream.markdown(`❌ Failed to get project status: ${error instanceof Error ? error.message : String(error)}`);
			}
		}));
	}

	private getTaskStatusEmoji(status: string): string {
		switch (status) {
			case 'done': return '✅';
			case 'in-progress': return '🔄';
			case 'blocked': return '🚫';
			case 'todo':
			default: return '📝';
		}
	}
}
