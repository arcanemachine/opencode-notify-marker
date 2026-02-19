# opencode-notify-marker

> Marker file plugin for OpenCode - create files when events occur.
>
> This project is a fork of [kdco-notify](https://github.com/kdcokenny/opencode-notify) by kdcokenny, repurposed to create marker files instead of desktop notifications.

A plugin for [OpenCode](https://github.com/sst/opencode) that creates marker files in `/workspace/tmp/opencode-notify-marker-files/` when specific events occur. Useful for external monitoring scripts to detect when the AI needs attention (e.g. when you are running OpenCode in a container and can't receive OS notifications).

This plugin was created to be run on an OpenCode instance running in a Docker container, which has a volume mount that is accessible by both the host and the container.

This repo includes a watcher script `./watch-and-notify.sh` that runs on the host so that OS notifications can be generated outside the container. (NOTE: The script uses `notify-send` which is available on Linux. On macOS, you may need to modify the script to use `terminal-notifier` or use a different notification method.)

## Why This Exists

You want to monitor OpenCode sessions from external tools (shell scripts, monitoring dashboards, etc.) but don't want to poll the API. This plugin solves that:

- **Event-driven** - External tools watch the marker files instead of polling.
- **Simple** - Just check if a file exists a configurable directory (e.g. in `/workspace/tmp/opencode-notify-marker-files/`).
- **Lightweight** - No API calls, no network requests, just file system operations.

## How It Works

The plugin automatically creates empty marker files in `/workspace/tmp/opencode-notify-marker-files/` when certain events occur.

The included script `./watch-and-notify.sh` watches the marker directory and sends desktop notifications when files are created. It automatically deletes the marker file after showing the notification.

### Supported Events

| Event              | Event Type                       | Marker File           |
| ------------------ | -------------------------------- | --------------------- |
| Session idle       | `session.idle`                   | `SESSION_IDLE`        |
| Session error      | `session.error`                  | `SESSION_ERROR`       |
| Permission updated | `permission.updated`             | `PERMISSION_UPDATED`  |
| Question tool      | `tool.execute.before` (question) | `TOOL_EXECUTE_BEFORE` |

## Installation

Clone this repo and copy its `src/` into your Opencode config directory: `.opencode/plugin/`

For example: `cp -r /path/to/this/repo/src /path/to/.opencode/plugin`

Then add `"opencode-notify-marker"` to the `plugin` array in your `~/.opencode/opencode.json`:

```json
{
  "plugin": ["opencode-notify-marker"]
}
```

## Usage

If you're running OpenCode in a container but want desktop notifications on your host machine:

1. Start OpenCode in the container.

1. Run `watch-and-notify.sh` on your host machine.

## Directory config

```bash
# Start OpenCode with custom marker directory
PI_NOTIFY_MARKER_DIR="/path/to/some/dir" opencode

# Run watcher script pointing to the same directory in a Docker volume mount
PI_NOTIFY_MARKER_WATCH_DIR="/workspace/path/to/mount/dir" ./watch-and-notify.sh
```

## License

MIT License

Copyright (c) 2026 arcanemachine

This project is a fork of [kdco-notify](https://github.com/kdcokenny/opencode-notify) by kdcokenny, repurposed to create marker files instead of desktop notifications.
