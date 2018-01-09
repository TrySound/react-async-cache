// @flow

import * as React from "react";
import { createAsyncCacheContext } from "./index.js";

const ctx = createAsyncCacheContext();

{
  <ctx.Provider>{null}</ctx.Provider>;
}

{
  // $FlowFixMe
  <ctx.Provider />;
}

{
  const asyncRequest = (): Promise<{ o: string }> => Promise.resolve({ o: "" });
  <ctx.Consumer>
    {asyncCache => {
      const result = asyncCache.read("key", asyncRequest);

      (result.state: "pending" | "resolved" | "rejected");
      // $FlowFixMe
      (result.state: "another");

      if (result.state === "resolved") {
        (result.payload.o: string);
        // $FlowFixMe
        (result.payload.o: number);
        // $FlowFixMe
        (result.payload: number);
      }
    }}
  </ctx.Consumer>;
}

{
  const asyncRequest = (i: { i: number }): Promise<{ o: string }> =>
    Promise.resolve({ o: "" });
  <ctx.Consumer>
    {asyncCache => {
      const result = asyncCache.readWithParam("key", asyncRequest, { i: 0 });
      // $FlowFixMe
      asyncCache.readWithParam("key", asyncRequest);
      // $FlowFixMe
      asyncCache.readWithParam("key", asyncRequest, { i: "" });

      (result.state: "pending" | "resolved" | "rejected");
      // $FlowFixMe
      (result.state: "another");

      if (result.state === "resolved") {
        (result.payload.o: string);
        // $FlowFixMe
        (result.payload.o: number);
        // $FlowFixMe
        (result.payload: number);
      }
    }}
  </ctx.Consumer>;
}

{
  // $FlowFixMe
  <ctx.Consumer />;
}
