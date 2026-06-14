import { OpenAIAgentsProvider } from "@corsair-dev/mcp";
import { Agent, run, tool } from "@openai/agents";
import { corsair } from "./corsair";
import "dotenv/config";

async function main() {
  const provider = new OpenAIAgentsProvider();
  const tools = provider.build({ corsair: corsair.withTenant("dhruv"), tool });

  const agent = new Agent({
    name: "corsair-agent",
    instructions:
      "You have access to Corsair tools. Use list_operations to discover " +
      "available APIs, get_schema to understand arguments, and run_script " +
      "to execute them.",
    tools,
  });

  const result = await run(
    agent,
    "Use Corsair. send a email to pragyaaa620@gmail.com on how to fix lower back pain and make sure to give the excercies that can be done at home as well and keep the mail informative keep it point wise and also make sure to mention the subject and do not mention the name at last ",
  );
  console.log(result.finalOutput);
}

main().catch(console.error);
