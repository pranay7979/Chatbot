import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const client = new Client({
  name: "burp-security-test",
  version: "1.0.0"
});

const transport = new StreamableHTTPClientTransport(
  new URL("http://127.0.0.1:3000/mcp")
);

try {
  console.log("Connecting to MCP HTTP server...");

  await client.connect(transport);

  console.log("Connected successfully!");

  console.log("\nAvailable MCP tools:");
  const tools = await client.listTools();
  console.log(JSON.stringify(tools, null, 2));

  console.log("\nCalling read_lab_file...");
  const result = await client.callTool({
    name: "read_lab_file",
    arguments: {
      filename: "incident.txt"
    }
  });

  console.log("\nMCP SERVER RESPONSE:");
  console.log(JSON.stringify(result, null, 2));

} catch (error) {
  console.error("Client error:", error);
} finally {
  await client.close();
}
