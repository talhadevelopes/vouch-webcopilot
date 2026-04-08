import { useCallback, useState } from "react";
import { clearExtensionAuth, exchangeExtensionCode, hasExtensionAuth } from "../../lib/api";

export function useExtensionAuth() {
  const [authState, setAuthState] = useState(hasExtensionAuth() ? "Connected" : "Not connected");

  const connectWithCode = useCallback(async (code: string) => {
    await exchangeExtensionCode(code);
    setAuthState("Connected");
  }, []);

  const logout = useCallback(() => {
    clearExtensionAuth();
    setAuthState("Not connected");
  }, []);

  return {
    authState,
    connectWithCode,
    logout,
  };
}
