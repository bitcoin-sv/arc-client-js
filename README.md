# DEPRECATED ⛔️

This is no longer supported, please consider using [ts-sdk](https://github.com/bitcoin-sv/ts-sdk) instead.

# Bitcoin ARC TypeScript Library
This is a TypeScript library for the Bitcoin ARC project.

## Installation
```bash
npm install js-arc-client
```

## Usage

```javascript
import { ArcClient } from 'js-arc-client';

const arcClient = new ArcClient('https://api.taal.com/arc', {
  authorization: '<api-key>'
});

const txid = 'd4b0e1b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0';
const result = await arcClient.getTransactionStatus(txid);
```

or as commonjs module:

```javascript
const { ArcClient } = require('js-arc-client');

const arcClient = new ArcClient('https://api.taal.com/arc', {
  authorization: '<api-key>'
});

const txid = 'd4b0e1b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0';
const result = await arcClient.getTransactionStatus(txid);
```
