#!/bin/bash

WATCH_DIR="${WATCH_DIR:-../../tmp/notifier-marker-files}"

# Ensure directory exists
mkdir -p "$WATCH_DIR"

# Handle marker files (process and remove)
handle_marker_files() {
    shopt -s nullglob
    for file in "$WATCH_DIR"/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            notify-send "OpenCode event" "$filename"
            rm "$file"
        fi
    done
    shopt -u nullglob
}

# Handle existing files on startup
handle_marker_files

# Check if inotifywait is available
if command -v inotifywait &> /dev/null; then
    echo "Using inotifywait to watch $WATCH_DIR"
    inotifywait -m -e create --format '%f' "$WATCH_DIR" | while read -r file; do
        notify-send "Marker file created" "$file"
        rm "$WATCH_DIR/$file"
    done
else
    echo "inotifywait not found, using polling fallback"
    while true; do
        handle_marker_files
        sleep 2
    done
fi
