# Development Mcp Tool for Functional models

Whenever you build a system using functional models, you can use this MCP tool to teach the AI how to actually interact and work with your models.

## How To Use

You can use this as a CLI MCP tool with any normal AI service. Here is an example used with Cursor.

```json
{
  "mcpServers": {
    "node-in-layers-core": {
      "command": "npx",
      "args": ["-y", "@functional-models/knowledge-mcp"]
    }
  }
}
```

### Selecting a specific version.

If you want the development knowledge to match the version of Node In Layers Core you are using, you can put it in the npx command.

```json
{
  "mcpServers": {
    "node-in-layers-core": {
      "command": "npx",
      "args": ["-y", "@functional-models/knowledge-mcp@3.6.2"]
    }
  }
}
```
