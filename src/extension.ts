import * as vscode from "vscode"

import { command } from "./command"

export function activate(context: vscode.ExtensionContext) {
    const disposables: vscode.Disposable[] = []

    disposables.push(
        vscode.commands.registerCommand(
            "terminal-presets.terminal-presets",
            command
        )
    )

    context.subscriptions.push(...disposables)
}

export function deactivate() {}
