require('dotenv').config()

const { Routes } = require('discord.js')
const { REST } = require('@discordjs/rest')

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

process.argv.slice(2).forEach((value) => {
    rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, value))
    .then(() => console.log('Deleted'))
    .catch(console.error)
})