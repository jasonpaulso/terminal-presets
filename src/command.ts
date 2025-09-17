import * as fs from "fs"
import * as vscode from "vscode"
import { Config, Preset, findConfigFile, parseConfig } from "./config"
import { convertToTerminalOptions } from "./utils/terminal"

const showErrorMessage = (message: string) => {
    vscode.window.showErrorMessage(message)
}

export const loadConfig = (): Config | null => {
    const configFile = findConfigFile()
    if (!configFile) {
        showErrorMessage("No config file found")
        return null
    }

    try {
        return parseConfig(configFile as string)
    } catch (err) {
        if (err instanceof Error) {
            showErrorMessage(err.message)
        } else {
            showErrorMessage("Failed to load configuration file")
        }
    }

    return null
}

const selectPreset = async (presets: Preset[]): Promise<Preset | null> => {
    const choice = await vscode.window.showQuickPick(
        presets.map((preset) => preset.name),
        { title: "Select a terminal preset" }
    )

    const preset = presets.find((p) => p.name === choice)
    if (!preset) {
        showErrorMessage("Invalid preset")
        return null
    }

    return preset
}

const validateCwd = (
    terminal: Preset["terminals"][number],
    presetName: string
) => {
    if (terminal.cwd && !fs.existsSync(terminal.cwd)) {
        showErrorMessage(
            `Invalid working dir "${terminal.cwd}" for terminal "${terminal.name}" in preset "${presetName}"`
        )
        return false
    }
    return true
}

const launchTerminal = (terminal: Preset["terminals"][number]) => {
    const terminalOptions = convertToTerminalOptions(terminal)
    if (
        typeof terminalOptions.shellPath === "string" &&
        terminalOptions.shellPath.length > 0
    ) {
        const terminalInstance = vscode.window.createTerminal(terminalOptions)
        terminalInstance.show()
        if (terminal.command) {
            terminalInstance.sendText(terminal.command, true)
        }
    }
}

const launchPresetTerminals = (preset: Preset) => {
    preset.terminals.forEach((terminal) => {
        if (validateCwd(terminal, preset.name)) {
            launchTerminal(terminal)
        }
    })
}

export const runPreset = launchPresetTerminals

export const command = async () => {
    const config = loadConfig()
    if (!config) {
        return
    }

    const preset = await selectPreset(config.presets)
    if (!preset) {
        return
    }

    launchPresetTerminals(preset)
}
