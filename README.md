# AVM 7 - On Chain Randomness Demo
This demo consists of 2 parts,

1. A sample smart contract that calls the oracle contract and saves the random value it the global state.
2. An ABI call to the oracle contract to get a random value.

The oracle contract application deployed on TestNet is [110096026](https://testnet.algoexplorer.io/application/110096026).

## Node requirements
1. Purestake API account is required to communicate with TestNet.
2. An Algorand account with some Algos.

## How to run this demo
1. Install packages `yarn install`
2. Copy `.env.example` as `.env`. 
3. Update the Purestake API node credentials and a Algorand account.

### Deploy smart contract to store random value
1. Run `yarn run algob deploy --network purestake` to deploy the smart contract.
2. Run `yarn run algob run scripts/actions/random.js --networkpurestake` to save a random value from the oracle contract.

### Get a random value directly from the oracle contract
1. Run `node main.js`

## References

### How the oracle contract works
1. [https://github.com/ori-shem-tov/vrf-oracle/blob/beacon/DESIGN.md](https://github.com/ori-shem-tov/vrf-oracle/blob/beacon/DESIGN.md)

### Readings
1. [https://developer.algorand.org/articles/randomness-on-algorand](https://developer.algorand.org/articles/randomness-on-algorand)
2. [https://developer.algorand.org/articles/usage-and-best-practices-for-randomness-beacon/](https://developer.algorand.org/articles/usage-and-best-practices-for-randomness-beacon/)


