import * as vscode from "vscode"

import { command, loadConfig, runPreset } from "./command"
import { Preset } from "./config"

const toCommandSlug = (name: string, fallback: string) => {
    const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

    return slug.length > 0 ? slug : fallback
}

const registerPresetCommands = (presets: Preset[]) => {
    const registered = new Set<string>()
    const disposables: vscode.Disposable[] = []

    presets.forEach((preset, index) => {
        const slug = toCommandSlug(preset.name, `preset-${index + 1}`)
        let commandId = `terminal-presets.presets.${slug}`
        let suffix = 2

        while (registered.has(commandId)) {
            commandId = `terminal-presets.presets.${slug}-${suffix++}`
        }

        registered.add(commandId)
        const disposable = vscode.commands.registerCommand(commandId, () =>
            runPreset(preset)
        )
        disposables.push(disposable)
    })

    if (disposables.length === 0) {
        vscode.window.showWarningMessage(
            "No terminal presets available to register"
        )
    }

    return disposables
}

export function activate(context: vscode.ExtensionContext) {
    const disposables: vscode.Disposable[] = []

    disposables.push(
        vscode.commands.registerCommand(
            "terminal-presets.terminal-presets",
            command
        )
    )

    const config = loadConfig()
    if (config) {
        disposables.push(...registerPresetCommands(config.presets))
    }

    context.subscriptions.push(...disposables)
}

export function deactivate() {}
