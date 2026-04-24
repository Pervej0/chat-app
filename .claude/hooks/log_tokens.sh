#!/bin/bash
# .claude/hooks/log_tokens.sh

input=$(cat)
transcript=$(echo "$input" | jq -r '.transcript_path')

if [ -f "$transcript" ]; then
  echo "=== Token Usage Per Message ===" >> ~/.claude/token_log.txt
  echo "Session: $(echo "$input" | jq -r '.session_id')" >> ~/.claude/token_log.txt
  echo "Time: $(date -u)" >> ~/.claude/token_log.txt

  # Extract assistant messages with usage info
  jq -r '
    select(.type == "assistant") |
    .message.usage |
    "  input: \(.input_tokens)  output: \(.output_tokens)  cache_read: \(.cache_read_input_tokens // 0)"
  ' "$transcript" >> ~/.claude/token_log.txt

  echo "---" >> ~/.claude/token_log.txt
fi