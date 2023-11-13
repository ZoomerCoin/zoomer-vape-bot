import { Bot, InlineKeyboard } from "grammy";
import { createConfig, configureChains, mainnet } from "@wagmi/core";
import { publicProvider } from "@wagmi/core/providers/public";
import { createClient } from "@supabase/supabase-js";
import { formatEther, parseEther } from "viem";

import { readVapeGame, watchVapeGameEvent } from "./generated";
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

bot.command("vapestats", async (ctx) => {
  const [
    minInvest,
    potValueETH,
    lottoValueETH,
    totalDividendsValueETH,
    lastPurchasedTime,
    lastPurchasedAddress,
    gameTime,
    numHits,
  ] = await Promise.all([
    readVapeGame({ functionName: "minInvest" }),
    readVapeGame({ functionName: "potValueETH" }),
    readVapeGame({ functionName: "lottoValueETH" }),
    readVapeGame({ functionName: "totalDividendsValueETH" }),
    readVapeGame({ functionName: "lastPurchasedTime" }),
    readVapeGame({ functionName: "lastPurchasedAddress" }),
    readVapeGame({ functionName: "GAME_TIME" }),
    readVapeGame({ functionName: "numHits" }),
  ]);
  console.log("stats command from chat: ", ctx.chat.id);
  console.log("lastPurchasedTime: ", lastPurchasedTime);
  console.log("gameTime: ", gameTime);
  // const timeLeft = 0;
  const timeLeft =
    Number(lastPurchasedTime.toString()) +
    Number(gameTime.toString()) -
    Date.now() / 1000;
  const date = new Date(0);
  date.setSeconds(Number(timeLeft.toString()));
  const timeString = date.toISOString().substring(11, 19);
  const [hours, minutes, seconds] = timeString.split(":");

  await bot.api.sendMessage(
    ctx.chat.id,
    "<b>🌬💨 Ong we bussin frfr! 💨🌬</b>\n" +
      '👤 Last Hit Taken by: <a href="https://etherscan.io/address/' +
      lastPurchasedAddress +
      '">' +
      lastPurchasedAddress +
      "</a>\n" +
      "🔢 Number of Hits Taken: <b>" +
      (numHits ?? 0n) +
      "</b> 🔢\n" +
      "💸 Next Hit Price: <b>" +
      formatEther(minInvest ?? 0n) +
      " ETH</b> 💸\n" +
      "🔥 Bussin Oil Value: <b>" +
      formatEther(potValueETH ?? 0n) +
      " ETH</b> 🔥\n" +
      "🌟 Lucky Winner Value: <b>" +
      formatEther(lottoValueETH ?? 0n) +
      " ETH</b> 🌟\n" +
      "💧 Total Free Hits Pool: <b>" +
      formatEther(totalDividendsValueETH ?? 0n) +
      " ETH</b> 💧\n\n" +
      "🔋 Battery dies in <b>" +
      hours +
      " hours " +
      minutes +
      " minutes " +
      seconds +
      " seconds!</b>\n",
    {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: new InlineKeyboard()
        .url("Cmon, Take a Hit!", "https://vape.zoomer.money")
        .url(
          "Share to X",
          `https://twitter.com/intent/tweet?text=%F0%9F%92%A8%20I%20took%20a%20fatty%20%24VAPE%20hit%20%F0%9F%92%A8%0A%0AIf%20nobody%20hits%20in%20${
            +hours > 0 ? hours : minutes
          }%20${
            +hours > 0 ? "hours" : "minutes"
          }%20I%20will%20win%20${formatEther(
            potValueETH ?? 0n
          )}%20ETH%20and%20an%20other%20lucky%20random%20winner%20will%20win%20${formatEther(
            lottoValueETH ?? 0n
          )}%20ETH.%0A%0AI%20will%20also%20gain%20dividends%20for%20hits%20taken%20after%20me.%0A%0A%2FTAKE_THE_HIT%0A%0Azoomer.vape.money%0A%0A%24ZOOMER%20`
        )
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

  const [gameTime, numHits] = await Promise.all([
    readVapeGame({ functionName: "GAME_TIME" }),
    readVapeGame({ functionName: "numHits" }),
  ]);

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
            "🔢 Number of Hits Taken: <b>" +
            (numHits ?? 0n) +
            "</b> 🔢\n" +
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
            "🔋 Battery reset, another" +
            (gameTime / 3600n).toString() +
            "hours to go!\n",
          {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: new InlineKeyboard()
              .url("Cmon, Take a Hit!", "https://zoomer-vape-ui.vercel.app")
              .url(
                "Share to X",
                `https://twitter.com/intent/tweet?text=%F0%9F%92%A8%20I%20took%20a%20fatty%20%24VAPE%20hit%20for%20${formatEther(
                  hitLog.args.amount ?? 0n
                )}%20ETH%20%F0%9F%92%A8%0A%0AIf%20nobody%20hits%20in%2012%20hours%20I%20will%20win%20${formatEther(
                  hitLog.args.potValueETH ?? 0n
                )}%20ETH%20and%20an%20other%20lucky%20random%20winner%20will%20win%20${formatEther(
                  hitLog.args.lottoValueETH ?? 0n
                )}%20ETH.%0A%0AI%20will%20also%20gain%20dividends%20for%20hits%20taken%20after%20me.%0A%0A%2FTAKE_THE_HIT%0A%0Azoomer.vape.money%0A%0A%24ZOOMER%20`
              )
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

bot.start({ onStart: () => console.log("Bot started") });

bot.catch((err) => {
  console.log("BOT ERROR!!!: ", err);
});
