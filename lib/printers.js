const Discord = require('discord.js');
const constants = require('../lib/constants');
const axios = require('axios');
const https = require('https');
const humanizeDuration = require('humanize-duration');
const ldap = require('./ldap');

module.exports = {
	// NOTE: All methods assume message will NOT be ephemeral. You will need to add that yourself.
	async getMessage(printerID, detailed) {
		// Create beginning of embed
		const statusEmbed = await this.getEmbedTemplate(printerID);

		// Get the data of our printer
		const data = await this.getJob(printerID);

		// If no state, we assume the printer is borked
		if (!data) {
			console.log(error);
			statusEmbed
				.setTitle('⚠  OctoPrint Offline')
				.addField('Available', 'No', false)
				.addField(
					'More Information',
					`This printer's instance of OctoPrint is offline. This is usually indicative of a system failure. Please contact a <@&${constants.technicianRoleId}> and inform them of the issue.`,
					false
				);
			return { embeds: [statusEmbed] };
		}

		// Get the snapshot
		const snapshotBuffer = await this.getSnapshotBuffer(printerID);
		let snapshot;
		if (snapshotBuffer) {
			snapshot = new Discord.MessageAttachment(
				snapshotBuffer,
				'snapshot.jpg'
			);
			statusEmbed.setImage('attachment://snapshot.jpg');
		}

		// Determine availability using constants
		const printerState = constants.states.get(data.state.toLowerCase());
		if (printerState == 'available') {
			statusEmbed
				.setTitle('🟢  Printer Available')
				.addField('Available', 'Yes', true);
			if (detailed) statusEmbed.addField('State', data.state, true);
		} else if (printerState == 'busy') {
			statusEmbed.setTitle('🟡  Printer Busy');
			if (detailed && data.state == 'Printing') {
				// Find Discord ID if we can
				const ldapUser = await ldap.getUserByUsername(
					data.job.user,
					'discord'
				);
				let user = data.job.user;
				if (ldapUser.hasOwnProperty('discord')) {
					user = `<@${ldapUser.discord}>`;
				}

				// Add fields
				statusEmbed
					.addField('File Name', data.job.file.name, false)
					.addField('User', user, false)
					.addField(
						'Estimated Print Time',
						humanizeDuration(data.job.estimatedPrintTime * 1000, {
							round: true
						}),
						false
					);
			}
			if (data.state == 'Printing')
				statusEmbed.addField(
					'Available',
					`<t:${
						Math.round(Date.now() / 1000) +
						data.progress.printTimeLeft
					}:R>`,
					true
				);
			// If we aren't printing, we don't need an ETA
			else statusEmbed.addField('Available', `No`, true);
			if (detailed) {
				statusEmbed.addField('State', data.state, true);
				if (data.state == 'Printing')
					statusEmbed
						.addField(
							'Progress',
							`${Math.floor(data.progress.completion)}%`,
							true
						)
						.addField(
							'Started at',
							`<t:${
								Math.round(Date.now() / 1000) -
								data.progress.printTime
							}:f>`,
							false
						);
			}
			if (data.state == 'Printing')
				statusEmbed.addField(
					'Estimated to finish at',
					`<t:${
						Math.round(Date.now() / 1000) +
						data.progress.printTimeLeft
					}:f>`,
					false
				);
		} else {
			statusEmbed
				.setTitle('🔴  Printer Offline')
				.addField('Available', 'Most likely', true);
			if (detailed) statusEmbed.addField('State', data.state, true);
			statusEmbed.addField(
				'More Information',
				'Printers are sometimes shut down by users after they have completed their print. This is not indicative of a system failure or maintenance, but could be the case.',
				false
			);
		}

		// Resolve message options
		return {
			embeds: [statusEmbed],
			ephemeral: true,
			files: [snapshot]
		};
	},
	async getEmbedTemplate(printerID) {
		const printer = constants.printers[printerID];

		// Create beginning of embed
		const embed = new Discord.MessageEmbed()
			.setColor(printer.color)
			.setAuthor(printer.name + ' - ' + printer.model)
			.setThumbnail(printer.thumbnail)
			.setTimestamp();

		return embed;
	},
	async getJob(printerID) {
		const printer = constants.printers[printerID];

		// Try to grab printer job, resolve null if failed
		try {
			var { data } = await axios({
				method: 'get',
				url: `http${printer.ssl ? 's' : ''}://${printer.ip}/api/job`,
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + printer.apikey
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: false
				})
			});
			return data;
		} catch (error) {
			console.log(error);
			return null;
		}
	},
	async getSnapshotBuffer(printerID) {
		const printer = constants.printers[printerID];

		// Get snapshot data then resolve a buffer
		try {
			const { data: snapshotData } = await axios({
				method: 'get',
				url: `http${printer.ssl ? 's' : ''}://${
					printer.ip
				}/webcam/?action=snapshot`,
				httpsAgent: new https.Agent({
					rejectUnauthorized: false
				}),
				responseType: 'arraybuffer'
			});
			return Buffer.from(snapshotData, 'utf-8');
		} catch (error) {
			console.log(error);
			return null;
		}
	},
	async cancelJob(printerID) {
		const printer = constants.printers[printerID];

		// Try to cancel the print job, resolve null if failed
		try {
			var { data } = await axios({
				method: 'post',
				url: `http${printer.ssl ? 's' : ''}://${printer.ip}/api/job`,
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + printer.apikey
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: false
				}),
				data: {
					command: 'cancel'
				}
			});
			return data;
		} catch (error) {
			console.log(error);
			return null;
		}
	}
};
