# node-vc-monitor

This project aims to provide a Discord bot which alerts subscribed users whenever new activity is detected in the specified voice channels.

Originally designed in python using the discord.py library, I opted to redevelop the bot using Node.js and Discord.js to hopefully incorporate both front-end and back-end features.

Currently, I use a JSON file to store servers, voice channels and user
subscriptions. It is currently hosted by me on Heroku. This is a self-project aimed to both provide a useful service as well as
allowing me to learn new tools. 

WARNING: This bot has not been fully tested and may contain bugs. If you ever
want to use it, be careful. Performance across multiple servers has not been
tested very thoroughly (since I don't have many servers to test it on) and may
produce unexpected results. It utilises privileged intents and so its capability
is limited to < 100 servers before needing to be verified/whitelisted.

You can access the bot [here](https://discord.com/api/oauth2/authorize?client_id=859728389883953163&permissions=142480&scope=bot).

Credit to the [Discord.js Guide](https://discordjs.guide/ "Discord.js Guide
Homepage") and [Discord.js documentation](https://discord.js.org/#/docs/main/stable/general/welcome
"Discord.js documentation") for providing guides to aid in the development of the bot.

## Future Additions:
- Integrate a proper database system to store server, channel and user information (MongoDB, PostgreSQL, etc, I'm still learning)
- Find and learn a hosting platform for the bot to run, most likely AWS
- Add more commands, suggestions would be appreciated!
- Design a simple front-end page to monitor the status of the bot