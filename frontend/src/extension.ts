import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // 1. Register Sidebar Webview Provider
  const provider = new ApexViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('apexCodeAiView', provider)
  );

  // 2. Register command to open the Reviewer panel from the Command Palette
  let openReviewerCommand = vscode.commands.registerCommand('apex-code-ai.openReviewer', () => {
    provider.showView();
  });
  context.subscriptions.push(openReviewerCommand);

  // 3. Register command to review currently active editor file
  let disposable = vscode.commands.registerCommand('apex-code-ai.reviewCurrentFile', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active text editor found.');
      return;
    }
    const codeContent = editor.document.getText();
    provider.sendCodeToWebview(codeContent);
  });

  context.subscriptions.push(disposable);
}

class ApexViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages sent from the React UI back to the extension
    webviewView.webview.onDidReceiveMessage((message: any) => {
      switch (message.command) {
        case 'alert':
          vscode.window.showInformationMessage(message.text);
          return;
      }
    });
  }

  public showView() {
    if (this._view) {
      this._view.show?.(true);
    } else {
      vscode.commands.executeCommand('workbench.view.extension.apex-code-ai-sidebar');
    }
  }

  public sendCodeToWebview(code: string) {
    if (this._view) {
      this._view.show?.(true);
      this._view.webview.postMessage({ command: 'loadCode', code });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Apex Code AI</title>
      </head>
      <body class="bg-zinc-950 text-zinc-100">
          <div id="root">
            <h2 style="padding: 16px; font-family: sans-serif;">Apex Code AI Extension Loading...</h2>
          </div>
      </body>
      </html>`;
  }
}

export function deactivate() {}