# Bitcoin ARC TypeScript Library
This is a TypeScript library for the Bitcoin ARC project.

## Installation
```bash
npm install @bitcoin-a/arc-client
```

## Usage

```javascript
import { ArcClient } from '@bitcoin-a/arc-client';

const arcClient = new ArcClient('https://api.taal.com/arc', {
  authorization: '<api-key>'
});

const txid = 'd4b0e1b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0';
const result = await arcClient.getTransactionStatus(txid);
```

or as commonjs module:

```javascript
const { ArcClient } = require('@bitcoin-a/arc-client').ArcClient;

const arcClient = new ArcClient('https://api.taal.com/arc', {
  authorization: '<api-key>'
});

const txid = 'd4b0e1b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0';
const result = await arcClient.getTransactionStatus(txid);
```
