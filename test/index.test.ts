import {describe, expect, test} from '@jest/globals'
import fetchMock, {MockResponseInitFunction} from "jest-fetch-mock"
jest.setMock("cross-fetch", fetchMock);

import {ArcClient} from "../src";
import {ClientOptions, TransactionStatus, TxStatus} from "../src/interface";
import {testPolicy, testUrl, tx1, tx1Raw, tx1RawBytes, tx2Raw, tx2RawBytes} from "./data";

const transactionStatus: TransactionStatus = {
  txid: tx1,
  txStatus: TxStatus.ANNOUNCED_TO_NETWORK,
  blockHeight: 0,
  blockHash: "",
  timestamp: "2021-01-01T00:00:00.000Z",
}

describe('ArcClient class', () => {
  test('instantiate with no server url', () => {
    // expect to throw an error
    expect(() => {
      const arcClient = new ArcClient("");
    }).toThrow();
  });

  test('instantiate', () => {
    const options: ClientOptions = {}
    const arcClient = new ArcClient(testUrl, options);
    expect(arcClient).toBeInstanceOf(ArcClient);
    expect(arcClient.version).toBe("v1");
    expect(arcClient.client.debug).toBe(undefined);
  });

  test('instantiate with options', () => {
    const options: ClientOptions = {
      debug: true,
      version: "v2",
    }
    const arcClient = new ArcClient(testUrl, options);
    expect(arcClient).toBeInstanceOf(ArcClient);
    expect(arcClient.version).toBe("v2");
    expect(arcClient.client.debug).toBe(true);
  });

  test('instantiate set debug', () => {
    const arcClient = new ArcClient(testUrl);
    expect(arcClient).toBeInstanceOf(ArcClient);
    expect(arcClient.client.debug).toBe(undefined);
    arcClient.setDebug(true);
    expect(arcClient.client.debug).toBe(true);
  });
});

describe('GetPolicy', () => {
  const HttpUrl = `/policy`;
  test('get policy', async () => {
    fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testPolicy), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    const policy = await arcClient.getPolicy();
    expect(policy).toEqual(testPolicy);
  });
});

describe('GetTransactionStatus', () => {
  const HttpUrl = `/tx/${tx1}`;

  test('txId is required', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.getTransactionStatus(""))
      .rejects
      .toThrow('txId is required');
  });

  test('txId must be a valid hex string', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.getTransactionStatus("this should fail"))
      .rejects
      .toThrow('txId must be a valid hex string');
  });

  test('txId must be 64 characters long', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.getTransactionStatus("0123456789abcdef"))
      .rejects
      .toThrow('txId must be 64 characters long');
  });

  test('success', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(transactionStatus), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    const result = await arcClient.getTransactionStatus(tx1);
    expect(result).toEqual(transactionStatus);

    const call = resp.mock.calls[0];
    expect(call[0]).toBe(`${testUrl}v1${HttpUrl}`);
    expect(call[1]?.method).toBe("GET");
    expect(call[1]?.body).toBeUndefined();
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
    });
  });
});

describe('PostTransaction', () => {
  const HttpUrl = `/tx`;

  test('tx is required', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.postTransaction(""))
      .rejects
      .toThrow('tx is required');
  });

  test('tx is not hex', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.postTransaction("invalid hex string"))
      .rejects
      .toThrow('tx must be a valid hex string');
  });

  test('success hex', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(transactionStatus), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    const result = await arcClient.postTransaction(tx1Raw);
    expect(result).toEqual(transactionStatus);

    const call = resp.mock.calls[0];
    expect(call[0]).toBe(`${testUrl}v1${HttpUrl}`);
    expect(call[1]?.method).toBe("POST");
    expect(call[1]?.body).toBe(tx1Raw);
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "text/plain",
    });
  });

  test('success buffer', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(transactionStatus), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    const result = await arcClient.postTransaction(tx1RawBytes);
    expect(result).toEqual(transactionStatus);

    const call = resp.mock.calls[0];
    expect(call[0]).toBe(`${testUrl}v1${HttpUrl}`);
    expect(call[1]?.method).toBe("POST");
    expect(call[1]?.body).toBeInstanceOf(Buffer);
    expect(call[1]?.body).toEqual(tx1RawBytes);
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/octet-stream",
    });
  });
});


describe('PostTransactions', () => {
  const HttpUrl = `/txs`;

  test('txs cannot be empty', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    // @ts-ignore
    await expect(arcClient.postTransactions(null))
      .rejects
      .toThrow('txs cannot be empty');
  });

  test('txs cannot be empty', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.postTransactions(Buffer.from([])))
      .rejects
      .toThrow('txs must contain at least one transaction');
  });

  test('txs is required', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.postTransactions([]))
      .rejects
      .toThrow('txs must contain at least one transaction');
  });

  test('txs should be array', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    // @ts-ignore
    await expect(arcClient.postTransactions("test"))
      .rejects
      .toThrow('txs must be an array of hex strings, a json array of format [{\"rawTx\": \"<hex string\"}] or a Buffer');
  });

  test('success json', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(transactionStatus), HttpUrl));

    const arcClient = new ArcClient(testUrl);

    const result = await arcClient.postTransactions([{"rawTx": tx1Raw}, {"rawTx": tx2Raw}]);
    expect(result).toEqual(transactionStatus);

    const call = resp.mock.calls[0];
    expect(call[0]).toBe(`${testUrl}v1${HttpUrl}`);
    expect(call[1]?.method).toBe("POST");
    expect(call[1]?.body).toBe(JSON.stringify([{"rawTx": tx1Raw}, {"rawTx": tx2Raw}]));
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
    });
  });

  test('json txs are not all in hex', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.postTransactions([{"rawTx": "invalid hex string"}, {"rawTx": tx2Raw}]))
      .rejects
      .toThrow('tx must be a valid hex string');
  });

  test('txs are not all in hex', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.postTransactions(["invalid hex string"]))
      .rejects
      .toThrow('tx must be a valid hex string');
  });

  test('success hex', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(transactionStatus), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    const result = await arcClient.postTransactions([tx1Raw, tx2Raw]);
    expect(result).toEqual(transactionStatus);

    const call = resp.mock.calls[0];
    expect(call[0]).toBe(`${testUrl}v1${HttpUrl}`);
    expect(call[1]?.method).toBe("POST");
    expect(call[1]?.body).toBe(tx1Raw + "\n" + tx2Raw);
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "text/plain",
    });
  });

  test('success buffer', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(transactionStatus), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    const txBuffer = Buffer.from([...tx1RawBytes, ...tx2RawBytes])
    const result = await arcClient.postTransactions(txBuffer);
    expect(result).toEqual(transactionStatus);

    const call = resp.mock.calls[0];
    expect(call[0]).toBe(`${testUrl}v1${HttpUrl}`);
    expect(call[1]?.method).toBe("POST");
    expect(call[1]?.body).toBeInstanceOf(Buffer);
    expect(call[1]?.body).toEqual(txBuffer);
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/octet-stream",
    });
  });
});

describe('authorization', () => {
  const HttpUrl = `/policy`;

  test('api key 1', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testPolicy), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    arcClient.setAuthorization("testApiKey");
    await arcClient.getPolicy();

    const call = resp.mock.calls[0];
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "testApiKey",
    });
  });

  test('api key 2', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testPolicy), HttpUrl));

    const arcClient = new ArcClient(testUrl, {
      authorization: "testApiKey2",
    });
    await arcClient.getPolicy();

    const call = resp.mock.calls[0];
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "testApiKey2",
    });
  });

  test('bearer 1', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testPolicy), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    arcClient.setAuthorization("testBearer");
    await arcClient.getPolicy();

    const call = resp.mock.calls[0];
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "testBearer",
    });
  });

  test('bearer 2', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testPolicy), HttpUrl));

    const arcClient = new ArcClient(testUrl, {
      authorization: "testBearer2",
    });
    await arcClient.getPolicy();

    const call = resp.mock.calls[0];
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "testBearer2",
    });
  });

  test('authorization 1', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testPolicy), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    arcClient.setAuthorization("SomeCustom authorization");
    await arcClient.getPolicy();

    const call = resp.mock.calls[0];
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "SomeCustom authorization",
    });
  });

  test('authorization 2', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testPolicy), HttpUrl));

    const arcClient = new ArcClient(testUrl, {
      authorization: "SomeCustom authorization2",
    });
    await arcClient.getPolicy();

    const call = resp.mock.calls[0];
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "SomeCustom authorization2",
    });
  });
});

const mockResponse = function (responseCode: number, response: string, expectedHttpUrl: string): MockResponseInitFunction {
  return (req: any) => {
    const url = req.url.valueOf();
    const expectedUrl = `${testUrl}v1${expectedHttpUrl}`;

    if (url === expectedUrl && responseCode < 400) {
      return new Promise(r => r(response));
    } else {
      if (responseCode >= 400) {
        return new Promise((rr, r) => r({status: responseCode}));
      } else {
        return new Promise((rr, r) => r({status: 404}));
      }
    }
  };
}
