const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const constants = require('../lib/constants');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('store')
		.setDescription('Opens the bit redemption store.'),
	ephemeral: true,
	execute: async (interaction) => {
		// Create the base store embed that tells the user what they can do.
		const storeEmbed = new Discord.MessageEmbed()
			.setColor('#c1393d')
			.setAuthor('UTDesign Makerspace', 'https://i.imgur.com/lSwBDLb.png')
			.setTitle('Welcome to the UTDesign Makerspace store!')
			.setDescription(
				'Browse the store by selecting an item from the select menu below. You will see a preview of the item, a purchase button, and a gift button.'
			)
			.addField(
				'💳  Redeeming Items',
				`As long as you have the bits, you can redeem any item available in the store. Click the "Redeem" button and you will receive more information on retrieving your item.`
			)
			.addField(
				'⏰  Redemption Limit',
				'You are limited to one redemption per 24 hours.'
			)
			.addField(
				'❌  No Returns, Real-World Currency, or Trades',
				'All redemptions are final. We do not accept real-world currency (ex. USD, Ethereum, etc.) or items (ex. filament, technology, etc.) in exchange for rewards.'
			);

		// Create a select menu with all the items in the store.
		const selectMenu = new Discord.MessageSelectMenu()
			.setCustomId('store')
			.setPlaceholder('Select a reward for more information');
		Object.keys(constants.rewards).forEach((key) => {
			const reward = constants.rewards[key];
			selectMenu.addOptions([
				{
					label: reward.name,
					description: `${reward.price} Bits`,
					value: key,
					emoji: reward.emoji ? reward.emoji : '🏆'
				}
			]);
		});
		const selectRow = new Discord.MessageActionRow().addComponents(
			selectMenu
		);

		// Post the store embed.
		interaction.editReply({
			embeds: [storeEmbed],
			components: [selectRow]
		});
	}
};
