import Vapi from "@vapi-ai/web";

// Debug: Check if VAPI token is loaded
const vapiToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
console.log("🔑 VAPI SDK Token Check:", {
  hasToken: !!vapiToken,
  tokenLength: vapiToken?.length || 0,
  tokenPreview: vapiToken ? `${vapiToken.substring(0, 8)}...` : 'None',
  envVars: {
    hasNextPublicVapiWebToken: !!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN,
    hasNextPublicVapiWorkflowId: !!process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID,
  }
});

if (!vapiToken) {
  console.error("❌ NEXT_PUBLIC_VAPI_WEB_TOKEN is not set!");
  throw new Error("VAPI token is required");
}

export const vapi = new Vapi(vapiToken);
