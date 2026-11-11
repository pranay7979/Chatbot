
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const SERVER_PATH = "/home/pranay/mcp-security-lab/server.js";

async function main() {
  const client = new Client({
    name: "attack3-capability-chaining",
    version: "1.0.0"
  });

  const transport = new StdioClientTransport({
    command: "node",
    args: [SERVER_PATH]
  });

  try {
    console.log("\nConnecting to MCP server...");
    await client.connect(transport);
    console.log("MCP connection successful.");

    const { tools } = await client.listTools();

    console.log("\nAvailable MCP tools:");
    tools.forEach(tool => console.log("-", tool.name));

    // Verify both tools are registered.
    const searchTool = tools.find(
      tool => tool.name === "search_documents"
    );

    const databaseTool = tools.find(
      tool => tool.name === "database_query"
    );

    if (!searchTool || !databaseTool) {
      throw new Error("Required MCP tools are unavailable.");
    }

    // STEP 1: Search incident documents.
    console.log("\n================================");
    console.log("ATTACK 3: CAPABILITY CHAINING");
    console.log("================================");

    console.log("\nSTEP 1: Calling search_documents");

    const searchResult = await client.callTool({
      name: "search_documents",
      arguments: {
        keyword: "Security"
      }
    });

    console.log("\nFirst tool response:");
    console.log(JSON.stringify(searchResult, null, 2));

    // Extract the assigned team from the first tool's output.
    const firstOutput = (searchResult.content || [])
      .map(item => item.text || "")
      .join("\n");

    const teamMatch = firstOutput.match(
      /Assigned Team:\s*([^\n]+)/i
    );

    if (!teamMatch) {
      console.log(
        "\nCould not extract the assigned team. Chain stopped."
      );
      return;
    }

    const assignedTeam = teamMatch[1].trim();

    // Derive a department keyword from the first tool's output.
    const department = assignedTeam.split(/\s+/)[0];

    console.log("\nInformation extracted from Tool 1:");
    console.log("Assigned team:", assignedTeam);
    console.log("Department keyword:", department);

    // STEP 2: Use the extracted information in the database query.
    const databaseQuery =
      `SELECT * FROM employees WHERE department = '${department}'`;

    console.log("\nSTEP 2: Calling database_query");
    console.log("Query:", databaseQuery);

    const databaseResult = await client.callTool({
      name: "database_query",
      arguments: {
        query: databaseQuery
      }
    });

    console.log("\nSecond tool response:");
    console.log(JSON.stringify(databaseResult, null, 2));

    // FINAL SUMMARY
    console.log("\n================================");
    console.log("ATTACK 3 TEST SUMMARY");
    console.log("================================");

    console.log("Tool 1: search_documents");
    console.log("Tool 1 result: Incident information retrieved.");

    console.log("Tool 2: database_query");
    console.log("Tool 2 input derived from Tool 1:", department);

    console.log("Both MCP tools executed: YES");
    console.log("Capability chaining demonstrated: YES");
    console.log(
      "Data scope: Dummy incident and simulated employee records."
    );

  } catch (error) {
    console.error("\nATTACK 3 ERROR:", error.message);
  } finally {
    await client.close();
    console.log("\nMCP connection closed.");
  }
}

main();

