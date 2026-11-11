
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const server = new McpServer({
  name: "techcorp-security-lab",
  version: "1.0.0"
});

import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.join(__dirname, "data");

// TOOL 1: Read a file from the lab directory
server.registerTool(
  "read_lab_file",
  {
    description: "Read a sample file from the lab directory",
    inputSchema: z.object({
      filename: z.enum(["incident.txt"])
    })
  },
  async ({ filename }) => {
    const content = await fs.readFile(
      path.join(DATA_DIR, filename),
      "utf8"
    );

    return {
      content: [{ type: "text", text: content }]
    };
  }
);

// TOOL 2: Search sample company documents
server.registerTool(
  "search_documents",
  {
    description: "Search the sample company incident document",
    inputSchema: z.object({
      keyword: z.string().min(1).max(100)
    })
  },
  async ({ keyword }) => {
    const content = await fs.readFile(
      path.join(DATA_DIR, "incident.txt"),
      "utf8"
    );

    const matches = content
      .split("\n")
      .filter(line =>
        line.toLowerCase().includes(keyword.toLowerCase())
      );

    return {
      content: [{
        type: "text",
        text: matches.length
          ? matches.join("\n")
          : "No matching information found."
      }]
    };
  }
);

// TOOL 3: Query a simulated company database
server.registerTool(
  "database_query",
  {
    description: "Query dummy employee records using a SELECT statement",
    inputSchema: z.object({
      query: z.string().min(1).max(200)
    })
  },
  async ({ query }) => {
    if (!/^\s*SELECT\b/i.test(query) ||
        /;|--|\/\*|\b(INSERT|UPDATE|DELETE|DROP|ALTER|ATTACH|PRAGMA)\b/i.test(query)) {
      return {
        content: [{
          type: "text",
          text: "Rejected: only a single read-only SELECT query is permitted."
        }],
        isError: true
      };
    }

    const employees = [
      { id: 101, name: "Alex", department: "IT" },
      { id: 102, name: "Jordan", department: "Security" },
      { id: 103, name: "Taylor", department: "HR" }
    ];

    return {
      content: [{
        type: "text",
        text: JSON.stringify(employees, null, 2)
      }]
    };
  }
);

// TOOL 4: Execute an allowlisted system command
server.registerTool(
  "run_safe_command",
  {
    description: "Run a limited, predefined diagnostic command",
    inputSchema: z.object({
      command: z.enum(["pwd", "whoami", "date", "ls"])
    })
  },
  async ({ command }) => {
    const { stdout } = await execFileAsync(command, [], {
      cwd: process.cwd(),
      timeout: 3000
    });

    return {
      content: [{
        type: "text",
        text: stdout
      }]
    };
  }
);

// RESOURCE 1: File-backed incident report
server.registerResource(
  "incident_report",
  "techcorp://incidents/1001",
  {
    title: "Incident Report",
    description: "Sample incident report for security testing",
    mimeType: "text/plain"
  },
  async uri => ({
    contents: [{
      uri: uri.href,
      mimeType: "text/plain",
      text: await fs.readFile(
        path.join(DATA_DIR, "incident.txt"),
        "utf8"
      )
    }]
  })
);

// RESOURCE 2: Application configuration
server.registerResource(
  "app_config",
  "techcorp://config/app",
  {
    title: "Application Configuration",
    description: "Dummy application configuration",
    mimeType: "text/plain"
  },
  async uri => ({
    contents: [{
      uri: uri.href,
      mimeType: "text/plain",
      text: "environment=lab\nlog_level=info\naccess=internal"
    }]
  })
);

// PROMPT 1: Incident analysis
server.registerPrompt(
  "analyze_incident",
  {
    title: "Analyze Security Incident",
    description: "Generate an incident analysis",
    argsSchema: z.object({
      incident: z.string()
    })
  },
  ({ incident }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Analyze this security incident:\n${incident}`
      }
    }]
  })
);

// PROMPT 2: Security review
server.registerPrompt(
  "security_review",
  {
    title: "Security Review",
    description: "Review a system component",
    argsSchema: z.object({
      component: z.string()
    })
  },
  ({ component }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Perform a security review of: ${component}`
      }
    }]
  })
);

await serveStdio(() => server);

