import * as vscode from 'vscode';
import { properties2Type } from './yapiInterface';

export function activate(context: vscode.ExtensionContext) {
	let rightClickDisposable = vscode.commands.registerTextEditorCommand('extension.processSelectedText', (textEditor, edit) => {
		const selectedText = textEditor.document.getText(textEditor.selection);
		// 将处理后的文本替换回原文档
		try {
			const selectObj = JSON.parse(selectedText);
			const {properties, items, type} = selectObj;
			const {typeMap={}, extTypeMap={}} = vscode.workspace.getConfiguration('yapiHelper');
			const result = `export interface TypeName {${properties2Type({
					properties: {
						object: properties,
						array: items?.properties,
					}[type as string],
					typeMap,
					extTypeMap,
				})}\n}`;
			edit.replace(textEditor.selection, result);
			// 获取当前可见区域的开始和结束位置
			const visibleRange = textEditor.visibleRanges[0];

			// 创建一个范围，这个范围只在 X 轴方向上滚动
			const rangeToReveal = new vscode.Range(
				new vscode.Position(visibleRange.start.line, 0), // 起始行不变，X 轴位置为 10
				new vscode.Position(visibleRange.end.line, 0),  // 结束行不变，X 轴位置为 20
			);

			// 调整滚动位置，只在 X 轴方向上滚动
			textEditor.revealRange(rangeToReveal, vscode.TextEditorRevealType.Default);
		} catch(err) {
			console.log(err);
		}
	});
	context.subscriptions.push(rightClickDisposable);
}
