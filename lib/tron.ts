import "server-only";

async function sha256Bytes(data: Uint8Array): Promise<Uint8Array> {
  const bytes = Uint8Array.from(data);
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return new Uint8Array(digest);
}

function asHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Official Tether USDT contract on the TRON network (TRC20). */
export const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

const TRONSCAN = "https://apilist.tronscanapi.com";
const TRONGRID = "https://api.trongrid.io";

export const MIN_CONFIRMATIONS = parseInt(process.env.TRON_MIN_CONFIRMATIONS || "19", 10);
export const MAX_TX_AGE_MINUTES = parseInt(process.env.TRON_TX_MAX_AGE_MINUTES || "30", 10);
/** Small allowance for rounding differences (in USDT). */
const AMOUNT_TOLERANCE = 0.01;

export type VerifyCode =
  | "ACCEPTED"
  | "FORMAT"
  | "EXISTENCE"
  | "NOT_SUCCESS"
  | "CONTRACT"
  | "RECIPIENT"
  | "AMOUNT"
  | "CONFIRMATIONS"
  | "RECENCY"
  | "NETWORK";

export interface StrictVerifyResult {
  ok: boolean;
  code: VerifyCode;
  message: string;
  amountUsdt?: number;
  fromAddress?: string;
  confirmations?: number;
  txTimestamp?: number;
}

function fail(code: VerifyCode, message: string, extra: Partial<StrictVerifyResult> = {}): StrictVerifyResult {
  return { ok: false, code, message, ...extra };
}

export function normalizeTxHash(input: string): string {
  return input.trim().toLowerCase().replace(/^0x/, "");
}

export function isValidTxHashFormat(hash: string): boolean {
  return /^[0-9a-f]{64}$/.test(hash);
}

// ---------- Base58Check (TRON addresses) ----------

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Decodes a base58check TRON address to its 21-byte hex form (41 + 20 bytes). Throws on invalid input. */
export async function tronAddressToHex(address: string): Promise<string> {
  let num = 0n;
  for (const ch of address) {
    const idx = B58.indexOf(ch);
    if (idx === -1) throw new Error("Invalid base58 character");
    num = num * 58n + BigInt(idx);
  }
  let hex = num.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  let leading = 0;
  for (const ch of address) {
    if (ch === "1") leading++;
    else break;
  }
  const bytes = Buffer.concat([Buffer.alloc(leading), Buffer.from(hex, "hex")]);
  if (bytes.length !== 25) throw new Error("Invalid address length");
  const payload = bytes.subarray(0, 21);
  const checksum = bytes.subarray(21);
  const firstHash = await sha256Bytes(payload);
  const secondHash = await sha256Bytes(firstHash);
  const digest = secondHash.subarray(0, 4);
  if (!Buffer.from(digest).equals(Buffer.from(checksum))) {
    throw new Error("Invalid address checksum");
  }
  return asHex(new Uint8Array(payload));
}

async function fetchJson(url: string, init: RequestInit = {}, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = {
      accept: "application/json",
      ...(init.headers as Record<string, string> | undefined),
    };
    if (url.startsWith(TRONGRID) && process.env.TRONGRID_API_KEY) {
      headers["TRON-PRO-API-KEY"] = process.env.TRONGRID_API_KEY;
    }
    const res = await fetch(url, { ...init, headers, signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Primary: TronScan ----------

interface ScanTransfer {
  contract_address?: string;
  from_address?: string;
  to_address?: string;
  amount_str?: string;
  decimals?: number;
  symbol?: string;
}

async function verifyViaTronScan(
  txHash: string,
  expectedTo: string,
  minUsdt: number
): Promise<StrictVerifyResult> {
  const data = (await fetchJson(
    `${TRONSCAN}/api/transaction-info?hash=${txHash}`
  )) as Record<string, unknown>;

  // 1) Existence — a real on-chain lookup, empty result means unknown hash
  if (!data || !data.hash || (data.hash as string).toLowerCase() !== txHash) {
    return fail(
      "EXISTENCE",
      "Transaction not found on the TRON blockchain. Double-check the TxID — if you sent it seconds ago, wait a moment and try again."
    );
  }

  // 2) On-chain result must be SUCCESS and not reverted
  const contractRet = (data.contractRet as string) || "";
  if (data.revert === true || (contractRet && contractRet !== "SUCCESS")) {
    return fail("NOT_SUCCESS", "This transaction failed or was reverted on-chain — it did not transfer any funds.");
  }

  // 3) Must be an official USDT (TRC20) transfer
  const transfers: ScanTransfer[] = [];
  const t1 = data.trc20TransferInfo;
  const t2 = data.tokenTransferInfo;
  if (Array.isArray(t1)) transfers.push(...(t1 as ScanTransfer[]));
  if (t2 && typeof t2 === "object") transfers.push(t2 as ScanTransfer);
  const usdtTransfers = transfers.filter((t) => t.contract_address === USDT_CONTRACT);
  if (usdtTransfers.length === 0) {
    return fail(
      "CONTRACT",
      "This transaction is not an official USDT (TRC20) transfer. Make sure you sent Tether USDT on the TRON network."
    );
  }

  // 4) Recipient must exactly match our wallet (full literal match)
  const toUs = usdtTransfers.find((t) => t.to_address === expectedTo);
  if (!toUs) {
    return fail("RECIPIENT", "This USDT transfer was not sent to our payment address. Check the address and TxID.");
  }

  // 5) Amount ≥ required (small rounding tolerance)
  const decimals = Number(toUs.decimals ?? 6);
  const amount = Number(toUs.amount_str || 0) / Math.pow(10, decimals);
  if (amount + AMOUNT_TOLERANCE < minUsdt) {
    return fail(
      "AMOUNT",
      `Amount received (${amount} USDT) is less than the required ${minUsdt} USDT. Send the remaining difference as a new payment and submit that TxID instead.`,
      { amountUsdt: amount, fromAddress: toUs.from_address }
    );
  }

  // 6) Finality: ≥ MIN_CONFIRMATIONS (TronScan "confirmed" == solidified by the network)
  const confirmations = typeof data.confirmations === "number" ? (data.confirmations as number) : undefined;
  const confirmed = data.confirmed === true;
  if (confirmations !== undefined && confirmations < MIN_CONFIRMATIONS) {
    return fail(
      "CONFIRMATIONS",
      `Transaction has ${confirmations} of ${MIN_CONFIRMATIONS} required confirmations. TRON confirms in ~1 minute — try again shortly.`,
      { amountUsdt: amount, fromAddress: toUs.from_address, confirmations }
    );
  }
  if (confirmations === undefined && !confirmed) {
    return fail(
      "CONFIRMATIONS",
      `Transaction is not yet confirmed by the network (${MIN_CONFIRMATIONS} confirmations required). Try again in a minute.`,
      { amountUsdt: amount, fromAddress: toUs.from_address }
    );
  }

  // 7) Recency: executed within the allowed window
  const ts = Number(data.timestamp || 0);
  const ageMinutes = (Date.now() - ts) / 60000;
  if (!ts || ageMinutes > MAX_TX_AGE_MINUTES) {
    return fail(
      "RECENCY",
      `This transaction is older than ${MAX_TX_AGE_MINUTES} minutes. Payments must be sent during checkout. If you already paid for this listing, contact support.`,
      { amountUsdt: amount, fromAddress: toUs.from_address, txTimestamp: ts }
    );
  }

  return {
    ok: true,
    code: "ACCEPTED",
    message: "Verified on-chain via TronScan.",
    amountUsdt: amount,
    fromAddress: toUs.from_address,
    confirmations: confirmations ?? MIN_CONFIRMATIONS,
    txTimestamp: ts,
  };
}

// ---------- Fallback: TronGrid ----------

async function verifyViaTronGrid(
  txHash: string,
  expectedTo: string,
  minUsdt: number
): Promise<StrictVerifyResult> {
  const tx = (await fetchJson(`${TRONGRID}/wallet/gettransactionbyid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: txHash }),
  })) as Record<string, any>;

  if (!tx || !tx.txID) {
    return fail(
      "EXISTENCE",
      "Transaction not found on the TRON blockchain. Double-check the TxID — if you sent it seconds ago, wait a moment and try again."
    );
  }

  const ret = tx.ret?.[0]?.contractRet;
  if (ret !== "SUCCESS") {
    return fail("NOT_SUCCESS", "This transaction failed or was reverted on-chain — it did not transfer any funds.");
  }

  const contract = tx.raw_data?.contract?.[0];
  const value = contract?.parameter?.value || {};
  const usdtHex = await tronAddressToHex(USDT_CONTRACT);
  if (contract?.type !== "TriggerSmartContract" || (value.contract_address || "").toLowerCase() !== usdtHex) {
    return fail(
      "CONTRACT",
      "This transaction is not an official USDT (TRC20) transfer. Make sure you sent Tether USDT on the TRON network."
    );
  }

  // decode transfer(address,uint256) calldata
  const dataHex: string = (value.data || "").toLowerCase();
  if (!dataHex.startsWith("a9059cbb") || dataHex.length < 8 + 64 + 64) {
    return fail("CONTRACT", "This transaction is not a direct USDT transfer (unsupported contract call).");
  }
  const toHex = "41" + dataHex.slice(8 + 24, 8 + 64);
  const amountRaw = BigInt("0x" + dataHex.slice(8 + 64, 8 + 128));
  const expectedHex = await tronAddressToHex(expectedTo);
  if (toHex !== expectedHex) {
    return fail("RECIPIENT", "This USDT transfer was not sent to our payment address. Check the address and TxID.");
  }

  const amount = Number(amountRaw) / 1e6;
  if (amount + AMOUNT_TOLERANCE < minUsdt) {
    return fail(
      "AMOUNT",
      `Amount received (${amount} USDT) is less than the required ${minUsdt} USDT. Send the remaining difference as a new payment and submit that TxID instead.`,
      { amountUsdt: amount }
    );
  }

  const info = (await fetchJson(`${TRONGRID}/wallet/gettransactioninfobyid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: txHash }),
  })) as Record<string, any>;
  const txBlock = Number(info?.blockNumber || 0);
  if (!txBlock) {
    return fail("CONFIRMATIONS", `Transaction is not yet included in a block (${MIN_CONFIRMATIONS} confirmations required). Try again in a minute.`, { amountUsdt: amount });
  }

  const now = (await fetchJson(`${TRONGRID}/wallet/getnowblock`, { method: "POST" })) as Record<string, any>;
  const head = Number(now?.block_header?.raw_data?.number || 0);
  const confirmations = head > 0 ? head - txBlock + 1 : 0;
  if (confirmations < MIN_CONFIRMATIONS) {
    return fail(
      "CONFIRMATIONS",
      `Transaction has ${confirmations} of ${MIN_CONFIRMATIONS} required confirmations. TRON confirms in ~1 minute — try again shortly.`,
      { amountUsdt: amount, confirmations }
    );
  }

  const ts = Number(info?.blockTimeStamp || tx.raw_data?.timestamp || 0);
  const ageMinutes = (Date.now() - ts) / 60000;
  if (!ts || ageMinutes > MAX_TX_AGE_MINUTES) {
    return fail(
      "RECENCY",
      `This transaction is older than ${MAX_TX_AGE_MINUTES} minutes. Payments must be sent during checkout. If you already paid for this listing, contact support.`,
      { amountUsdt: amount, txTimestamp: ts }
    );
  }

  return {
    ok: true,
    code: "ACCEPTED",
    message: "Verified on-chain via TronGrid.",
    amountUsdt: amount,
    confirmations,
    txTimestamp: ts,
  };
}

/**
 * Strict server-side USDT (TRC20) verification.
 * Primary source: TronScan API. Fallback: TronGrid API.
 * Enforces: existence → on-chain success → official USDT contract → exact
 * recipient → amount → ≥19 confirmations → ≤30-minute recency.
 */
export async function verifyUsdtStrict(opts: {
  txHash: string;
  toAddress: string;
  minUsdt: number;
}): Promise<StrictVerifyResult> {
  const txHash = normalizeTxHash(opts.txHash);
  if (!isValidTxHashFormat(txHash)) {
    return fail("FORMAT" as VerifyCode, "Invalid transaction hash — expected 64 hexadecimal characters (copy the TxID from your wallet).");
  }
  if (!opts.toAddress) {
    return fail("NETWORK", "USDT payments are not configured on this platform.");
  }

  try {
    return await verifyViaTronScan(txHash, opts.toAddress, opts.minUsdt);
  } catch (err) {
    console.warn("[tron] TronScan unavailable, falling back to TronGrid:", (err as Error).message);
  }
  try {
    return await verifyViaTronGrid(txHash, opts.toAddress, opts.minUsdt);
  } catch (err) {
    console.error("[tron] TronGrid also failed:", (err as Error).message);
    return fail("NETWORK", "Could not reach the TRON network to verify your transaction. Please try again in a moment.");
  }
}
