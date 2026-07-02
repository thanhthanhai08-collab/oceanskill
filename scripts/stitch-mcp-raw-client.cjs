const fs = require("node:fs");
const path = require("node:path");
const spawn = require("C:/tmp/stitch-mcp-client/node_modules/cross-spawn");

const configPath = path.join(process.env.USERPROFILE, ".gemini", "config", "mcp_config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const server = config.mcpServers?.StitchMCP;
if (!server) throw new Error("StitchMCP configuration not found.");

const command = process.platform === "win32" && server.command === "npx" ? "npx.cmd" : server.command;
const child = spawn(command, server.args, {stdio: ["pipe", "pipe", "pipe"]});
const pending = new Map();
let nextId = 1;
let buffer = "";

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  buffer += chunk;
  let newline;
  while ((newline = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (!line.startsWith("{")) continue;
    let message;
    try { message = JSON.parse(line); } catch { continue; }
    if (message.id !== undefined && pending.has(message.id)) {
      const {resolve, reject} = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
  }
});

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

function request(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, {resolve, reject});
    send({jsonrpc: "2.0", id, method, params});
    setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}`));
    }, 90000);
  });
}

async function main() {
  await request("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: {name: "nskill-stitch-raw-client", version: "1.0.0"}
  });
  send({jsonrpc: "2.0", method: "notifications/initialized", params: {}});

  const operation = process.argv[2] || "list-tools";
  let result;
  if (operation === "list-tools") {
    const listed = await request("tools/list");
    result = {
      tools: listed.tools.map(({name, description, inputSchema}) => ({name, description, inputSchema}))
    };
  } else if (operation === "call") {
    const toolName = process.argv[3];
    const inputPath = process.argv[4];
    if (!toolName || !inputPath) throw new Error("Usage: call <tool-name> <input-json-path>");
    result = await request("tools/call", {
      name: toolName,
      arguments: JSON.parse(fs.readFileSync(inputPath, "utf8"))
    });
  } else {
    throw new Error(`Unknown operation: ${operation}`);
  }
  process.stdout.write(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => {
    child.kill();
    setTimeout(() => process.exit(process.exitCode || 0), 100);
  });
