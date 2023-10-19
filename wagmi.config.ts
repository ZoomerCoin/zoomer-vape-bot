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
              [goerli.id]: "0x7Ff99542FBD8e7BF7Ee63ec5DD7b7F226D9a6EDD",
            },
          },
        ],
      }),
      actions(),
    ],
  };
});
