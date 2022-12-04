const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require("../compile");

let address;
let lottery;

before(async () => {
  address = await web3.eth.getAccounts();

  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({
      data: bytecode,
    })
    .send({
      from: address[1],
      gas: "1000000",
    });
});

describe("deploys a contract", () => {
  it("test deploy", () => {
    assert.ok(lottery.options.address);
  });

  //   it("test enter contract", async () => {
  //     await lottery.methods
  //       .enter()
  //       .send({ from: address[0], value: web3.utils.toWei("0.02", "ether") });

  //     const players = await lottery.methods
  //       .getPlayers()
  //       .call({ from: address[0] });

  //     assert.equal(address[0], players[0]);
  //     assert.equal(1, players.length);
  //   });

  it("allows multiple accounts to enter", async () => {
    await lottery.methods.enter().send({
      from: address[0],
      value: web3.utils.toWei("0.1", "ether"),
    });

    await lottery.methods.enter().send({
      from: address[1],
      value: web3.utils.toWei("0.2", "ether"),
    });

    await lottery.methods.enter().send({
      from: address[2],
      value: web3.utils.toWei("0.5", "ether"),
    });

    const players = await lottery.methods
      .getPlayers()
      .call({ from: address[0] });

    assert.equal(3, players.length);
    // console.log("Players: ", players);
  });

  it("requires a minimum amount of ether to enter", async () => {
    try {
      await lottery.methods.enter().send({
        from: address[0],
        value: 0,
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("only manager can call pickWinner", async () => {
    const manager = await lottery.methods.manager().call({ from: address[0] });
    console.log("manager: ", manager);

    console.log("caller: ", address[1]);

    try {
      await lottery.methods.pickWinner().send({
        from: address[1],
      });
      assert(false);
    } catch (e) {
      assert(e);
    }
  });

  it("send money and reset players", async () => {
    // await lottery.methods.deploy

    await lottery.methods.enter().send({
      from: address[1],
      value: web3.utils.toWei("2", "ether"),
    });

    const init = await web3.eth.getBalance(address[1]);

    await lottery.methods.pickWinner().send({
      from: address[1],
    });

    const final = await web3.eth.getBalance(address[1]);

    const diff = final - init;
    // console.log("diff: ", diff);
    assert(diff > web3.utils.toWei("1.8", "ether"));
  });
});
