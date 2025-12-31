import test from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

async function deployFixture() {
  const { viem } = await network.connect();
  const [deployer, user1, user2] = await viem.getWalletClients();

  const vrf = await viem.deployContract("VRFMock");
  await vrf.write.createSubscription();
  const subId = await vrf.read.getCurrentSubId();

  const lottery = await viem.deployContract("Lottery", [
    vrf.address,
    subId,
  ]);

  return { viem, vrf, lottery, deployer, user1, user2 };
}

// Test: Users can enter the Lottery pool
test("users can enter the pool", async () => {
  const { lottery, user1, user2 } = await deployFixture();

  await lottery.write.enter({
    account: user1.account,
    value: 10n,
  });

  await lottery.write.enter({
    account: user2.account,
    value: 20n,
  });

  const totalEth = await lottery.read.getTotalEth();
  assert.equal(totalEth, 30n);

  const players = await lottery.read.getPlayers();
  assert.equal(players.length, 2);
});


test("pickWinner triggers VRF and resets state", async () => {
  const { lottery, vrf, deployer, user1, user2 } = await deployFixture();

  await lottery.write.enter({
    account: user1.account,
    value: 10n,
  });

  await lottery.write.enter({
    account: user2.account,
    value: 20n,
  });

  await lottery.write.pickWinner({ account: deployer.account });

  // simulate VRF callback
  await vrf.write.fulfillRandomWords([1n, lottery.address]);

  const totalEth = await lottery.read.getTotalEth();
  assert.equal(totalEth, 0n);

  const players = await lottery.read.getPlayers();
  assert.equal(players.length, 0);

  const winner = await lottery.read.getRecentWinner();
  assert.ok(winner !== undefined);
});
