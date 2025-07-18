/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IInstantiationService } from '../../../util/vs/platform/instantiation/common/instantiation';
import { StartTaskChatContribution } from './startTaskChatParticipant';
import { StartTaskContribution } from './startTaskContribution';

export function createStartTaskContributions(instantiationService: IInstantiationService) {
	return [
		instantiationService.createInstance(StartTaskContribution),
		instantiationService.createInstance(StartTaskChatContribution),
	];
}
