#!/bin/bash
set -e

AGENT_ID="agent_0901kx61mf5xf8fayvqyn7pgh2tc"

if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "Set your API key first:"
  echo "  export ELEVENLABS_API_KEY=your_key_here"
  exit 1
fi

echo "PATCHing agent $AGENT_ID directly via API (bypassing CLI)..."

curl -s -X PATCH "https://api.elevenlabs.io/v1/convai/agents/$AGENT_ID" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d @patch_payload.json \
  | python3 -m json.tool

echo ""
echo "Now verify: https://elevenlabs.io/app/agents/agents/$AGENT_ID?tab=workflow"
