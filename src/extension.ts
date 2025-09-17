import * as vscode from "vscode"

import { command } from "./command"

const toCommandSlug = (name: string, fallback: string) => {
    const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

    return slug.length > 0 ? slug : fallback
}

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
