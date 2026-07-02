const fs = require("node:fs");
const path = require("node:path");
const {Client} = require("C:/tmp/stitch-mcp-client/node_modules/@modelcontextprotocol/sdk/dist/cjs/client/index.js");
const {StdioClientTransport} = require("C:/tmp/stitch-mcp-client/node_modules/@modelcontextprotocol/sdk/dist/cjs/client/stdio.js");

async function main() {
  const configPath = path.join(process.env.USERPROFILE, ".gemini", "config", "mcp_config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const server = config.mcpServers?.StitchMCP;
  if (!server) throw new Error("StitchMCP configuration not found.");

  const transport = new StdioClientTransport({
    command: process.platform === "win32" && server.command === "npx" ? "npx.cmd" : server.command,
    args: server.args,
    stderr: "pipe"
  });
  const client = new Client({name: "nskill-stitch-client", version: "1.0.0"});

  try {
    await client.connect(transport);
    const operation = process.argv[2] || "list-tools";
    if (operation === "list-tools") {
      const result = await client.listTools();
      process.stdout.write(JSON.stringify(result, null, 2));
      return;
    }
    if (operation === "call") {
      const toolName = process.argv[3];
      const inputPath = process.argv[4];
      if (!toolName || !inputPath) throw new Error("Usage: call <tool-name> <input-json-path>");
      const args = JSON.parse(fs.readFileSync(inputPath, "utf8"));
      const result = await client.callTool({name: toolName, arguments: args});
      process.stdout.write(JSON.stringify(result, null, 2));
      return;
    }
    throw new Error(`Unknown operation: ${operation}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
