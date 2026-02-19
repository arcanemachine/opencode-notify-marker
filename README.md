# opencode-notifier-marker

> Marker file plugin for OpenCode - create files when events occur.

A plugin for [OpenCode](https://github.com/sst/opencode) that creates marker files in `/workspace/tmp/notifier/` when specific events occur. Useful for external monitoring scripts to detect when the AI needs attention.

**Note:** This project is a fork of [kdco-notify](https://github.com/kdcokenny/opencode-notify) by kdcokenny, repurposed to create marker files instead of desktop notifications.

## Why This Exists

You want to monitor OpenCode sessions from external tools (shell scripts, monitoring dashboards, etc.) but don't want to poll the API. This plugin solves that:

- **Event-driven** - External tools watch the marker files instead of polling
- **Simple** - Just check if a file exists in `/workspace/tmp/notifier/`
- **Lightweight** - No API calls, no network requests, just file system operations

## Installation

Install via [OCX](https://github.com/kdcokenny/ocx), the package manager for OpenCode extensions:

```bash
# Install OCX
curl -fsSL https://ocx.kdco.dev/install.sh | sh

# Add the registry and install
ocx registry add https://registry.kdco.dev --name kdco
ocx add kdco/notifier-marker
```

Or get everything at once with `kdco-workspace`:

```bash
ocx add kdco/workspace
```

## How It Works

| Event | Marker File | Why |
|-------|-------------|-----|
| Session idle | `SESSION_IDLE` | Main task done - time to review |
| Session error | `SESSION_ERROR` | Something broke - needs attention |
| Permission needed | `PERMISSION_UPDATED` | AI is blocked, waiting for you |
| Question asked | `TOOL_EXECUTE_BEFORE` | AI needs your input |

The plugin automatically:
1. Creates marker files in `/workspace/tmp/notifier/`
2. Only creates markers for parent sessions (not every sub-task)
3. Overwrites existing markers with new timestamps

## Configuration (Optional)

Works out of the box. To customize, create `~/.config/opencode/kdco-notifier-marker.json`:

```json
{
  "notifyChildSessions": false
}
```

## Example Usage

### Shell Script Monitoring

```bash
#!/bin/bash

while true; do
  if [ -f "/workspace/tmp/notifier/SESSION_IDLE" ]; then
    echo "Session complete! Checking output..."
    # Your logic here
    rm "/workspace/tmp/notifier/SESSION_IDLE"
  fi
  
  if [ -f "/workspace/tmp/notifier/SESSION_ERROR" ]; then
    echo "Session error detected!"
    # Your logic here
    rm "/workspace/tmp/notifier/SESSION_ERROR"
  fi
  
  sleep 5
done
```

### Python Monitoring

```python
import os
import time
from pathlib import Path

MARKER_DIR = Path("/workspace/tmp/notifier")

while True:
    for marker in ["SESSION_IDLE", "SESSION_ERROR", "PERMISSION_UPDATED"]:
        marker_path = MARKER_DIR / marker
        if marker_path.exists():
            print(f"Event detected: {marker}")
            marker_path.unlink()
    
    time.sleep(5)
```

## Marker File Format

Each marker file contains a JSON object with a timestamp:

```json
{
  "created": "2024-01-15T10:30:45.123Z"
}
```

## Supported Events

| Event | Event Type | Marker File |
|-------|------------|-------------|
| Session idle | `session.idle` | `SESSION_IDLE` |
| Session error | `session.error` | `SESSION_ERROR` |
| Permission updated | `permission.updated` | `PERMISSION_UPDATED` |
| Question tool | `tool.execute.before` (question) | `TOOL_EXECUTE_BEFORE` |

## Manual Installation

If you prefer not to use OCX, copy the source from [`src/`](./src) to `.opencode/plugin/`.

**Caveats:**
- Updates require manual re-copying

## License

MIT License

Copyright (c) 2026 arcanemachine

This project is a fork of [kdco-notify](https://github.com/kdcokenny/opencode-notify) by kdcokenny, repurposed to create marker files instead of desktop notifications.
