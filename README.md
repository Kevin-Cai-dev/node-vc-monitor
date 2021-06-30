# node-vc-monitor

This project aims to provide a Discord bot which alerts subscribed users whenever new activity is detected in the specified voice channels.

Originally designed in python using the discord.py library, I opted to redevelop the bot using Node.js and Discord.js to hopefully incorporate both front-end and back-end features.

Currently, I use a JSON file to store servers, voice channels and user
subscriptions. I also do not have the bot hosted outside of my local machine.

This is a self-project aimed to both provide a useful service as well as
allowing me to learn new tools.

## TODO:
- Integrate a proper database system to store server, channel and user information (MongoDB, PostgreSQL, etc, I'm still learning)
- Find and learn a hosting platform for the bot to run, most likely AWS
- Add command recognition, any suggestions for commands would be appreciated!
- Design a simple front-end page to monitor the status of the bot
