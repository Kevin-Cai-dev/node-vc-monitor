module.exports = {
    name: 'about',
    description: 'Provide information about the functionality of the bot and the author',
    execute(message, args, callback) {
        const about = 'This bot was made by Kevin Cai. It alerts subscribed users whenever new activity is detected in voice channels. The code can be found at the following GitHub repository: https://github.com/Kevin-Cai-dev/node-vc-monitor'
        callback(undefined, about)
    }
}