import { Command } from '@knighthacks/dispatch';
import axios from 'axios';
import { ApplicationCommandOptionData, MessageEmbed } from 'discord.js';
import { sendPaginatedEmbeds } from 'discord.js-embed-pagination';
import humps from 'humps';

const URL = 'https://api.ucfgarages.com/';

interface GarageData {
  maxSpaces: number;
  name: string;
  percentFull: number;
  spacesFilled: number;
  spacesLeft: number;
}

async function getParkingData(
  garage?: string | null
): Promise<GarageData[] | null> {
  const params = garage
    ? {
        garages: garage,
      }
    : undefined;

  const response = await axios.get<{ garages: GarageData[] }>(URL, { params });

  if (!response) {
    return null;
  }

  const { data } = response;
  const { garages } = data;

  return humps.camelizeKeys(garages) as GarageData[];
}

function generateEmbed(data: GarageData): MessageEmbed {
  return new MessageEmbed()
    .setTitle('data.name')
    .addField('Percent Full', `${data.percentFull}%`)
    .addField('Spaces Left', data.spacesLeft.toString())
    .addField('Spaces Filled', data.spacesFilled.toString())
    .addField('Max Spaces', data.maxSpaces.toString());
}

const options: ApplicationCommandOptionData[] = [
  {
    name: 'garage',
    description: 'The specific garage to check.',
    type: 'STRING',
    choices: [
      {
        name: 'A',
        value: 'A',
      },
      {
        name: 'B',
        value: 'B',
      },
      {
        name: 'C',
        value: 'C',
      },
      {
        name: 'D',
        value: 'D',
      },
      {
        name: 'H',
        value: 'H',
      },
      {
        name: 'I',
        value: 'I',
      },
      {
        name: 'Libra',
        value: 'Libra',
      },
    ],
    required: false,
  },
];

const ParkingCommand: Command = {
  name: 'parking',
  description: 'Gets the parking status for UCF',
  options,
  async run({ interaction }) {
    await interaction.deferReply();

    const garage = interaction.options.getString('garage');

    const garageData = await getParkingData(garage);

    if (!garageData) {
      await interaction.followUp('Could not fetch parking data');
      return;
    }

    if (garage) {
      const [data] = garageData;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const embed = generateEmbed(data!);
      await interaction.followUp({ embeds: [embed] });
      return;
    }

    const embeds = garageData.map(generateEmbed);
    await sendPaginatedEmbeds(interaction, embeds);
  },
};

export default ParkingCommand;
