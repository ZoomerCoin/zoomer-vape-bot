import { defineConfig, loadEnv, Config } from "@wagmi/cli";
import { actions, etherscan } from "@wagmi/cli/plugins";
import { goerli } from "wagmi/chains";

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
        chainId: goerli.id,
        contracts: [
          {
            name: "VapeGame",
            address: {
              [goerli.id]: "0x699315bc4dCA38947AD489f4748a172Dba9A16Ff",
            },
          },
        ],
      }),
      actions(),
    ],
  };
});
