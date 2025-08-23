export const getUserIP = async (): Promise<string> => {
  try {
    // Try to get IP from multiple sources
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn("Failed to get IP from ipify, using fallback");
    // Fallback: try to get from other services
    try {
      const response = await fetch("https://api64.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (fallbackError) {
      console.warn("Failed to get IP from fallback service");
      return "127.0.0.1"; // Default fallback
    }
  }
};
