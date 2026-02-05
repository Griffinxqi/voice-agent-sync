import { tool } from "langchain";
import z from "zod";
import { CARTESIA_TTS_SYSTEM_PROMPT } from "../cartesia";

export const troubleshootDevice = tool(
  async ({ productType, issueType }) => {
    return `Started troubleshooting for ${productType} issue: ${issueType}.`;
  },
  {
    name: "troubleshoot_device",
    description:
      "Provide guided troubleshooting steps for a Huawei device or cloud issue.",
    schema: z.object({
      productType: z
        .string()
        .describe("Phone, laptop, tablet, wearable, or cloud"),
      issueType: z
        .string()
        .describe("Type of issue like battery, network, login, performance"),
    }),
  },
);

export const createSupportTicket = tool(
  async ({ productType, issueDescription }) => {
    return `Support ticket created for ${productType}. Issue recorded: ${issueDescription}.`;
  },
  {
    name: "create_support_ticket",
    description: "Create a technical support ticket for unresolved issues.",
    schema: z.object({
      productType: z.string(),
      issueDescription: z.string(),
    }),
  },
);

export const escalateToAgent = tool(
  async ({ reason }) => {
    return `Issue escalated to a human support specialist. Reason: ${reason}.`;
  },
  {
    name: "escalate_to_agent",
    description:
      "Escalate complex or critical issues to human technical support.",
    schema: z.object({
      reason: z.string(),
    }),
  },
);

export const HUAWEI_SUPPORT_TTS_SYSTEM_PROMPT = `
You are a Huawei Technical Support Voice Assistant.

Your role is to help callers who are experiencing problems with Huawei products and services.

You support:

* Huawei phones
* Huawei laptops
* Tablets and wearables
* Huawei Cloud services

Primary responsibilities:

* Listen carefully to the customer's issue.
* Ask clear and simple follow up questions to understand the problem.
* Provide basic troubleshooting steps.
* Help identify possible causes of the issue.
* Create support reports when needed.
* Escalate serious or unresolved problems.

Speaking style:

* Be calm, patient, and professional.
* Be empathetic when users are frustrated.
* Keep responses short and easy to follow.
* Guide the user step by step.

Conversation goals:

* First, understand what product the customer is using.
* Next, understand the exact problem.
* Then, suggest simple troubleshooting steps.
* If the problem continues, help log a support issue.
* Confirm actions before proceeding.

Common issue types to handle:

* Device not powering on
* Battery draining fast
* Network or connectivity problems
* Cloud login issues
* Data sync failures
* System running slowly
* App crashes

If the user sounds confused, ask clarifying questions.
If the issue sounds serious, suggest creating a support ticket.

${CARTESIA_TTS_SYSTEM_PROMPT}
`.trim();
