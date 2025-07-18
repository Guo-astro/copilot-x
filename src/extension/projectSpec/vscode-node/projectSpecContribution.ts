/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { IInstantiationService } from '../../../util/vs/platform/instantiation/common/instantiation';
import { ProjectSpecWebviewProvider } from './projectSpecWebviewProvider';

export class ProjectSpecContribution extends Disposable {

	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService,
	) {
		super();
		this.registerWebviewProvider();
		this.registerCommands();
	}

	private registerWebviewProvider(): void {
		// Register the webview provider
		const provider = this.instantiationService.createInstance(ProjectSpecWebviewProvider, vscode.extensions.getExtension('github.copilot-chat')?.extensionUri || vscode.Uri.file(''));
		this._register(
			vscode.window.registerWebviewViewProvider(ProjectSpecWebviewProvider.viewType, provider)
		);
	}

	private registerCommands(): void {
		// Register command to show project specification webview
		this._register(
			vscode.commands.registerCommand('github.copilot.projectSpec.show', () => {
				vscode.commands.executeCommand('workbench.view.explorer');
				vscode.commands.executeCommand('github.copilot.projectSpec.focus');
			})
		);
	}
}
