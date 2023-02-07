# Bitcoin ARC TypeScript Library
This is a TypeScript library for the Bitcoin ARC project.

## Installation
```bash
npm install js-arc-client
```

## Usage
```typescript
import { ArcClient } from 'js-arc-client';

const arcClient = new ArcClient({
  host: 'localhost',
  port: 8080,
  apiKey: '<api-key>'
});

const txid = 'd4b0e1b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0c0b0';
const result = await arcClient.getTransactionStatus(txid);
```
