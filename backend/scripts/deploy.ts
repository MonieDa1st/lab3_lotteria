import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect();

  const publicClient = await viem.getPublicClient();

  /* ---------- VRF MOCK ---------- */

  const vrf = await viem.deployContract(
    "VRFMock",
    []
  );

  // Create subscription
  const txHash = await vrf.write.createSubscription();
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  const subId = (await vrf.read.getCurrentSubId()) as bigint;

  // Fund subscription
  await vrf.write.fundSubscription([
    subId,
    10n * 10n ** 18n,
  ]);

  /* ---------- LOTTERY ---------- */

  const keyHash =
    "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";

  const lottery = await viem.deployContract(
    "Lottery",
    [
      vrf.address,
      subId,
    ]
  );

  // Add consumer
  await vrf.write.addConsumer([subId, lottery.address]);

  console.log("Lottery deployed at:", lottery.address);
  console.log("VRF Mock deployed at:", vrf.address);
}

main().catch(console.error);
