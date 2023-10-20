import { Bot, InlineKeyboard } from "grammy";
import { createConfig, configureChains, mainnet } from "@wagmi/core";
import { publicProvider } from "@wagmi/core/providers/public";
import { createClient } from "@supabase/supabase-js";
import { formatEther, parseEther } from "viem";

import { watchVapeGameEvent } from "./generated";
import { Database } from "./supabase";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { infuraProvider } from "wagmi/providers/infura";

const supabaseUrl = "https://cmomqjpdxxqtfrdwgzrh.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

const { publicClient, webSocketPublicClient } = configureChains(
  [mainnet],
  [
    publicProvider(),
    infuraProvider({ apiKey: process.env.INFURA_KEY! }),
    alchemyProvider({ apiKey: process.env.ALCHEMY_KEY_GOERLI! }),
    alchemyProvider({ apiKey: process.env.ALCHEMY_KEY_MAINNET! }),
  ]
);

createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
});

const bot = new Bot(process.env.BOT_TOKEN!); // <-- put your bot token between the "" (https://t.me/BotFather)

bot.command("subscribe", async (ctx) => {
  const { data, error } = await supabase
    .from("chats")
    .upsert({ chat_id: ctx.chat.id }, { onConflict: "chat_id" })
    .select();

  if (error) {
    console.log("error: ", error);
    await ctx.reply("Error subscribing to VapeGame events");
    return;
  }

  console.log("added to tracked chatIds: ", data);
  await ctx.reply("Subscribed to VapeGame events!!");
});

bot.command("unsubscribe", async (ctx) => {
  const { data, error } = await supabase
    .from("chats")
    .delete()
    .eq("chat_id", ctx.chat.id)
    .select();

  if (error) {
    console.log("error: ", error);
    await ctx.reply("Error unsubscribing to VapeGame events");
    return;
  }

  console.log("removed from tracked chatIds: ", data);
  await ctx.reply("Unsubscribed from VapeGame events");
});

bot.command("test", async (ctx) => {
  let { data: chats, error } = await supabase.from("chats").select();
  console.log("chats: ", chats);
  await bot.api.sendMessage(
    ctx.chat.id,
    "<b>🌬💨 Woah, Massive Vape Alert!* 💨🌬</b>\n" +
      "<b>👾 Zoomer is puffin' clouds! 👾</b>\n\n" +
      '👤 Hit Taken by: <a href="https://etherscan.io/address/' +
      '0x"' +
      ">" +
      "0x" +
      "</a>\n" +
      "💸 Next Hit Price: <b>" +
      formatEther(parseEther("1.23") ?? 0n) +
      " ETH</b> 💸\n" +
      "🔥 Bussin Oil Value: <b>" +
      formatEther(parseEther("1.24") ?? 0n) +
      " ETH</b> 🔥\n" +
      "🌟 Lucky Winner Value: <b>" +
      formatEther(parseEther("1.25") ?? 0n) +
      " ETH</b> 🌟\n" +
      "💧 Total Free Hits Pool: <b>" +
      formatEther(parseEther("1.26") ?? 0n) +
      " ETH</b> 💧\n\n" +
      "🔋 Battery reset, another 24 hours to go!\n",
    {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: new InlineKeyboard()
        .url("Cmon, Take a Hit!", "https://vape.zoomer.money")
        .row()
        .url(
          "Buy $ZOOMER",
          "https://app.uniswap.org/#/tokens/ethereum/0x0d505c03d30e65f6e9b4ef88855a47a89e4b7676"
        )
        .row()
        .url("WTF is $ZOOMER??", "https://zoomer.money"),
    }
  );
});

watchVapeGameEvent({ chainId: 1, eventName: "TookAHit" }, async (log) => {
  console.log("log with chain id and event name: ", log);
  const hitLog = log.find((log) => log.eventName === "TookAHit");
  if (!hitLog) {
    console.log("no hit log found");
    return;
  }

  let { data: chats, error } = await supabase.from("chats").select();
  console.log("chats: ", chats);

  if (error) {
    console.log("error: ", error);
    return;
  }

  if (!chats) {
    console.log("no chats found");
    return;
  }

  const proms = await Promise.allSettled(
    chats.map(
      async (chat) =>
        await bot.api.sendMessage(
          chat.chat_id,
          "<b>🌬💨 Woah, Massive Vape Alert!* 💨🌬</b>\n" +
            "<b>👾 Zoomer is puffin' clouds! 👾</b>\n\n" +
            '👤 Hit Taken by: <a href="https://etherscan.io/address/' +
            hitLog.args.user +
            '">' +
            hitLog.args.user +
            "</a>\n" +
            "💸 Next Hit Price: <b>" +
            formatEther(hitLog.args.nextHitPrice ?? 0n) +
            " ETH</b> 💸\n" +
            "🔥 Bussin Oil Value: <b>" +
            formatEther(hitLog.args.potValueETH ?? 0n) +
            " ETH</b> 🔥\n" +
            "🌟 Lucky Winner Value: <b>" +
            formatEther(hitLog.args.lottoValueETH ?? 0n) +
            " ETH</b> 🌟\n" +
            "💧 Total Free Hits Pool: <b>" +
            formatEther(hitLog.args.totalDividendsValueETH ?? 0n) +
            " ETH</b> 💧\n\n" +
            "🔋 Battery reset, another 24 hours to go!\n",
          {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: new InlineKeyboard()
              .url("Cmon, Take a Hit!", "https://zoomer-vape-ui.vercel.app")
              .row()
              .url(
                "Buy $ZOOMER",
                "https://app.uniswap.org/#/tokens/ethereum/0x0d505c03d30e65f6e9b4ef88855a47a89e4b7676"
              )
              .row()
              .url("WTF is $ZOOMER??", "https://zoomer.money"),
          }
        )
    )
  );
  proms.forEach((prom) => {
    if (prom.status === "rejected") {
      console.log("promise rejected", prom.reason);
    }
  });
});

bot.start();

bot.catch((err) => {
  console.log("BOT ERROR!!!: ", err);
});
