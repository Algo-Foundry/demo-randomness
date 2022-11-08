const algosdk = require("algosdk");
const fs = require("fs");
require("dotenv").config();

// settings for testnet & account
const creator = algosdk.mnemonicToSecretKey(process.env.MASTER_MNEMONIC);
const testnet_oracle_app_id = Number(process.env.ORACLE_ID);
const baseServer = process.env.ALGOD_ADDR_TESTNET;
const port = "";
const token = JSON.parse(process.env.ALGOD_TOKEN_TESTNET);

// read ABI file from contract using Beaker
const buff = fs.readFileSync("contract.json");

// use atc to call multiple times to get several seeds to compare
const atc = new algosdk.AtomicTransactionComposer();

// create client & abi
const algodClient = new algosdk.Algodv2(token, baseServer, port);
const contract = new algosdk.ABIContract(JSON.parse(buff.toString()));

// utility function for ABI to retrieve method
function getMethodByName(name) {
  const m = contract.methods.find((mt) => {
    return mt.name == name;
  });
  if (m === undefined) throw Error("Method undefined: " + name);
  return m;
}

(async () => {
  // Get suggested params from the client
  const sp = await algodClient.getTransactionParams().do();

  // get random value from oracle, valid block range will start 1504 blocks from current round (round down to number divisble by 8).
  const nodeStatus = await algodClient.status().do();
  const currentRound = nodeStatus["last-round"];
  const BLOCK_TO_USE = (Math.round(currentRound / 8) * 8) - (188 * 8);
  console.log("BLOCK_TO_USE:", BLOCK_TO_USE);

  const commonParams = {
    appID: testnet_oracle_app_id,
    sender: creator.addr,
    suggestedParams: sp,
    signer: algosdk.makeBasicAccountTransactionSigner(creator),
  };

  // create two user seeds for the same block
  let first_txn_args = new Uint8Array(Buffer.from("seed1"));
  let second_txn_args = new Uint8Array(Buffer.from("seed2"));

  // create two txns using same block but different seed - different seeds will produce different random numbers
  atc.addMethodCall({
    method: getMethodByName("get"),
    methodArgs: [BLOCK_TO_USE, first_txn_args],
    ...commonParams,
  });
  atc.addMethodCall({
    method: getMethodByName("get"),
    methodArgs: [BLOCK_TO_USE, second_txn_args],
    ...commonParams,
  });

  // check results
  const result = await atc.execute(algodClient, 10);
  for (const idx in result.methodResults) {
    // convert byte array to random number between 1 - 10
    let raw_value = result.methodResults[idx].returnValue;
    let buffer = Buffer.from(raw_value);
    let bigInt = Number(buffer.readBigUInt64BE(0));
    let number = Number(String(bigInt).charAt(0));

    console.log(`Txn ${idx}'s raw number:`, bigInt);
    console.log(`Txn ${idx}'s random number:`, number);
  }
})();
