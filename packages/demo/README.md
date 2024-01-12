# Demo

Basic `@iexec/dataprotector` demos using various environments and bundlers.

Each demo creates a dummy protected data.

## Usage

Build the `@iexec/dataprotector` project from the repository root directory

```sh
cd .. && npm ci && npm run build && cd demo
```

Pick a demo

```sh
# node typescript demo for example
cd node-ts
```

Install deps

```sh
npm i
```

Run the demo

```sh
npm start
```

**NB:** for browser demos

- you will need an ethereum wallet connected to [iexec sidechain](https://chainlist.org/chain/134)
- click the `TEST` button to start the protected data creation

**NB:** `create-react-app` demos use the `@iexec/dataprotector` package from npm
