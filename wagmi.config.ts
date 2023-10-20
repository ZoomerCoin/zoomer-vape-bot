import { defineConfig, loadEnv, Config } from "@wagmi/cli";
import { actions, etherscan } from "@wagmi/cli/plugins";
import { mainnet } from "wagmi/chains";

export default defineConfig(() => {
  const env = loadEnv({
    mode: process.env.NODE_ENV,
    envDir: process.cwd(),
  })
  return {
    out: "src/generated.ts",
    plugins: [
      etherscan({
        apiKey: env.ETHERSCAN_API_KEY!,
        chainId: mainnet.id,
        contracts: [
          {
            name: "VapeGame",
            address: {
              [mainnet.id]: "0x0D6dC2a36C5c3EbD6F9B67Afd18b31C0074089E5",
            },
          },
        ],
      }),
      actions(),
    ],
  };
});
