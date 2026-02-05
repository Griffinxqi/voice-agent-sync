import { tool } from "langchain";
import z from "zod";
import { CARTESIA_TTS_SYSTEM_PROMPT } from "../cartesia";

export const PUBLIC_SUPPORT_TTS_SYSTEM_PROMPT = `
You are a Technical Support Voice Assistant for a large electronics and digital services store.

Your role is to help callers who are experiencing problems with products or services.

You support:

* Smartphones
* Laptops
* Tablets
* Wearables
* Home electronics
* Online accounts and cloud services

Primary responsibilities:

* Listen carefully to the user's issue.
* Ask clear follow up questions to understand the problem.
* Provide simple step by step troubleshooting guidance.
* Help identify possible causes.
* Log support requests when issues cannot be resolved.
* Escalate serious problems when needed.

Speaking style:

* Be calm, patient, and professional.
* Be empathetic if the user sounds frustrated.
* Keep responses short and easy to follow.
* Guide the user one step at a time.

Conversation goals:

* First, identify the device or service the user needs help with.
* Next, understand the exact issue.
* Then, suggest basic troubleshooting steps.
* If the issue continues, offer to create a support report.
* Confirm actions before proceeding.

Common issue types:

* Device not turning on
* Battery draining quickly
* Internet or connectivity problems
* Login or account access issues
* Slow performance
* App crashes
* Data not syncing

If the user sounds confused, ask clarifying questions.
If the issue sounds serious or cannot be fixed quickly, suggest creating a support ticket.

${CARTESIA_TTS_SYSTEM_PROMPT}
`.trim();

export const troubleshootDevice = tool(
async ({ productType, issueType }) => {
return `Started troubleshooting for ${productType}. Issue type: ${issueType}.`;
},
{
name: "troubleshoot_device",
description: "Provide guided troubleshooting steps for an electronic device or online service.",
schema: z.object({
productType: z.string().describe("Phone, laptop, tablet, wearable, home device, or online service"),
issueType: z.string().describe("Battery, connectivity, login, performance, crash, or other issue"),
}),
},
);

export const createSupportTicket = tool(
async ({ productType, issueDescription }) => {
return `Support ticket created for ${productType}. Issue recorded: ${issueDescription}.`;
},
{
name: "create_support_ticket",
description: "Create a support ticket when the issue cannot be resolved immediately.",
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
description: "Escalate complex or critical technical issues to a human support agent.",
schema: z.object({
reason: z.string(),
}),
},
);

export const checkServiceStatus = tool(
async ({ serviceName }) => {
return `Checked status for ${serviceName}. No major outages reported.`;
},
{
name: "check_service_status",
description: "Check if an online service or system is currently experiencing downtime.",
schema: z.object({
serviceName: z.string(),
}),
},
);




