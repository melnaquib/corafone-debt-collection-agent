#!/usr/bin/env python3
import json

# Load the agent config
with open('agent_configs/inbound_collect.json', 'r') as f:
    config = json.load(f)

# Remove individual tool IDs
config['conversation_config']['agent']['prompt']['tool_ids'] = []

# Remove individual webhook tools
config['conversation_config']['agent']['prompt']['tools'] = []

# Set MCP server IDs to empty array (user will add the server ID manually in dashboard)
# Once the user adds "CollectMCP" server in the dashboard and provides the ID,
# we can add it here or pull the updated config
config['conversation_config']['agent']['prompt']['mcp_server_ids'] = []
config['conversation_config']['agent']['prompt']['native_mcp_server_ids'] = []

# Save the updated config
with open('agent_configs/inbound_collect.json', 'w') as f:
    json.dump(config, f, indent=4)

print("✓ Removed tool_ids array")
print("✓ Removed tools array")
print("✓ Ready for MCP server to be added in dashboard")
print("\nNext steps:")
print("1. User will add 'CollectMCP' server in ElevenLabs dashboard")
print("2. Run 'elevenlabs agents pull' to get the updated config with MCP server ID")
