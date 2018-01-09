# react-async-cache

Component pair which allows to load and reuse cached data across components.

Based on @sebmarkbage [Data Strategy idea](https://gist.github.com/sebmarkbage/4dc5400f1739617d0cf2d3468635a76b).

## Usage

_Note: children as function is used for better readability with nesting despite an opinion that semantically render prop is more correct_

```js
import * as React from "react";
import { createAsyncCacheContext } from "react-async-cache";

// initialise context
const usersCtx = createAsyncCacheContext();

const List = () => (
  <usersCtx.Consumer>
    {asyncCache => {
      // load and store data for next renders
      const users = asyncCache.read("users", () => fetch("/api/users"));
      const social = asyncCache.read("social", () => fetch("/api/social"));

      // check state of both requests
      if (users.state === "pending" || social.state === "pending") {
        return "Loading";
      }

      // use requested data when they are ready
      if (users.state === "resolved" && social.state === "resolved") {
        const twitterLink = social.payload.twitter;
        return users.payload.map(user => (
          <div>
            `${user.name}, Twitter: ${twitterLink}/${user.twitterId}`
          </div>
        ));
      }
      return null;
    }}
  </usersCtx.Consumer>
);

export const App = () => (
  <usersCtx.Provider>
    <List />
  </usersCtx.Provider>
);
```

## asyncCache api

* read(key, asyncFunction)

Returns current state of promise which is defined as

```js
type AsyncState =
  | { state: "pending" }
  | { state: "resolved", payload: mixed }
  | { state: "rejected", payload: Error };
```

* readWithParam(key, asyncFunction, parameter)

Same as read but allows additional param to distinct cache entries with the same key.

```js
const fetchItems = ({ filterBy }) =>
  fetch("/api/items", { body: { filterBy } });

<ctx.Consumer>
  {asyncCache => {
    const allItems = asyncCache.read("items", fetchItems, {
      filterBy: null
    });
    const currentUserItems = asyncCache.read("items", fetchItems, {
      filterBy: "some-id"
    });

    // render all items and filtered items
  }}
</ctx.Consumer>;
```

* reset(key)

Removes current state of entry with the key and refresh all renders to refetch data

```js
<ctx.Consumer>
  {asyncCache => {
    const name = asyncCache.read("name", () => fetch("/api/name"));
    return (
      <>
        {name}
        <input
          defaultValue={name}
          onChange={e => {
            fetch("api/update", { body: { name: e.target.value } });
          }}
        />
        <button onClick={() => asyncCache.reset("name")}>Update</button>
      </>
    );
  }}
</ctx.Consumer>
```

* resetWithParam(key, param)

Same as reset by accepts additional param similar to readWithParam

## How to memoize derived data?

Just using component lifecycles

```js
class Dumb extends React.Component {
  state = {
    data: this.props.items.filter(item => item.id === this.props.filter)
  };

  componentWillReceiveProps(nextProps) {
    const { items, filter } = nextProps;
    if (this.props.items !== items || this.props.filter !== filter) {
      this.setState({
        data: items.filter(item => item.id === filter)
      });
    }
  }

  render() {
    // render this.state.data
  }
}

const Container = () => (
  <ctx.Consumer>
    {asyncCache => (
      <Dumb
        items={asyncCache.read("items", fetchItems)}
        filter={asyncCache.read("filter", fetchFilter)}
      />
    )}
  </ctx.Consumer>
);
```
