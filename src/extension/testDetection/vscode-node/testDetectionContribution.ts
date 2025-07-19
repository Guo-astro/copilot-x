/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { TestTDDContribution } from './testTDDProvider';

export class TestDetectionContribution extends Disposable {

	constructor() {
		super();
		this.registerTestTDD();
	}

	private registerTestTDD(): void {
		this._register(new TestTDDContribution());
	}
}
