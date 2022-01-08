import { HardhatUserConfig } from "hardhat/config";

export type PaymasterConfig<T = HardhatUserConfig> = T & {
  // allow to save paymaster/GSN data inside hardhat config
  // TODO: hardhat extension?
  paymasterInfo: Record<
    string,
    { RELAY_HUB_ADDRESS: string; GSN_TRUSTED_FORWARDER_ADDRESS: string }
  >;
};
