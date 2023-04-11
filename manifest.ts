import { Manifest } from "deno-slack-sdk/mod.ts";
import ChatGPTWorkflow from "./workflows/chatgpt_workflow.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/future/manifest
 */
export default Manifest({
  name: "ChatGPT",
  description:
    "A sample that demonstrates using a function, workflow and trigger to send queries to ChatGPT.",
  icon: "assets/default_new_app_icon.png",
  workflows: [
    ChatGPTWorkflow,
  ],
  outgoingDomains: [
    "api.openai.com",
  ],
  botScopes: [
    "commands",
    "app_mentions:read",
    "chat:write",
    "chat:write.public",
    "channels:read",
    "channels:history",
    "groups:history",  
  ],
});
