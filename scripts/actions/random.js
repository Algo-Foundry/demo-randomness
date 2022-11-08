const { readAppGlobalState, convert } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");
require("dotenv").config();

async function run(runtimeEnv, deployer) {
  const master = deployer.accountsByName.get("master");
  // get app info
  const app = deployer.getApp("VRFApp");

  // oracle ID on testnet
  const oracleId = Number(process.env.ORACLE_ID);

  // get random value from oracle, valid block range will start 1504 blocks from current round (round down to number divisble by 8).
  const nodeStatus = await deployer.algodClient.status().do();
  const currentRound = nodeStatus["last-round"];
  const commitRound = (Math.round(currentRound / 8) * 8) - (188 * 8);

  const appCallArgs = [
    // app call
    convert.stringToBytes("Random"),
    // block round
    convert.uint64ToBigEndian(commitRound),
    // user seed, can be any string
    convert.stringToBytes("test"),
  ];

  await deployer.executeTx({
    type: types.TransactionType.CallApp,
    sign: types.SignType.SecretKey,
    fromAccount: master,
    appID: app.appID,
    payFlags: { totalFee: 1000 },
    appArgs: appCallArgs,
    foreignApps: [oracleId],
  });

  console.log(await readAppGlobalState(deployer, master.addr, app.appID));
}

module.exports = { default: run };
