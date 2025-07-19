/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as l10n from '@vscode/l10n';
import * as vscode from 'vscode';
import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { TestTableDetector, type TestTableRow } from '../common/testTableDetector';

export class TestTDDProvider extends Disposable implements vscode.CodeLensProvider {

	private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
	public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

	constructor() {
		super();
	}

	public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
		// Only process markdown files
		if (document.languageId !== 'markdown') {
			return [];
		}

		const content = document.getText();
		const tables = TestTableDetector.detectTestTables(content, document.uri.toString());
		const codeLenses: vscode.CodeLens[] = [];

		for (const table of tables) {
			for (const row of table.rows) {
				// Skip empty or header-only rows
				if (!row.testId || !row.description) {
					continue;
				}

				const line = document.lineAt(row.rowIndex);
				const range = new vscode.Range(
					row.rowIndex,
					line.text.length - 1, // Position at end of line
					row.rowIndex,
					line.text.length
				);

				// Create "Start TDD" code lens
				const startTDDLens = new vscode.CodeLens(range, {
					title: `🚀 Start TDD: ${row.testId}`,
					command: 'github.copilot.testTDD.start',
					arguments: [row, document.uri]
				});

				codeLenses.push(startTDDLens);

				// If status is not "Done", add "Generate Test" lens
				if (row.implStatus.toLowerCase() !== 'done' && row.implStatus.toLowerCase() !== 'completed') {
					const generateTestLens = new vscode.CodeLens(range, {
						title: `📝 Generate Test`,
						command: 'github.copilot.testTDD.generateTest',
						arguments: [row, document.uri]
					});

					codeLenses.push(generateTestLens);
				}
			}
		}

		return codeLenses;
	}

	public refresh(): void {
		this._onDidChangeCodeLenses.fire();
	}
}

export class TestTDDContribution extends Disposable {

	constructor() {
		super();
		this.registerCodeLensProvider();
		this.registerCommands();
	}

	private registerCodeLensProvider(): void {
		const provider = new TestTDDProvider();

		this._register(
			vscode.languages.registerCodeLensProvider(
				{ language: 'markdown' },
				provider
			)
		);
	}

	private registerCommands(): void {
		// Start TDD workflow command
		this._register(
			vscode.commands.registerCommand(
				'github.copilot.testTDD.start',
				async (testRow: TestTableRow, documentUri: vscode.Uri) => {
					await this.startTDDWorkflow(testRow, documentUri);
				}
			)
		);

		// Generate test command
		this._register(
			vscode.commands.registerCommand(
				'github.copilot.testTDD.generateTest',
				async (testRow: TestTableRow, documentUri: vscode.Uri) => {
					await this.generateTest(testRow, documentUri);
				}
			)
		);

		// Manual trigger for test detection
		this._register(
			vscode.commands.registerCommand(
				'github.copilot.testTDD.detectTables',
				async () => {
					await this.detectAndShowTables();
				}
			)
		);
	}

	private async startTDDWorkflow(testRow: TestTableRow, documentUri: vscode.Uri): Promise<void> {
		// Build comprehensive context for TDD
		const context = this.buildTDDContext(testRow, documentUri);

		// Open Copilot Chat with TDD prompt
		const prompt = this.generateTDDPrompt(testRow, context);

		await vscode.commands.executeCommand(
			'workbench.action.chat.open',
			{
				query: prompt,
				isPartialQuery: false
			}
		);
	}

	private async generateTest(testRow: TestTableRow, documentUri: vscode.Uri): Promise<void> {
		// Build context for test generation
		const context = this.buildTDDContext(testRow, documentUri);

		// Generate test prompt
		const prompt = this.generateTestPrompt(testRow, context);

		await vscode.commands.executeCommand(
			'workbench.action.chat.open',
			{
				query: prompt,
				isPartialQuery: false
			}
		);
	}

	private buildTDDContext(testRow: TestTableRow, documentUri: vscode.Uri): string {
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
		const relativePath = workspaceFolder
			? vscode.workspace.asRelativePath(documentUri)
			: documentUri.fsPath;

		const context = [
			`**Test Specification Source**: ${relativePath}`,
			`**Test ID**: ${testRow.testId}`,
			`**Category**: ${testRow.category}`,
			`**Description**: ${testRow.description}`,
			`**Actor(s)**: ${testRow.actors}`,
			`**Setup Requirements**: ${testRow.setup}`,
			`**Expected Behavior**: ${testRow.expected}`,
			`**Validation Criteria**: ${testRow.validation}`,
			`**Related Requirement**: ${testRow.requirement}`,
			`**Implementation Priority**: ${testRow.implPriority}`,
			`**Current Status**: ${testRow.implStatus}`,
		].join('\n');

		return context;
	}

	private generateTDDPrompt(testRow: TestTableRow, context: string): string {
		return `I want to start Test-Driven Development (TDD) for the following test specification:

${context}

Please help me with a complete TDD workflow:

1. **Analyze the Specification**: Break down what needs to be tested
2. **Write Failing Tests**: Create comprehensive unit tests that capture all requirements
3. **Identify Implementation Steps**: What code needs to be written to make tests pass
4. **Suggest File Structure**: Where should tests and implementation go
5. **Generate Test Code**: Provide actual test code I can run

Focus on:
- Creating tests that validate the expected behavior
- Following testing best practices for this codebase
- Making tests specific to the validation criteria
- Considering the actor requirements and setup needs

Let's start with the failing tests first (Red phase of TDD).`;
	}

	private generateTestPrompt(testRow: TestTableRow, context: string): string {
		return `Generate unit tests for this specification:

${context}

Please create:
1. **Test File**: Complete test file with all necessary imports
2. **Test Cases**: Cover all aspects of the expected behavior
3. **Setup/Teardown**: Handle the setup requirements
4. **Assertions**: Validate according to the validation criteria
5. **Edge Cases**: Consider boundary conditions and error scenarios

Make sure the tests:
- Are specific to the described behavior
- Can be run in our current testing framework
- Follow our codebase conventions
- Include proper error handling for invalid scenarios`;
	}

	private async detectAndShowTables(): Promise<void> {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor || activeEditor.document.languageId !== 'markdown') {
			vscode.window.showInformationMessage(
				l10n.t('Please open a markdown file to detect test tables.')
			);
			return;
		}

		const content = activeEditor.document.getText();
		const tables = TestTableDetector.detectTestTables(
			content,
			activeEditor.document.uri.toString()
		);

		if (tables.length === 0) {
			vscode.window.showInformationMessage(
				l10n.t('No test tables found. Looking for tables with header: Test ID | Category | Description | Actor(s) | Setup | Expected | Validation | Requirement | Impl Priority | Impl Status')
			);
			return;
		}

		const totalTests = tables.reduce((sum, table) => sum + table.rows.length, 0);
		vscode.window.showInformationMessage(
			l10n.t('Found {0} test table(s) with {1} total test(s). Use the "Start TDD" code lenses to begin development.', tables.length, totalTests)
		);

		// Refresh code lenses to ensure they appear
		vscode.commands.executeCommand('codelens.action.refresh');
	}
}
