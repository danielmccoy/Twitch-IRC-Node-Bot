IRC_Client = require('./libs/irc');

var irc = new IRC_Client({
	server   : 'irc.twitch.tv',
	username : '',
	password : '',
	nickname : '',
	channel  : ['#testchannel']
});

irc.on('message', function(data){
	console.log(data);
});