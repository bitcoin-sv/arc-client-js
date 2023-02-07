import {describe, expect, test} from '@jest/globals'
import fetchMock, {MockResponseInitFunction} from "jest-fetch-mock"

import {ArcClient} from "../src";
import {ClientOptions, TransactionStatus, TxStatus} from "../src/interface";
import {testFees, testUrl, tx1, tx1Raw, tx1RawBytes, tx2Raw, tx2RawBytes} from "./data";

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
    arcClient.SetDebug(true);
    expect(arcClient.client.debug).toBe(true);
  });
});

describe('GetFees', () => {
  const HttpUrl = `/fees`;
  test('get fees', async () => {
    fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testFees), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    const fees = await arcClient.GetFees();
    expect(fees).toEqual(testFees);
  });
});

describe('GetTransactionStatus', () => {
  const HttpUrl = `/tx/${tx1}`;

  test('txId is required', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.GetTransactionStatus(""))
      .rejects
      .toThrow('txId is required');
  });

  test('txId must be a valid hex string', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.GetTransactionStatus("this should fail"))
      .rejects
      .toThrow('txId must be a valid hex string');
  });

  test('txId must be 64 characters long', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.GetTransactionStatus("0123456789abcdef"))
      .rejects
      .toThrow('txId must be 64 characters long');
  });

  test('success', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(transactionStatus), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    const result = await arcClient.GetTransactionStatus(tx1);
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
    await expect(arcClient.PostTransaction(""))
      .rejects
      .toThrow('tx is required');
  });

  test('tx is not hex', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.PostTransaction("invalid hex string"))
      .rejects
      .toThrow('tx must be a valid hex string');
  });

  test('success hex', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(transactionStatus), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    const result = await arcClient.PostTransaction(tx1Raw);
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
    const result = await arcClient.PostTransaction(tx1RawBytes);
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
    await expect(arcClient.PostTransactions(null))
      .rejects
      .toThrow('txs cannot be empty');
  });

  test('txs cannot be empty', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.PostTransactions(Buffer.from([])))
      .rejects
      .toThrow('txs must contain at least one transaction');
  });

  test('txs is required', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.PostTransactions([]))
      .rejects
      .toThrow('txs must contain at least one transaction');
  });

  test('txs should be array', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    // @ts-ignore
    await expect(arcClient.PostTransactions("test"))
      .rejects
      .toThrow('txs must be an array of hex strings or a Buffer');
  });

  test('txs are not all in hex', async () => {
    const arcClient = new ArcClient(testUrl);
    // expect to throw an error
    await expect(arcClient.PostTransactions(["invalid hex string"]))
      .rejects
      .toThrow('tx must be a valid hex string');
  });

  test('success hex', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(transactionStatus), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    const result = await arcClient.PostTransactions([tx1Raw, tx2Raw]);
    expect(result).toEqual(transactionStatus);

    const call = resp.mock.calls[0];
    expect(call[0]).toBe(`${testUrl}v1${HttpUrl}`);
    expect(call[1]?.method).toBe("POST");
    expect(call[1]?.body).toBe(JSON.stringify([tx1Raw, tx2Raw]));
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
    });
  });

  test('success buffer', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(transactionStatus), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    const txBuffer = Buffer.from([...tx1RawBytes, ...tx2RawBytes])
    const result = await arcClient.PostTransactions(txBuffer);
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
  const HttpUrl = `/fees`;

  test('api key 1', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testFees), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    arcClient.SetApiKey("testApiKey");
    await arcClient.GetFees();

    const call = resp.mock.calls[0];
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": "testApiKey",
    });
  });

  test('api key 2', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testFees), HttpUrl));

    const arcClient = new ArcClient(testUrl, {
      apiKey: "testApiKey2",
    });
    await arcClient.GetFees();

    const call = resp.mock.calls[0];
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": "testApiKey2",
    });
  });

  test('bearer 1', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testFees), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    arcClient.SetBearer("testBearer");
    await arcClient.GetFees();

    const call = resp.mock.calls[0];
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "Bearer testBearer",
    });
  });

  test('bearer 2', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testFees), HttpUrl));

    const arcClient = new ArcClient(testUrl, {
      bearer: "testBearer2",
    });
    await arcClient.GetFees();

    const call = resp.mock.calls[0];
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "Bearer testBearer2",
    });
  });

  test('authorization 1', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testFees), HttpUrl));

    const arcClient = new ArcClient(testUrl);
    arcClient.SetAuthorization("SomeCustom authorization");
    await arcClient.GetFees();

    const call = resp.mock.calls[0];
    expect(call[1]?.headers).toEqual({
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "SomeCustom authorization",
    });
  });

  test('authorization 2', async () => {
    const resp = fetchMock.mockIf(/^.*$/, mockResponse(200, JSON.stringify(testFees), HttpUrl));

    const arcClient = new ArcClient(testUrl, {
      authorization: "SomeCustom authorization2",
    });
    await arcClient.GetFees();

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
