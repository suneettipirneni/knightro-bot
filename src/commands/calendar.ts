import { Command } from '@knighthacks/dispatch';
import axios from 'axios';
import { MessageEmbed } from 'discord.js';
import { sendPaginatedEmbeds } from 'discord.js-embed-pagination';
import { embedColor } from '../colors';

const URL = 'https://calendar.ucf.edu/json/2021/fall';

export interface UCFCalendar {
  name: string;
  url: string;
  terms: Term[];
}

export interface Term {
  name: string;
  year: number;
  season: string;
  url: string;
  isPrimary: boolean;
  events: Event[];
}

export interface Event {
  uid: number;
  summary: string;
  description?: string | null;
  category: string;
  url?: string | null;
  summerSession?: null;
  isImportant: boolean;
  uniqueTag: string;
  dtstart: string;
  dtend: string;
  last_modified: string;
  tags?: string[] | null;
  directUrl: string;
}

async function getUCFEvents() {
  const events = await axios
    .get<UCFCalendar>(URL)
    .then((response) => response.data.terms[0]?.events)
    .catch(() => null);

  if (!events) {
    return null;
  }

  const date = new Date();

  // Filter out only academic dates
  return events
    .filter(
      (event) =>
        event.category === 'Academic Dates and Deadlines' &&
        new Date(event.dtstart).getTime() > date.getTime()
    )
    .slice(0, 10);
}

function generateEmbed(event: Event): MessageEmbed {
  const embed = new MessageEmbed()
    .setTitle(event.summary)
    .setColor(embedColor)
    .addField('Date', new Date(event.dtstart).toLocaleDateString())
    .setURL(event.directUrl);

  if (event.url) {
    embed.addField('URL', event.url);
  }

  if (event.tags) {
    const tags: string = event.tags.map((event) => `\`${event}\``).join(', ');
    embed.addField('Tags', tags);
  }

  return embed;
}

const CalendarCommand: Command = {
  name: 'calendar',
  description: 'Shows the upcoming events on the UCF calendar.',
  async run({ interaction }) {
    await interaction.deferReply();
    const events = await getUCFEvents();
    if (!events) {
      await interaction.followUp('Could not fetch UCF calendar.');
      return;
    }

    const embeds = events.map(generateEmbed);
    sendPaginatedEmbeds(interaction, embeds);
  },
};

export default CalendarCommand;
