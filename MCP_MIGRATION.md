# MCP Server Migration Status

## ✅ Completed Steps

### 1. MCP Server Implementation
- Created CollectMCP server using MCP-Nest package
- Implemented all 5 debt collection tools:
  - `negotiate_calc` - Calculate counter-offers
  - `send_outcome` - Log call outcomes
  - `id_challenge` - Generate security questions
  - `id_approve` - Verify identity
  - `get_debt_details` - Retrieve account information

### 2. Server Configuration
- **Name**: CollectMCP
- **Title**: Debt Collection MCP Server
- **Version**: 1.0.0
- **Description**: Model Context Protocol server providing debt collection tools for AI agents
- **Instructions**: Use these tools to handle debt collection conversations. Always verify identity before discussing account details, use negotiate_calc before making counter-offers, and send_outcome at the end of each call.

### 3. Transport Endpoints
The MCP server is running on http://localhost:3000 with multiple transports:

- **SSE (Server-Sent Events)**:
  - `GET /sse` - SSE connection endpoint
  - `POST /messages` - Send messages via SSE

- **Streamable HTTP**:
  - `POST /mcp` - Send request
  - `GET /mcp` - Get session status
  - `DELETE /mcp` - Clean up session

- **STDIO**:
  - Run with `npm run mcp` for command-line MCP server
  - Entry point: `collect-tools/src/mcp.ts`

### 4. Code Structure
```
collect-tools/
├── src/
│   ├── app.module.ts          # NestJS module with McpModule configuration
│   ├── collect-mcp.service.ts # MCP tools using @Tool decorators
│   ├── collect.service.ts     # Shared business logic
│   ├── main.ts                # HTTP server (webhooks + MCP endpoints)
│   └── mcp.ts                 # STDIO server entry point
├── package.json               # Dependencies including @rekog/mcp-nest
└── tsconfig.json
```

### 5. Removed Webhook Tools
All individual webhook tools have been removed:
- ❌ negotiate_calc webhook (tool_4401kx63h1wefdpbkdw4c8hx8ms8)
- ❌ send_outcome webhook (tool_1301kx64yft7fcca1bms595t8xte)
- ❌ id_challenge webhook (tool_5001kx6t1zgvfskr1b3bxavstrcw)
- ❌ id_approve webhook (tool_9701kx6t74xhfjrvzwgm1c3qx94p)
- ❌ get_debt_details webhook (tool_1201kx6tbsycfpbthxp0tjx7179q)

### 6. Agent Configuration
- `tool_ids`: [] (empty - no individual tools)
- `tools`: [] (empty - no webhook definitions)
- `mcp_server_ids`: [] (ready for MCP server ID)
- All workflow nodes updated to remove hardcoded tool IDs from `additional_tool_ids` arrays

## ⏳ Pending Steps

### 1. Add MCP Server in ElevenLabs Dashboard
You need to manually add the CollectMCP server in the ElevenLabs dashboard:

1. Go to: https://elevenlabs.io/app/agents/agents/agent_0901kx61mf5xf8fayvqyn7pgh2tc
2. Navigate to MCP Servers section
3. Add new MCP server with details:
   - **Name**: CollectMCP
   - **URL**: Your public endpoint (e.g., via ngrok)
   - **Transport**: Choose SSE or Streamable HTTP

   For SSE: `https://your-domain.com/sse`
   For Streamable HTTP: `https://your-domain.com/mcp`

### 2. Pull Updated Agent Config
After adding the MCP server in the dashboard:

```bash
elevenlabs agents pull
```

This will update `agent_configs/inbound_collect.json` with the MCP server ID in the `mcp_server_ids` array.

### 3. Test the Agent
Once the MCP server is added, you can test the agent. The tests will work again once tools are available via MCP.

## 🚀 Running the Servers

### Development Mode
```bash
# Terminal 1: Run HTTP server (webhooks + MCP SSE/HTTP endpoints)
cd collect-tools
npm start

# Terminal 2: Run ngrok to expose MCP server
ngrok http 3000
```

### STDIO Mode (for local MCP testing)
```bash
cd collect-tools
npm run mcp
```

## 📝 Notes

- The MCP server uses the same business logic as the webhook implementation
- All tool schemas have been converted from JSON Schema to Zod schemas
- The server automatically discovers all tools decorated with `@Tool`
- Tools are available via all three transports (SSE, Streamable HTTP, STDIO)

## ⚠️ Current State

**The agent currently has NO TOOLS configured.**

This is intentional - we've removed the webhook tools and are waiting for you to add the MCP server in the dashboard. Once you add the CollectMCP server, all 5 tools will be available again via the Model Context Protocol.

## 🔄 Rollback (if needed)

If you need to rollback to webhook tools:

```bash
git checkout 83638f3  # Before webhook removal
./push.sh
```

## 📚 References

- MCP-Nest Documentation: https://github.com/rekog-labs/MCP-Nest
- Model Context Protocol: https://modelcontextprotocol.io/
- ElevenLabs Conversational AI: https://elevenlabs.io/docs/api-reference/conversational-ai
