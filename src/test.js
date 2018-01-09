// @flow

import * as React from "react";
import TestRenderer from "react-test-renderer";
import { createAsyncCacheContext } from "./index.js";

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const asyncRequest = async () => {
  await delay(200);
  return 100;
};

const asyncRejection = async () => {
  await delay(200);
  throw Error("rejected");
};

test("read as pending not loaded promise", () => {
  const renderFn = jest.fn().mockReturnValue(null);
  const ctx = createAsyncCacheContext();

  TestRenderer.create(
    <ctx.Provider>
      <ctx.Consumer>
        {dataCache => renderFn(dataCache.read("newEntry", asyncRequest))}
      </ctx.Consumer>
    </ctx.Provider>
  );

  expect(renderFn).toHaveBeenCalledTimes(1);
  expect(renderFn).lastCalledWith({ state: "pending" });
});

test("read as resolved loaded promise after delay", async () => {
  const renderFn = jest.fn().mockReturnValue(null);
  const ctx = createAsyncCacheContext();

  TestRenderer.create(
    <ctx.Provider>
      <ctx.Consumer>
        {dataCache => renderFn(dataCache.read("newEntry", asyncRequest))}
      </ctx.Consumer>
    </ctx.Provider>
  );

  await delay(300);

  expect(renderFn).toHaveBeenCalledTimes(2);
  expect(renderFn).lastCalledWith({ state: "resolved", payload: 100 });
});

test("read as rejected thrown promise after delay", async () => {
  const renderFn = jest.fn().mockReturnValue(null);
  const ctx = createAsyncCacheContext();

  TestRenderer.create(
    <ctx.Provider>
      <ctx.Consumer>
        {dataCache => renderFn(dataCache.read("newEntry", asyncRejection))}
      </ctx.Consumer>
    </ctx.Provider>
  );

  await delay(300);

  expect(renderFn).toHaveBeenCalledTimes(2);
  expect(renderFn).lastCalledWith({
    state: "rejected",
    payload: Error("rejected")
  });
});

test("read cached result without delay", async () => {
  const renderFn = jest.fn().mockReturnValue(null);
  const ctx = createAsyncCacheContext();

  const renderer = TestRenderer.create(
    <ctx.Provider>
      <ctx.Consumer>
        {dataCache => {
          dataCache.read("entry1", asyncRequest);
          dataCache.read("entry2", asyncRejection);
          return null;
        }}
      </ctx.Consumer>
    </ctx.Provider>
  );

  await delay(300);

  renderer.update(
    <ctx.Provider>
      <ctx.Consumer>
        {dataCache =>
          renderFn(
            dataCache.read("entry1", asyncRequest),
            dataCache.read("entry2", asyncRejection)
          )
        }
      </ctx.Consumer>
    </ctx.Provider>
  );

  expect(renderFn).toHaveBeenCalledTimes(1);
  expect(renderFn).lastCalledWith(
    { state: "resolved", payload: 100 },
    { state: "rejected", payload: Error("rejected") }
  );
});

test("add new cache entry on reading with options", async () => {
  const renderFn = jest.fn().mockReturnValue(null);
  const makeAsync = param => async () => {
    await delay(200);
    return "resolved with options " + param;
  };
  const asyncFn1 = jest.fn().mockImplementation(makeAsync(1));
  const asyncFn2 = jest.fn().mockImplementation(makeAsync(2));
  const ctx = createAsyncCacheContext();

  TestRenderer.create(
    <ctx.Provider>
      <ctx.Consumer>
        {dataCache =>
          renderFn(
            dataCache.readWithParam("entry", asyncFn1, {
              param: "value 1"
            }),
            dataCache.readWithParam("entry", asyncFn2, {
              param: "value 2"
            })
          )
        }
      </ctx.Consumer>
    </ctx.Provider>
  );

  await delay(300);

  expect(renderFn).toHaveBeenCalledTimes(3);
  expect(renderFn).lastCalledWith(
    { state: "resolved", payload: "resolved with options 1" },
    { state: "resolved", payload: "resolved with options 2" }
  );
  expect(asyncFn1).toHaveBeenCalledTimes(1);
  expect(asyncFn1).lastCalledWith({ param: "value 1" });
  expect(asyncFn2).toHaveBeenCalledTimes(1);
  expect(asyncFn2).lastCalledWith({ param: "value 2" });
});

test.only("reset cached entry and force to rerun async operation", async () => {
  const renderFn = jest.fn().mockReturnValue(null);
  let count = 1;
  let reset;
  let resetWithParam;
  const asyncFn1 = jest.fn().mockImplementation(async () => {
    await delay(200);
    return "result " + count;
  });
  const asyncFn2 = jest.fn().mockImplementation(async param => {
    await delay(200);
    return `result ${count} with ${param}`;
  });
  const ctx = createAsyncCacheContext();

  TestRenderer.create(
    <ctx.Provider>
      <ctx.Consumer>
        {dataCache => {
          reset = dataCache.reset;
          resetWithParam = dataCache.resetWithParam;
          return renderFn(
            dataCache.read("entry", asyncFn1),
            dataCache.readWithParam("entry", asyncFn2, "param")
          );
        }}
      </ctx.Consumer>
    </ctx.Provider>
  );

  await delay(300);

  expect(renderFn).lastCalledWith(
    { state: "resolved", payload: "result 1" },
    { state: "resolved", payload: "result 1 with param" }
  );

  count = 2;
  if (reset) {
    reset("entry");
  }

  if (resetWithParam) {
    resetWithParam("entry", "param");
  }

  await delay(300);

  expect(renderFn).toHaveBeenCalledTimes(7);
  expect(renderFn).lastCalledWith(
    { state: "resolved", payload: "result 2" },
    { state: "resolved", payload: "result 2 with param" }
  );
});

test.skip("provider mock for state and payload", () => {});
