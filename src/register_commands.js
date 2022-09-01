require('dotenv').config()

const { SlashCommandBuilder, Routes } = require('discord.js')
const { REST } = require('@discordjs/rest')

const commands = [
].map(command => command.toJSON())

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)
rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
    .then((data) => console.log(`Successfully registered ${data.length} commands`))
    .catch(console.error)