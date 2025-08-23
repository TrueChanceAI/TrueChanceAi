import { useState, useCallback } from "react";

interface VapiCallParams {
  workflowId: string;
  config: {
    assistant: any;
    assistantOverrides: any;
    variableValues: any;
  };
}

interface VapiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const useVapi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeVapiCall = useCallback(
    async (
      action: "start" | "stop" | "create" | "get",
      params?: VapiCallParams | { callId: string }
    ): Promise<VapiResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/vapi`, {
          method: action === "get" ? "GET" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body:
            action === "get"
              ? undefined
              : JSON.stringify({
                  action,
                  ...params,
                }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
          success: result.success,
          data: result.data,
          error: result.error,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const startCall = useCallback(
    (params: VapiCallParams) => makeVapiCall("start", params),
    [makeVapiCall]
  );

  const stopCall = useCallback(
    (params: { callId: string }) => makeVapiCall("stop", params),
    [makeVapiCall]
  );

  const createCall = useCallback(
    (params: VapiCallParams) => makeVapiCall("create", params),
    [makeVapiCall]
  );

  const getCall = useCallback(
    (callId: string) => makeVapiCall("get", { callId }),
    [makeVapiCall]
  );

  return {
    startCall,
    stopCall,
    createCall,
    getCall,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};
