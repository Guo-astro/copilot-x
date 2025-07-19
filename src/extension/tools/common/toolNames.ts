/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { cloneAndChange } from '../../../util/vs/base/common/objects';

export const enum ToolName {
	ApplyPatch = 'apply_patch',
	Codebase = 'semantic_search',
	VSCodeAPI = 'get_vscode_api',
	TestFailure = 'test_failure',
	RunTests = 'run_tests',
	FindFiles = 'file_search',
	FindTextInFiles = 'grep_search',
	ReadFile = 'read_file',
	ListDirectory = 'list_dir',
	GetErrors = 'get_errors',
	RunInTerminal = 'run_in_terminal',
	GetTerminalOutput = 'get_terminal_output',
	GetScmChanges = 'get_changed_files',
	UpdateUserPreferences = 'update_user_preferences',
	ReadProjectStructure = 'read_project_structure',
	TerminalSelection = 'get_terminal_selection',
	TerminalLastCommand = 'get_terminal_last_command',
	CreateNewWorkspace = 'create_new_workspace',
	CreateNewJupyterNotebook = 'create_new_jupyter_notebook',
	SearchWorkspaceSymbols = 'search_workspace_symbols',
	Usages = 'list_code_usages',
	RunTask = 'run_vs_code_task',
	EditFile = 'insert_edit_into_file',
	CreateFile = 'create_file',
	ReplaceString = 'replace_string_in_file',
	EditNotebook = 'edit_notebook_file',
	RunNotebookCell = 'run_notebook_cell',
	GetNotebookSummary = 'copilotx_getNotebookSummary',
	ReadCellOutput = 'read_notebook_cell_output',
	InstallExtension = 'install_extension',
	Think = 'think',
	FetchWebPage = 'fetch_webpage',
	FindTestFiles = 'test_search',
	GetProjectSetupInfo = 'get_project_setup_info',
	SearchViewResults = 'get_search_view_results',
	DocInfo = 'get_doc_info',
	GithubRepo = 'github_repo',
	CreateAndRunTask = 'create_and_run_task',
	SimpleBrowser = 'open_simple_browser',
	CreateDirectory = 'create_directory',
	RunVscodeCmd = 'run_vscode_command',
	ProjectSpec = 'project_spec',
}

// When updating this, also update contributedToolNameToToolNames
export const enum ContributedToolName {
	ApplyPatch = 'copilotx_applyPatch',
	Codebase = 'copilotx_searchCodebase',
	SearchWorkspaceSymbols = 'copilotx_searchWorkspaceSymbols',
	Usages = 'copilotx_listCodeUsages',
	UpdateUserPreferences = 'copilotx_updateUserPreferences',
	VSCodeAPI = 'copilotx_getVSCodeAPI',
	TestFailure = 'copilotx_testFailure',
	RunTests = 'copilotx_runTests',
	FindFiles = 'copilotx_findFiles',
	FindTextInFiles = 'copilotx_findTextInFiles',
	ReadFile = 'copilotx_readFile',
	ListDirectory = 'copilotx_listDirectory',
	GetErrors = 'copilotx_getErrors',
	DocInfo = 'copilotx_getDocInfo',
	RunInTerminal = 'copilotx_runInTerminal',
	GetTerminalOutput = 'copilotx_getTerminalOutput',
	GetScmChanges = 'copilotx_getChangedFiles',
	ReadProjectStructure = 'copilotx_readProjectStructure',
	TerminalSelection = 'copilotx_getTerminalSelection',
	TerminalLastCommand = 'copilotx_getTerminalLastCommand',
	CreateNewWorkspace = 'copilotx_createNewWorkspace',
	CreateNewJupyterNotebook = 'copilotx_createNewJupyterNotebook',
	RunTask = 'copilotx_runVsCodeTask',
	EditFile = 'copilotx_insertEdit',
	CreateFile = 'copilotx_createFile',
	ReplaceString = 'copilotx_replaceString',
	EditNotebook = 'copilotx_editNotebook',
	RunNotebookCell = 'copilotx_runNotebookCell',
	GetNotebookSummary = 'copilotx_getNotebookSummary',
	ReadCellOutput = 'copilotx_readNotebookCellOutput',
	InstallExtension = 'copilotx_installExtension',
	Think = 'copilotx_think',
	FetchWebPage = 'copilotx_fetchWebPage',
	FindTestFiles = 'copilotx_findTestFiles',
	GetProjectSetupInfo = 'copilotx_getProjectSetupInfo',
	SearchViewResults = 'copilotx_getSearchResults',
	GithubRepo = 'copilotx_githubRepo',
	CreateAndRunTask = 'copilotx_createAndRunTask',
	SimpleBrowser = 'copilotx_openSimpleBrowser',
	CreateDirectory = 'copilotx_createDirectory',
	RunVscodeCmd = 'copilotx_runVscodeCommand',
	ProjectSpec = 'copilotx_projectSpec',
}

const contributedToolNameToToolNames = new Map<ContributedToolName, ToolName>([
	[ContributedToolName.ApplyPatch, ToolName.ApplyPatch],
	[ContributedToolName.Codebase, ToolName.Codebase],
	[ContributedToolName.SearchWorkspaceSymbols, ToolName.SearchWorkspaceSymbols],
	[ContributedToolName.Usages, ToolName.Usages],
	[ContributedToolName.VSCodeAPI, ToolName.VSCodeAPI],
	[ContributedToolName.TestFailure, ToolName.TestFailure],
	[ContributedToolName.RunTests, ToolName.RunTests],
	[ContributedToolName.FindFiles, ToolName.FindFiles],
	[ContributedToolName.FindTextInFiles, ToolName.FindTextInFiles],
	[ContributedToolName.ReadFile, ToolName.ReadFile],
	[ContributedToolName.ListDirectory, ToolName.ListDirectory],
	[ContributedToolName.GetErrors, ToolName.GetErrors],
	[ContributedToolName.DocInfo, ToolName.DocInfo],
	[ContributedToolName.RunInTerminal, ToolName.RunInTerminal],
	[ContributedToolName.GetTerminalOutput, ToolName.GetTerminalOutput],
	[ContributedToolName.GetScmChanges, ToolName.GetScmChanges],
	[ContributedToolName.ReadProjectStructure, ToolName.ReadProjectStructure],
	[ContributedToolName.EditFile, ToolName.EditFile],
	[ContributedToolName.UpdateUserPreferences, ToolName.UpdateUserPreferences],
	[ContributedToolName.TerminalSelection, ToolName.TerminalSelection],
	[ContributedToolName.TerminalLastCommand, ToolName.TerminalLastCommand],
	[ContributedToolName.CreateNewWorkspace, ToolName.CreateNewWorkspace],
	[ContributedToolName.CreateNewJupyterNotebook, ToolName.CreateNewJupyterNotebook],
	[ContributedToolName.RunTask, ToolName.RunTask],
	[ContributedToolName.InstallExtension, ToolName.InstallExtension],
	[ContributedToolName.Think, ToolName.Think],
	[ContributedToolName.FetchWebPage, ToolName.FetchWebPage],
	[ContributedToolName.FindTestFiles, ToolName.FindTestFiles],
	[ContributedToolName.CreateFile, ToolName.CreateFile],
	[ContributedToolName.ReplaceString, ToolName.ReplaceString],
	[ContributedToolName.EditNotebook, ToolName.EditNotebook],
	[ContributedToolName.RunNotebookCell, ToolName.RunNotebookCell],
	[ContributedToolName.GetNotebookSummary, ToolName.GetNotebookSummary],
	[ContributedToolName.ReadCellOutput, ToolName.ReadCellOutput],
	[ContributedToolName.GetProjectSetupInfo, ToolName.GetProjectSetupInfo],
	[ContributedToolName.SearchViewResults, ToolName.SearchViewResults],
	[ContributedToolName.GithubRepo, ToolName.GithubRepo],
	[ContributedToolName.CreateAndRunTask, ToolName.CreateAndRunTask],
	[ContributedToolName.SimpleBrowser, ToolName.SimpleBrowser],
	[ContributedToolName.CreateDirectory, ToolName.CreateDirectory],
	[ContributedToolName.RunVscodeCmd, ToolName.RunVscodeCmd],
	[ContributedToolName.ProjectSpec, ToolName.ProjectSpec],
]);

const toolNameToContributedToolNames = new Map<ToolName, ContributedToolName>();
for (const [contributedName, name] of contributedToolNameToToolNames) {
	toolNameToContributedToolNames.set(name, contributedName);
}

export function getContributedToolName(name: string | ToolName): string | ContributedToolName {
	return toolNameToContributedToolNames.get(name as ToolName) ?? name;
}

export function getToolName(name: string | ContributedToolName): string | ToolName {
	return contributedToolNameToToolNames.get(name as ContributedToolName) ?? name;
}

export function mapContributedToolNamesInString(str: string): string {
	contributedToolNameToToolNames.forEach((value, key) => {
		const re = new RegExp(`\\b${key}\\b`, 'g');
		str = str.replace(re, value);
	});
	return str;
}

export function mapContributedToolNamesInSchema(inputSchema: object): object {
	return cloneAndChange(inputSchema, value => typeof value === 'string' ? mapContributedToolNamesInString(value) : undefined);
}

/**
 * Tools that can mutate code in the working set and that should be run prior
 * to forming an additional request with the model, to avoid that request
 * having outdated contents.
 */
export const prerunTools: ReadonlySet<ToolName> = new Set([
	ToolName.EditFile
]);
