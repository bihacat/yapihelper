import * as vscode from 'vscode';
import axios from 'axios';
import { genYapiInterface } from './yapiInterface';

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
}

let resp = undefined;
let result = undefined;
let hoverLine = new vscode.Position(0, 0)

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.languages.registerHoverProvider('*', {
    async provideHover(document: vscode.TextDocument, position: vscode.Position) {
      const line = document.lineAt(position.line);
			hoverLine = new vscode.Position(line.lineNumber, line.text.length);

			const [, id] = line.text.match(/https:\/\/yapi.hellobike.cn\/project\/\d+\/interface\/api\/(\d+)/) || [];
      if (id) {
				try {
					resp = await reqYapi(id);
					result = genYapiInterface({apiData: resp.data.data})
					const hoverText = new vscode.MarkdownString('');
					hoverText.isTrusted = true;
					hoverText.appendMarkdown('[生成请求类型](command:yapihello.reqInterface)');
					hoverText.appendMarkdown('[ 生成响应类型](command:yapihello.respInterface)');
					hoverText.appendMarkdown(`\n\n请求类型`);
					hoverText.appendCodeblock(`${result.req}`);
					hoverText.appendMarkdown(`响应类型`)
					hoverText.appendCodeblock(`${result.resp}`);
					const wordRange = document.getWordRangeAtPosition(position);
					const {ignoredVar} = result;
					if (ignoredVar.length > 0) {
						vscode.window.showWarningMessage(`由于类型未被收录，以下字段被忽略，请在设置中的yapihello.typemap补充类型映射：${ignoredVar.join(',')}`)
					}
					return new vscode.Hover(hoverText, wordRange);
				} catch (error) {
					vscode.window.showErrorMessage(`请在设置中正确当前插件配置的四个cookie字段,${error}`)
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
          editBuilder.insert(hoverLine, `\n${result!.req}`);
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
          editBuilder.insert(hoverLine, `\n${result!.resp}`);
        });
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to response API.${error}`);
    }
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
