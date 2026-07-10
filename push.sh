#!/bin/bash
set -e

echo "== ElevenLabs push: inbound-collect =="

if ! command -v elevenlabs &> /dev/null; then
  echo "Installing ElevenLabs CLI..."
  npm install -g @elevenlabs/cli
fi

elevenlabs auth login

# Only run init if this isn't already an initialized project
if [ ! -f agents.json ]; then
  elevenlabs agents init
fi

echo "Pushing tools..."
elevenlabs tools push

echo "Pushing agent workflow..."
elevenlabs agents push --agent agent_0901kx61mf5xf8fayvqyn7pgh2tc

echo "Pushing tests..."
elevenlabs tests push

echo "Done. Verify in dashboard: https://elevenlabs.io/app/agents"
