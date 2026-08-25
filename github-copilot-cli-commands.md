# Common GitHub Copilot CLI Commands

## Help and navigation

```text
/help                 Show full help
?                     Show quick help
/clear                Start a fresh conversation
/exit                 Exit Copilot CLI
/version              Show the installed version
/update               Update the CLI
```

## Working with code

```text
/init                 Create repository instructions
/diff                 Review current directory changes
/pr                   Work with the current branch pull request
/review               Run a code review agent
/security-review      Analyze local changes for security vulnerabilities
/rubber-duck          Get an independent critique of current work
/plan                 Create an implementation plan before coding
/ide                  Connect an IDE workspace
/lsp                  Manage language server configuration
```

## Agents and models

```text
/agent                Browse and select an agent
/model                Select the session model
/delegate             Delegate work to Copilot on GitHub and create a PR
/fleet                Enable parallel subagent execution
/autopilot            Toggle autopilot mode
/tasks                View and manage tasks
/subagents            Configure subagent models
```

## Sessions and context

```text
/new                  Start a new conversation
/resume               Switch to another session
/rename               Rename the current session
/fork                 Fork the current session
/context              Show context-window usage
/compact              Summarize conversation history
/share                Export or share the session
/rewind               Revert the previous turn and its file changes
/usage                Display session usage statistics
```

## Configuration and permissions

```text
/settings             View or update settings
/permissions          Switch permission modes
/allow-all            Enable all permissions
/add-dir              Allow access to a directory
/list-dirs            List allowed directories
/cwd                  Show or change the working directory
/mcp                  Manage MCP server configuration
/skills               Manage skills
/plugin               Manage plugins and marketplaces
```

## Input shortcuts

```text
@                    Mention files
#                    Mention GitHub issues or pull requests
!                    Run a shell command
Shift+Tab            Switch modes
Ctrl+Q               Queue a prompt
Ctrl+S               Stash or restore the current prompt
Ctrl+G               Edit the prompt in $EDITOR
Shift+Enter          Insert a newline
Esc Esc              Clear input, stop agents, or rewind
```

Run `/help` or `/help <command>` in Copilot CLI for command-specific usage.
