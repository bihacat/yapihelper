import * as vscode from 'vscode';
import axios from 'axios';
import { genYapiInterface, properties2Type } from './yapiInterface';

const makeCookie = (opt: {
	_hjSessionUser_2777326: string;
	ubt_ssid: string;
	_yapi_uid: string;
	_yapi_token: string;
}) => Object.entries(opt).map(([k, v]) => `${k}=${v}`).join(';');

const reqYapi = (id: string | number) => {
	const config = vscode.workspace.getConfiguration('yapihello');
	const _hjSessionUser_2777326 = config.get('_hjSessionUser_2777326') as string;
	const _yapi_token = config.get('_yapi_token') as string;
	const _yapi_uid = config.get('_yapi_uid') as string;
	const ubt_ssid = config.get('ubt_ssid') as string;

	return axios.get(`https://yapi.hellobike.cn/api/interface/get?id=${id}`, {
		headers: {
			Cookie: makeCookie({
				_hjSessionUser_2777326,
				_yapi_token,
				ubt_ssid,
				_yapi_uid,
			})
		}
	});
};

let resp = undefined;
let result = undefined;
let hoverLine = new vscode.Position(0, 0);

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.languages.registerHoverProvider('*', {
    async provideHover(document: vscode.TextDocument, position: vscode.Position) {
      const line = document.lineAt(position.line);
			hoverLine = new vscode.Position(line.lineNumber, line.text.length);

			const [, id] = line.text.match(/https:\/\/yapi.hellobike.cn\/project\/\d+\/interface\/api\/(\d+)/) || [];
      if (id) {
				try {
					resp = await reqYapi(id);
					const {typeMap={}, extTypeMap={}} = vscode.workspace.getConfiguration('yapihello');
					result = genYapiInterface({
						apiData: resp.data.data,
						typeMap,
						extTypeMap,
					});
					const hoverText = new vscode.MarkdownString('');
					hoverText.isTrusted = true;
					hoverText.appendMarkdown('[生成请求类型](command:yapihello.reqInterface)');
					hoverText.appendMarkdown('[ 生成响应类型](command:yapihello.respInterface)');
					hoverText.appendMarkdown(`\n\n请求类型`);
					hoverText.appendCodeblock(`${result.req.text}`);
					hoverText.appendMarkdown(`响应类型`);
					hoverText.appendCodeblock(`${result.resp.text}`);
					const wordRange = document.getWordRangeAtPosition(position);
					const {req: {ignoredType: reqignoredType}, resp: {ignoredType: respignoredType}} = result;
					if (reqignoredType.length > 0) {
						vscode.window.showWarningMessage(`由于请求类型未被收录，以下字段被忽略，请在设置中的yapihello.typemap补充类型映射：${reqignoredType.join(',')}`);
					}
					if (respignoredType.length > 0) {
						vscode.window.showWarningMessage(`由于响应类型未被收录，以下字段被忽略，请在设置中的yapihello.typemap补充类型映射：${respignoredType.join(',')}`);
					}
					return new vscode.Hover(hoverText, wordRange);
				} catch (error) {
					// vscode.window.showErrorMessage(`请在设置中正确当前插件配置的四个cookie字段,${error}`);
				}
      }

      return undefined;
    }
  });

  context.subscriptions.push(disposable);

  vscode.commands.registerCommand('yapihello.reqInterface', async (range) => {
    try {
      // 将内容填充到当前编辑器中
      const activeTextEditor = vscode.window.activeTextEditor;
      if (activeTextEditor) {
        activeTextEditor.edit((editBuilder) => {
					const insertText = `\
${result!.req.ignoredType.length ? `\n// 以下字段类型未被收录，已设置为unknown，可在Setting.yapihello.typeMap设置\n//${result!.req.ignoredType.join(',')}` : ''}
${result!.req.text}`;
          editBuilder.insert(hoverLine, insertText);
				});
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to request API.${error}`);
    }
  });



  vscode.commands.registerCommand('yapihello.respInterface', async () => {
    try {
      // 将内容填充到当前编辑器中
      const activeTextEditor = vscode.window.activeTextEditor;
      if (activeTextEditor) {
        activeTextEditor.edit((editBuilder) => {
					const insertText = `\
${result!.resp.ignoredType?.length ? `\n// 以下字段类型未被收录，已设置为unknown，可在Setting.yapihello.typeMap设置\n// ${result!.resp.ignoredType.join(',')}` : ''}
${result!.resp.text}`;
          editBuilder.insert(hoverLine, insertText);
        });
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to response API.${error}`);
    }
  });
	

	let rightClickDisposable = vscode.commands.registerTextEditorCommand('extension.processSelectedText', (textEditor, edit) => {
		const selectedText = textEditor.document.getText(textEditor.selection);
		// 将处理后的文本替换回原文档
		try {
			const {properties} = JSON.parse(selectedText);
			const {typeMap={}, extTypeMap={}} = vscode.workspace.getConfiguration('yapihello');
			const result = `export interface TypeName {${properties2Type({
					properties: properties,
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
