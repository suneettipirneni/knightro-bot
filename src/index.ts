import dotenv from 'dotenv';
import { Client } from '@knighthacks/dispatch';
import path from 'path';

// Load env vars in
dotenv.config();

(async function main() {
  const client = new Client({
    intents: ['GUILDS', 'GUILD_MESSAGES'],
  });

  // Only use guild if in dev environment.
  if (process.env.NODE_ENV === 'development') {
    client.setGuildID(process.env.GUILD_ID ?? '');
  }

  // Register commands and login.
  await client.registerCommands(path.join(__dirname, 'commands'));
  await client.login(process.env.DISCORD_TOKEN);

  console.log('Client is now running...');
})();
