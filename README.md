# Enabling Paymaster-Based Contracts

## Installation

```bash
yarn
Add private key as environment variable
cp .env.template .env
#Edit env to reflect your proper key
code .env 
```

## Usage
### Show all commands
```bash
yarn hardhat --help
```
(Note key commands: `deploy-paymaster` `fill-paymaster`, `deploy-collection`);

## Deploy the paymaster
**Precondition:** .env must contain a working wallet that will be the owner of paymaster
```bash
yarn hardhat deploy-paymaster
```

## Fill the paymaster
**Note:** The paymaster has to have money to operate properly. The `eth` argument is required to send money it can use for gas station relays 
```bash
yarn hardhat fill-paymaster --eth 0.1
``` 

## Deploy the collection
**Does not work yet**
```bash
yarn hardhat deploy-contract --symbol TEST --name "Test collection"
``` 

## TODO
1. Add mainnet relayhub and forwarders
2. Save paymaster address to storage-  probably inside this repo. 