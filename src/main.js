require('dotenv').config()

const { Client, GatewayIntentBits } = require('discord.js')

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.once('ready', () => {
    console.log('Online now')
})


client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction

    if (commandName === 'ping')
        await interaction.reply('Pong!')
})


client.login(process.env.TOKEN)