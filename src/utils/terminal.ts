import * as vscode from "vscode"
import { Terminal, TerminalColor } from "../config"
import { isNonEmptyString } from "../utils"

const TERMINAL_COLOR_KEYS: Record<TerminalColor, string> = {
    [TerminalColor.black]: "terminal.ansiBlack",
    [TerminalColor.blue]: "terminal.ansiBlue",
    [TerminalColor.cyan]: "terminal.ansiCyan",
    [TerminalColor.green]: "terminal.ansiGreen",
    [TerminalColor.magenta]: "terminal.ansiMagenta",
    [TerminalColor.red]: "terminal.ansiRed",
    [TerminalColor.white]: "terminal.ansiWhite",
    [TerminalColor.yellow]: "terminal.ansiYellow",
}

const resolveTerminalColor = (color?: TerminalColor) =>
    color ? new vscode.ThemeColor(TERMINAL_COLOR_KEYS[color]) : undefined

const parseSplitLocation = (
    location: string
): vscode.TerminalSplitLocationOptions | null => {
    const [, column] = location.split(":")
    if (!column) {
        return null
    }

    const groupNumber = parseInt(column, 10)
    if (Number.isNaN(groupNumber) || groupNumber <= 0) {
        return null
    }

    return { viewColumn: groupNumber }
}

const resolveTerminalLocation = (
    location?: string
):
    | vscode.TerminalLocation
    | vscode.TerminalEditorLocationOptions
    | vscode.TerminalSplitLocationOptions => {
    if (!isNonEmptyString(location)) {
        return vscode.TerminalLocation.Panel
    }

    const normalized = location.toLowerCase()
    if (normalized === "editor") {
        return vscode.TerminalLocation.Editor
    }

    if (normalized.startsWith("split")) {
        return parseSplitLocation(location) ?? vscode.TerminalLocation.Panel
    }

    return vscode.TerminalLocation.Panel
}

const resolveTerminalIcon = (icon?: string) =>
    new vscode.ThemeIcon(icon || "terminal")

const resolveTerminalMessage = (message?: string) =>
    isNonEmptyString(message) ? message : undefined

/**
 * Convert a terminal definition to a valid object that can be given to vscode.window.createTerminal
 */
export const convertToTerminalOptions = (
    terminal: Terminal
): vscode.TerminalOptions => ({
    color: resolveTerminalColor(terminal.color),
    cwd: terminal.cwd,
    name: terminal.name,
    env: terminal.env,
    message: resolveTerminalMessage(terminal.message),
    shellArgs: terminal.shellArgs,
    shellPath: terminal.shellPath,
    iconPath: resolveTerminalIcon(terminal.icon),
    location: resolveTerminalLocation(terminal.location),
})
