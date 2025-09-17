import * as fs from "fs"
import * as vscode from "vscode"
import {
    Config,
    findConfigFile,
    parseConfig,
    Terminal,
    TerminalColor,
} from "./config"
import { isNonEmptyString } from "./utils"

/**
 * Convert a terminal definition to a valid object that can be given to vscode.window.createTerminal
 */
function convertToTerminalOptions(terminal: Terminal): vscode.TerminalOptions {
    const colorMap = {
        [TerminalColor.black]: "terminal.ansiBlack",
        [TerminalColor.blue]: "terminal.ansiBlue",
        [TerminalColor.cyan]: "terminal.ansiCyan",
        [TerminalColor.green]: "terminal.ansiGreen",
        [TerminalColor.magenta]: "terminal.ansiMagenta",
        [TerminalColor.red]: "terminal.ansiRed",
        [TerminalColor.white]: "terminal.ansiWhite",
        [TerminalColor.yellow]: "terminal.ansiYellow",
    }

    let terminalLocation:
        | vscode.TerminalLocation
        | vscode.TerminalEditorLocationOptions
        | vscode.TerminalSplitLocationOptions =
        terminal.location?.toLowerCase() === "editor"
            ? vscode.TerminalLocation.Editor
            : vscode.TerminalLocation.Panel

    if (isNonEmptyString(terminal.location)) {
        if (terminal.location?.toLowerCase().startsWith("split")) {
            const parts = terminal.location.split(":")
            if (parts.length === 2) {
                const groupNumber = parseInt(parts[1], 10)
                if (!isNaN(groupNumber) && groupNumber > 0) {
                    terminalLocation = {
                        viewColumn: groupNumber,
                    }
                }
            } else {
                terminalLocation = vscode.TerminalLocation.Panel
            }
        }
    }
    const icon = new vscode.ThemeIcon(terminal.icon || "terminal")

    return {
        color: terminal.color
            ? new vscode.ThemeColor(colorMap[terminal.color])
            : undefined,
        cwd: terminal.cwd,
        name: terminal.name,
        env: terminal.env,
        message: isNonEmptyString(terminal.message)
            ? terminal.message
            : undefined,
        shellArgs: terminal.shellArgs,
        shellPath: terminal.shellPath,
        iconPath: icon,
        location: terminalLocation,
    }
}

export const command = async () => {
    // Find the config file in the currently open workspace or folder
    const configFile = findConfigFile()
    if (!configFile) {
        vscode.window.showErrorMessage("No config file found")
        return
    }
    let config: Config | null = null

    // Parse the config and assert everything is correct
    try {
        config = parseConfig(configFile as string)
    } catch (err) {
        if (err instanceof Error) {
            vscode.window.showErrorMessage(err.message)
        } else {
            vscode.window.showErrorMessage("Failed to load configuration file")
        }
        return
    }

    if (!config) {
        vscode.window.showErrorMessage("Failed to load configuration file")
        return
    }

    // Ask the user to select the desired preset
    const presets = config.presets
    const selectedPreset = await vscode.window.showQuickPick(
        presets.map((p) => p.name),
        { title: "Select a terminal preset" }
    )

    const preset = presets.find((p) => p.name === selectedPreset)
    if (!preset) {
        vscode.window.showErrorMessage("Invalid preset")
        return
    }

    // Create each terminals
    preset.terminals.forEach((terminal) => {
        if (terminal.cwd && !fs.existsSync(terminal.cwd)) {
            vscode.window.showErrorMessage(
                `Invalid working dir "${terminal.cwd}" for terminal "${terminal.name}" in preset "${preset.name}"`
            )
        } else {
            const terminalOptions = convertToTerminalOptions(terminal)
            if (
                typeof terminalOptions.shellPath === "string" &&
                terminalOptions.shellPath.length > 0
            ) {
                const terminalInstance =
                    vscode.window.createTerminal(terminalOptions)
                terminalInstance.show()
                terminal.command &&
                    terminalInstance.sendText(terminal.command, true)
            }
        }
    })
}
