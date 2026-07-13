import {
  RouterContextProvider,
  createRequestHandler,
} from "react-router";

import { cloudflareContext } from "../app/context";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, {
      env,
      ctx,
      cf: request.cf,
    });

    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;
