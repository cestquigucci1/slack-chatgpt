import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";

export const ChatGPTFunction = DefineFunction({
  callback_id: "chatgpt_function",
  title: "Ask ChatGPT",
  description: "Ask questions to ChatGPT",
  source_file: "functions/chatgpt_function.ts",
  input_parameters: {
    properties: {
      channel_id: {
        type: Schema.slack.types.channel_id,
        description: "channel ID",
      },
      user_id: {
        type: Schema.slack.types.user_id,
        description: "user ID",
      },
      question: {
        type: Schema.types.string,
        description: "question to chatgpt",
      },
    },
    required: ["question", "user_id"],
  },
  output_parameters: {
    properties: {
      answer: {
        type: Schema.types.string,
        description: "Answer from AI",
      },
    },
    required: ["answer"],
  },
});

export default SlackFunction(
  ChatGPTFunction,
  async ({ inputs, env, token }) => {
    const client = SlackAPI(token)
    const ChannelID = inputs.channel_id ?? ""
    // Slack API で考え中メッセージを送信
    const thinkingResponse = await client.chat.postMessage({
      channel: ChannelID,
      text: "(OpenAPIに問い合わせ中...)",
    });
    // omit user id expressions
    const content = (inputs.question ?? "").replaceAll(/\<\@.+?\>/g, " ");
    const role = "user";

    const res = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Organization": `${env.OPENAI_ORG_NAME}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role, content }],
        }),
      },
    );
    if (res.status != 200) {
      const body = await res.text();
      await client.chat.delete({
        channel: ChannelID,
        ts: thinkingResponse.ts,
      })
      await client.chat.postMessage({
        channel: ChannelID,
        text: `Failed to call OpenAPI AI. status:${res.status} body:${body}`,
      });
      return {
        error: `Failed to call OpenAPI AI. status:${res.status} body:${body}`,
      };
    }
    const body = await res.json();
    //console.log("chatgpt api response", { role, content }, body);
    if (body.choices && body.choices.length >= 0) {
      const answer = body.choices[0].message.content as string;
      await client.chat.delete({
        channel: ChannelID,
        ts: thinkingResponse.ts,
      })
      await client.chat.postMessage({
        channel: ChannelID,
        text: answer,
      });
      return { outputs: { answer } }
    }
    else
    {
      return {
        error: `No choices provided. body:${JSON.stringify(body)}`,
      };
    }
  },
);
