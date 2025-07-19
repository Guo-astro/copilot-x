/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface TestTableRow {
	testId: string;
	category: string;
	description: string;
	actors: string;
	setup: string;
	expected: string;
	validation: string;
	requirement: string;
	implPriority: string;
	implStatus: string;
	rowIndex: number;
}

export interface TestTable {
	headerRow: number;
	separatorRow: number;
	rows: TestTableRow[];
	fileUri: string;
	startLine: number;
	endLine: number;
}

export class TestTableDetector {

	private static readonly TEST_TABLE_HEADER_PATTERN = /^\|\s*Test\s+ID\s*\|\s*Category\s*\|\s*Description\s*\|\s*Actor\(s\)\s*\|\s*Setup\s*\|\s*Expected\s*\|\s*Validation\s*\|\s*Requirement\s*\|\s*Impl\s+Priority\s*\|\s*Impl\s+Status\s*\|$/i;
	private static readonly TABLE_SEPARATOR_PATTERN = /^\|\s*[-:]+\s*\|\s*[-:]+\s*\|\s*[-:]+\s*\|\s*[-:]+\s*\|\s*[-:]+\s*\|\s*[-:]+\s*\|\s*[-:]+\s*\|\s*[-:]+\s*\|\s*[-:]+\s*\|\s*[-:]+\s*\|$/;
	private static readonly TABLE_ROW_PATTERN = /^\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|$/;

	/**
	 * Detects test tables in markdown content
	 */
	public static detectTestTables(content: string, fileUri: string): TestTable[] {
		const lines = content.split('\n');
		const tables: TestTable[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();

			// Check if this line matches the test table header
			if (this.TEST_TABLE_HEADER_PATTERN.test(line)) {
				const table = this.parseTestTable(lines, i, fileUri);
				if (table) {
					tables.push(table);
				}
			}
		}

		return tables;
	}

	private static parseTestTable(lines: string[], headerIndex: number, fileUri: string): TestTable | null {
		// Check if next line is separator
		if (headerIndex + 1 >= lines.length) {
			return null;
		}

		const separatorLine = lines[headerIndex + 1].trim();
		if (!this.TABLE_SEPARATOR_PATTERN.test(separatorLine)) {
			return null;
		}

		const rows: TestTableRow[] = [];
		let currentRowIndex = headerIndex + 2;

		// Parse data rows
		while (currentRowIndex < lines.length) {
			const line = lines[currentRowIndex].trim();

			// Empty line or non-table line breaks the table
			if (!line || !line.startsWith('|')) {
				break;
			}

			const match = this.TABLE_ROW_PATTERN.exec(line);
			if (!match) {
				break;
			}

			const [, testId, category, description, actors, setup, expected, validation, requirement, implPriority, implStatus] = match;

			rows.push({
				testId: testId.trim(),
				category: category.trim(),
				description: description.trim(),
				actors: actors.trim(),
				setup: setup.trim(),
				expected: expected.trim(),
				validation: validation.trim(),
				requirement: requirement.trim(),
				implPriority: implPriority.trim(),
				implStatus: implStatus.trim(),
				rowIndex: currentRowIndex
			});

			currentRowIndex++;
		}

		return {
			headerRow: headerIndex,
			separatorRow: headerIndex + 1,
			rows,
			fileUri,
			startLine: headerIndex,
			endLine: currentRowIndex - 1
		};
	}

	/**
	 * Checks if a specific line position is within a test table
	 */
	public static isInTestTable(content: string, lineNumber: number, fileUri: string): TestTable | null {
		const tables = this.detectTestTables(content, fileUri);

		for (const table of tables) {
			if (lineNumber >= table.startLine && lineNumber <= table.endLine) {
				return table;
			}
		}

		return null;
	}

	/**
	 * Gets the test row at a specific line number
	 */
	public static getTestRowAtLine(content: string, lineNumber: number, fileUri: string): TestTableRow | null {
		const table = this.isInTestTable(content, lineNumber, fileUri);
		if (!table) {
			return null;
		}

		for (const row of table.rows) {
			if (row.rowIndex === lineNumber) {
				return row;
			}
		}

		return null;
	}
}
