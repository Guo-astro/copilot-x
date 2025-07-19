/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { IProjectSpecService, TaskItem } from '../common/projectSpecService';

export class ProjectSpecWebviewProvider extends Disposable implements vscode.WebviewViewProvider {
	public static readonly viewType = 'github.copilot.projectSpec';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly extensionUri: vscode.Uri,
		@IProjectSpecService private readonly projectSpecService: IProjectSpecService,
	) {
		super();
		this._register(this.projectSpecService.onDidChangeSpecs(() => {
			this.refresh();
		}));
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this.extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case 'createSpec':
					await this.projectSpecService.createProjectSpec(data.name, data.requirements, data.design);
					break;
				case 'updateSpec':
					await this.projectSpecService.updateProjectSpec(data.spec);
					break;
				case 'deleteSpec':
					await this.projectSpecService.deleteProjectSpec(data.id);
					break;
				case 'setActiveSpec':
					await this.projectSpecService.setActiveProjectSpec(data.id);
					break;
				case 'addTask':
					await this.projectSpecService.addTask(data.specId, data.task);
					break;
				case 'updateTask':
					await this.projectSpecService.updateTask(data.specId, data.task);
					break;
				case 'deleteTask':
					await this.projectSpecService.deleteTask(data.specId, data.taskId);
					break;
				case 'startTask':
					await this.startTask(data.task);
					break;
				case 'refresh':
					this.refresh();
					break;
			}
		});

		this.refresh();
	}

	private async refresh() {
		if (!this._view) {
			return;
		}

		const specs = await this.projectSpecService.getProjectSpecs();
		const activeSpec = await this.projectSpecService.getActiveProjectSpec();

		this._view.webview.postMessage({
			type: 'update',
			specs,
			activeSpec
		});
	}

	private async startTask(task: TaskItem) {
		if (task.taskDefinition) {
			// Start the VS Code task
			await vscode.commands.executeCommand('github.copilot.startTask', task.taskDefinition);
		} else {
			// If no task definition, show a message
			vscode.window.showInformationMessage(`Task "${task.title}" has no associated VS Code task definition.`);
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Use a simple React-like approach with vanilla JS
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Project Spec</title>
	<style>
		body {
			padding: 0;
			color: var(--vscode-foreground);
			font-size: var(--vscode-font-size);
			font-weight: var(--vscode-font-weight);
			font-family: var(--vscode-font-family);
			background-color: var(--vscode-editor-background);
		}

		.container {
			padding: 10px;
		}

		.tabs {
			display: flex;
			border-bottom: 1px solid var(--vscode-widget-border);
			margin-bottom: 10px;
		}

		.tab {
			padding: 8px 16px;
			cursor: pointer;
			border: none;
			background: none;
			color: var(--vscode-foreground);
			font-family: inherit;
		}

		.tab.active {
			border-bottom: 2px solid var(--vscode-focusBorder);
			color: var(--vscode-focusBorder);
		}

		.tab-content {
			display: none;
		}

		.tab-content.active {
			display: block;
		}

		.spec-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 15px;
		}

		.spec-selector {
			padding: 4px 8px;
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			color: var(--vscode-input-foreground);
			border-radius: 2px;
		}

		.btn {
			padding: 6px 12px;
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: 1px solid var(--vscode-button-border, var(--vscode-contrastBorder));
			border-radius: 2px;
			cursor: pointer;
			font-size: 12px;
		}

		.btn:hover {
			background: var(--vscode-button-hoverBackground);
		}

		.btn-secondary {
			background: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
			border: 1px solid var(--vscode-button-border, var(--vscode-contrastBorder));
		}

		.btn-secondary:hover {
			background: var(--vscode-button-secondaryHoverBackground);
		}

		textarea {
			width: 100%;
			min-height: 200px;
			padding: 8px;
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			color: var(--vscode-input-foreground);
			font-family: var(--vscode-editor-font-family);
			font-size: var(--vscode-editor-font-size);
			resize: vertical;
		}

		.task-list {
			list-style: none;
			padding: 0;
		}

		.task-item {
			display: flex;
			align-items: center;
			padding: 8px;
			margin-bottom: 4px;
			background: var(--vscode-list-activeSelectionBackground);
			border-radius: 3px;
		}

		.task-checkbox {
			margin-right: 8px;
		}

		.task-title {
			flex: 1;
			margin-right: 8px;
		}

		.task-status {
			padding: 2px 6px;
			border-radius: 2px;
			font-size: 11px;
			font-weight: bold;
		}

		.status-todo { background: var(--vscode-editorWarning-background); }
		.status-in-progress { background: var(--vscode-editorInfo-background); }
		.status-done { background: var(--vscode-editorGutter-addedBackground); }
		.status-blocked { background: var(--vscode-editorError-background); }

		.start-task-btn {
			margin-left: 8px;
			padding: 2px 6px;
			font-size: 11px;
		}

		.empty-state {
			text-align: center;
			padding: 40px;
			color: var(--vscode-descriptionForeground);
		}

		.input-group {
			margin-bottom: 10px;
		}

		.input-group label {
			display: block;
			margin-bottom: 4px;
			color: var(--vscode-foreground);
		}

		.input-group input {
			width: 100%;
			padding: 4px 8px;
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			color: var(--vscode-input-foreground);
			border-radius: 2px;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="spec-header">
			<select id="specSelector" class="spec-selector">
				<option value="">Select Project Spec...</option>
			</select>
			<div>
				<button id="newSpecBtn" class="btn">New Spec</button>
				<button id="refreshBtn" class="btn btn-secondary">Refresh</button>
			</div>
		</div>

		<div id="specContent">
			<div class="empty-state">
				<p>No project spec selected.</p>
				<p>Create a new project spec or select an existing one to get started.</p>
			</div>
		</div>

		<div id="specTabs" style="display: none;">
			<div class="tabs">
				<button class="tab active" data-tab="requirements">📋 Requirements</button>
				<button class="tab" data-tab="design">🎨 Design</button>
				<button class="tab" data-tab="tasks">✅ Task list</button>
			</div>

			<div id="requirements" class="tab-content active">
				<textarea id="requirementsText" placeholder="Enter project requirements here..."></textarea>
				<br><br>
				<button id="saveRequirements" class="btn">Save Requirements</button>
			</div>

			<div id="design" class="tab-content">
				<textarea id="designText" placeholder="Enter design specifications here..."></textarea>
				<br><br>
				<button id="saveDesign" class="btn">Save Design</button>
			</div>

			<div id="tasks" class="tab-content">
				<div style="margin-bottom: 15px;">
					<button id="addTaskBtn" class="btn">Add Task</button>
				</div>
				<ul id="taskList" class="task-list"></ul>
			</div>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		let currentSpecs = [];
		let activeSpec = null;

		// Tab switching
		document.querySelectorAll('.tab').forEach(tab => {
			tab.addEventListener('click', () => {
				const targetTab = tab.getAttribute('data-tab');

				// Update tab styles
				document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
				document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

				tab.classList.add('active');
				document.getElementById(targetTab).classList.add('active');
			});
		});

		// Spec selector
		document.getElementById('specSelector').addEventListener('change', (e) => {
			const specId = e.target.value;
			if (specId) {
				vscode.postMessage({ type: 'setActiveSpec', id: specId });
			}
		});

		// New spec button
		document.getElementById('newSpecBtn').addEventListener('click', () => {
			const name = prompt('Enter project spec name:');
			if (name) {
				vscode.postMessage({ type: 'createSpec', name, requirements: '', design: '' });
			}
		});

		// Refresh button
		document.getElementById('refreshBtn').addEventListener('click', () => {
			vscode.postMessage({ type: 'refresh' });
		});

		// Save buttons
		document.getElementById('saveRequirements').addEventListener('click', () => {
			if (activeSpec) {
				activeSpec.requirements = document.getElementById('requirementsText').value;
				vscode.postMessage({ type: 'updateSpec', spec: activeSpec });
			}
		});

		document.getElementById('saveDesign').addEventListener('click', () => {
			if (activeSpec) {
				activeSpec.design = document.getElementById('designText').value;
				vscode.postMessage({ type: 'updateSpec', spec: activeSpec });
			}
		});

		// Add task button
		document.getElementById('addTaskBtn').addEventListener('click', () => {
			const title = prompt('Enter task title:');
			if (title && activeSpec) {
				const task = {
					title,
					description: '',
					status: 'todo',
					priority: 'medium'
				};
				vscode.postMessage({ type: 'addTask', specId: activeSpec.id, task });
			}
		});

		// Handle messages from extension
		window.addEventListener('message', event => {
			const message = event.data;

			switch (message.type) {
				case 'update':
					currentSpecs = message.specs;
					activeSpec = message.activeSpec;
					updateUI();
					break;
			}
		});

		function updateUI() {
			// Update spec selector
			const selector = document.getElementById('specSelector');
			selector.innerHTML = '<option value="">Select Project Spec...</option>';
			currentSpecs.forEach(spec => {
				const option = document.createElement('option');
				option.value = spec.id;
				option.textContent = spec.name;
				if (activeSpec && spec.id === activeSpec.id) {
					option.selected = true;
				}
				selector.appendChild(option);
			});

			// Show/hide content
			if (activeSpec) {
				document.getElementById('specContent').style.display = 'none';
				document.getElementById('specTabs').style.display = 'block';

				// Update content
				document.getElementById('requirementsText').value = activeSpec.requirements || '';
				document.getElementById('designText').value = activeSpec.design || '';
				updateTaskList();
			} else {
				document.getElementById('specContent').style.display = 'block';
				document.getElementById('specTabs').style.display = 'none';
			}
		}

		function updateTaskList() {
			const taskList = document.getElementById('taskList');
			taskList.innerHTML = '';

			if (!activeSpec || !activeSpec.tasks) {
				return;
			}

			activeSpec.tasks.forEach(task => {
				const li = document.createElement('li');
				li.className = 'task-item';

				li.innerHTML = \`
					<input type="checkbox" class="task-checkbox" \${task.status === 'done' ? 'checked' : ''}
						   onchange="toggleTask('\${task.id}')">
					<span class="task-title">\${task.title}</span>
					<span class="task-status status-\${task.status}">\${task.status}</span>
					<button class="btn start-task-btn" onclick="startTask('\${task.id}')">Start</button>
				\`;

				taskList.appendChild(li);
			});
		}

		function toggleTask(taskId) {
			if (!activeSpec) return;

			const task = activeSpec.tasks.find(t => t.id === taskId);
			if (task) {
				task.status = task.status === 'done' ? 'todo' : 'done';
				vscode.postMessage({ type: 'updateTask', specId: activeSpec.id, task });
			}
		}

		function startTask(taskId) {
			if (!activeSpec) return;

			const task = activeSpec.tasks.find(t => t.id === taskId);
			if (task) {
				vscode.postMessage({ type: 'startTask', task });
			}
		}

		// Initial load
		vscode.postMessage({ type: 'refresh' });
	</script>
</body>
</html>`;
	}
}
