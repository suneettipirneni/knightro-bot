import dotenv from 'dotenv';
import { Client } from '@knighthacks/dispatch';

// Load env vars in
dotenv.config();

(async function main() {
  const client = new Client({
    intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_PRESENCES', 'GUILD_MEMBERS'],
  });

  await client.login(process.env.DISCORD_TOKEN);
})();
