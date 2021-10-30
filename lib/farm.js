const Discord = require('discord.js');
const constants = require('./constants');
const printers = require('./printers');

module.exports = {
    // NOTE: All methods assume message will NOT be ephemeral. You will need to add that yourself.
    async getFarmEmbed() {
        return new Promise(async resolve => {
            // Create our base embed
            let statusEmbed = new Discord.MessageEmbed()
		    	.setColor('#c1393d')
		    	.setTitle(':information_source:  Printer Status')
		    	.setFooter('Printers are first come, first served')
		    	.setTimestamp();
            
            available = "";
            inUse = "";
            offline = "";

            const farmState = await this.getFarmState();
            const printerArray = constants.printers;

            // Compares each state and determines printer status to display
            for (i = 0; i < printerArray.length; i++) {
                printer = printerArray[i];
                printerText = `${printer.emoji} ${printer.model}\n`;

                if (!farmState[i])
                    offline += printerText;
                else if (farmState[i] == 'Printing')
                    inUse += printerText;
                else
                    available += printerText;
            }

            // Only add field if information for it exists
            if (available)
                statusEmbed.addField('Available', available, true);
            if (inUse)
                statusEmbed.addField('In Use', inUse, true);
            if (offline)
                statusEmbed.addField('Offline', offline, true);
            
            resolve({ embeds: [statusEmbed], ephemeral: true })
        });
    },
    async getFarmState() {
        return new Promise(async resolve => {
            // Creates an array of printer states. Indexes match those of constants.printers
            const printerArray = constants.printers;
            const stateArray = [];

            for (i = 0; i < printerArray.length; i++) {
                printerData = await printers.getJob(i);
                stateArray.push(printerData.state)
            }

            resolve(stateArray);
        });
    },
}