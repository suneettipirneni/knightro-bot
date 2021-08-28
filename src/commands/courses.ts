import { Command } from '@knighthacks/dispatch';
import axios from 'axios';
import {
  ApplicationCommandOptionData,
  Message,
  MessageActionRow,
  MessageEmbed,
  MessageSelectMenu,
  SelectMenuInteraction,
} from 'discord.js';
import { embedColor } from '../colors';

const URL = (prefix: string, number: number, section?: string) => {
  return section
    ? `https://api.ucfcourses.com/detail/${prefix}${number}/sections/${section}`
    : `https://api.ucfcourses.com/detail/${prefix}${number}`;
};

interface Course {
  course: string;
  courseName: string;
  description: string;
  sections: Section[];
}

interface Section {
  id: string;
  begin: string;
  end: string;
  schedule: string;
  building: string;
  room: string;
  instructor: string;
}

const options: ApplicationCommandOptionData[] = [
  {
    name: 'prefix',
    description: 'The prefix of the course to lookup.',
    type: 'STRING',
    required: true,
  },
  {
    name: 'number',
    description: 'The number of the course to lookup.',
    type: 'INTEGER',
    required: true,
  },
];

interface CourseOptions {
  prefix: string;
  number: number;
}

interface CourseSectionOptions extends CourseOptions {
  section: string;
}

type Options = CourseOptions | CourseSectionOptions;

type CourseConditional<T extends Options> = T extends CourseSectionOptions
  ? Section
  : Course;

async function fetchCourse<T extends Options>(
  options: T
): Promise<CourseConditional<T> | undefined> {
  if ('section' in options) {
    const response = await axios
      .get<CourseConditional<T>>(
        URL(options.prefix, options.number, options.section)
      )
      .catch(() => null);
    return response?.data;
  }

  const response = await axios
    .get<CourseConditional<T>>(URL(options.prefix, options.number))
    .catch(() => null);
  console.log(URL(options.prefix, options.number));
  return response?.data;
}

function generateSectionEmbed(name: string, data: Section) {
  const embed = new MessageEmbed()
    .setTitle(name)
    .setColor(embedColor)
    .setAuthor(data.instructor)
    .addField('ID', data.id)
    .addField('Building', data.building)
    .addField('Room', data.room);

  if (data.schedule !== '') {
    embed.addField('Schedule', data.schedule);
  }

  return embed;
}

function generateCourseEmbed(data: Course) {
  return new MessageEmbed()
    .setTitle(data.courseName)
    .setColor(embedColor)
    .setDescription(data.description)
    .addField('Course', data.course);
}

const CoursesCommand: Command = {
  name: 'courses',
  description: 'Fetches courses from the UCF catalog',
  options,
  async run({ interaction }) {
    await interaction.deferReply();

    const prefix = interaction.options.getString('prefix', true);
    const number = interaction.options.getInteger('number', true);

    const course = await fetchCourse({ prefix, number });

    if (!course) {
      await interaction.followUp({
        content: 'Could not find that course.',
        ephemeral: true,
      });
      return;
    }

    const options = course.sections
      .map((section) => {
        return {
          label: section.id,
          description: `${section.instructor}`,
          value: section.id,
        };
      })
      .slice(0, 25);

    const selectMenu: MessageSelectMenu | undefined =
      options.length !== 0
        ? new MessageSelectMenu()
            .addOptions(options)
            .setCustomId('courseSelect')
            .setPlaceholder('Select Section')
        : undefined;

    const embed = generateCourseEmbed(course);
    const row = selectMenu
      ? new MessageActionRow().addComponents(selectMenu)
      : undefined;

    const message = (await interaction.followUp({
      embeds: [embed],
      components: row ? [row] : undefined,
      fetchReply: true,
    })) as Message;

    const collector =
      message.createMessageComponentCollector<SelectMenuInteraction>({
        componentType: 'SELECT_MENU',
      });

    collector.on('collect', async (i) => {
      await i.deferReply();

      const [section] = i.values;
      const fetchedSection = (await fetchCourse({
        prefix,
        number,
        section,
      })) as unknown as Section;
      const embed = generateSectionEmbed(`${prefix}${number}`, fetchedSection);

      await i.followUp({ embeds: [embed] });
    });
  },
};

export default CoursesCommand;
