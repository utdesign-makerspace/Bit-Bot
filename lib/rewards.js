const Discord = require('discord.js');
const { getStoreItems } = require('./store');
const constants = require('./constants');

module.exports = {
	async getSelectMenu() {
		const selectMenu = new Discord.MessageSelectMenu()
			.setCustomId('store')
			.setPlaceholder('Select a reward for more information');
		/*Object.keys(constants.rewards).forEach((key) => {
			const reward = constants.rewards[key];
			selectMenu.addOptions([
				{
					label: reward.name,
					description: `${reward.price} Bits`,
					value: key,
					emoji: reward.emoji ? reward.emoji : '🏆'
				}
			]);
		});*/
		const items = await getStoreItems();
		items.forEach((item, index) => {
			selectMenu.addOptions([
				{
					label: item.Title,
					description: item.Description,
					value: item.id,
					emoji: item.Emoji
				}
			]);
		});
		return selectMenu;
	}
};
