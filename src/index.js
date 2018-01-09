// @flow

import * as React from "react";
import createReactContext from "create-react-context";

type PromisedValue<T> =
  | { state: "pending" }
  | { state: "resolved", payload: T }
  | { state: "rejected", payload: Error };

type AsyncCache = {
  read<D>(key: string, miss: () => Promise<D>): PromisedValue<D>,
  readWithParam<A, D>(
    key: string,
    miss: (arg: A) => Promise<D>,
    arg: A
  ): PromisedValue<D>,
  reset(key: string): void,
  resetWithParam<A>(key: string, A): void
};

type AsyncCacheContext = {
  Provider: React.ComponentType<{ children: React.Node }>,
  Consumer: React.ComponentType<{ children: AsyncCache => React.Node }>
};

type ProviderProps = {
  children: React.Node
};

type ProviderState = {
  value: AsyncCache
};

const noop = () => {};

const createNewCache = (update: AsyncCache => void): AsyncCache => {
  const cache = new Map();
  const errors = new Map();
  const pendingRequests = new Map();

  const load = <D>(key, miss: () => Promise<D>) => {
    const promise = miss();
    pendingRequests.set(key, promise);
    promise
      .then(value => {
        cache.set(key, value);
        pendingRequests.delete(key);
        update(copy());
      })
      .catch(error => {
        errors.set(key, error);
        pendingRequests.delete(key);
        update(copy());
      });
  };

  const read = (key, miss) => {
    if (cache.has(key)) {
      return { state: "resolved", payload: (cache.get(key): any) };
    }
    if (errors.has(key)) {
      return { state: "rejected", payload: (errors.get(key): any) };
    }
    if (!pendingRequests.has(key)) {
      load(key, miss);
    }
    return { state: "pending" };
  };

  const readWithParam = (prefix, miss, param) => {
    const suffix = JSON.stringify(param);
    const key = String(prefix) + suffix;
    if (cache.has(key)) {
      return { state: "resolved", payload: (cache.get(key): any) };
    }
    if (errors.has(key)) {
      return { state: "rejected", payload: (errors.get(key): any) };
    }
    if (!pendingRequests.has(key)) {
      load(key, () => miss((param: any)));
    }
    return { state: "pending" };
  };

  const reset = key => {
    cache.delete(key);
    errors.delete(key);
    pendingRequests.delete(key);
    update(copy());
  };

  const resetWithParam = (prefix, param) => {
    const suffix = JSON.stringify(param);
    const key = String(prefix) + suffix;
    reset(key);
  };

  const copy = () => ({
    read,
    readWithParam,
    reset,
    resetWithParam
  });

  return copy();
};

export const createAsyncCacheContext = (): AsyncCacheContext => {
  const permanentGlobalCache = createNewCache(noop);

  const Ctx = createReactContext(permanentGlobalCache);

  class Provider extends React.Component<ProviderProps, ProviderState> {
    update = (value: AsyncCache) => this.setState({ value });

    state = { value: createNewCache(this.update) };

    render() {
      return (
        <Ctx.Provider value={this.state.value}>
          {this.props.children}
        </Ctx.Provider>
      );
    }
  }

  return {
    Provider,
    Consumer: Ctx.Consumer
  };
};
