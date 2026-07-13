import { createContext } from "react-router";

export interface CloudflareContextValue {
  env: Env;
  ctx: ExecutionContext;
  cf?: IncomingRequestCfProperties;
}

export const cloudflareContext = createContext<CloudflareContextValue>();
