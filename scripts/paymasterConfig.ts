import { HardhatUserConfig } from "hardhat/config";
export type PaymasterConfig<T = HardhatUserConfig> = T & {
  paymasterInfo: Record<
    string,
    { RELAY_HUB_ADDRESS: string; GSN_TRUSTED_FORWARDER_ADDRESS: string }
  >;
};
