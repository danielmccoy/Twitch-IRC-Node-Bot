var Util   = require("util");
var Events = require('events').EventEmitter;
var Net    = require('net');

var IRC = function(config)
{
	// Reference self
	var self = this;
	
	// Socket
	self.socket = new Net.Socket();
	
	// Configuration
	self._config = {
		server         : null,
		port           : 6667,
		username       : null,
		password       : null,
		nickname       : null,
		autoConnect    : true,
		autoReconnect  : true,
		reconnectDelay : 5000,
		channel        : null
	};

	// Merge config
	if(typeof(config) === 'object')
	{
		for(prop in config)
		{
			self._config[prop] = config[prop];
		}
	}
	
	// Trigger connect
	if(self._config.autoConnect)
	{
		self.connect();
	}
	
	// Return self
	return self;
}

// Inherit events
Util.inherits(IRC, Events);



/**
 * Connect to IRC server
 */
IRC.prototype.connect = function()
{
	var self = this;
	
	// Connect to socket
	this.socket.setEncoding('utf-8');
	this.socket.setNoDelay();
	this.socket.connect(this._config.port, this._config.server, 4, false, function()
	{	
		// Emit connect event
		self.emit('connect');
	});
	
	// On socket data
	this.socket.on('data', function(data){
		data = data.split('\r\n');
		for(var i = 0; i < data.length; i++)
		{
			if(data[i] !== '')
			{
				// Emit data event
				self.emit('data', data[i]);
			}
		}
	});

	// Return self
	return this;
};



/**
 * Send raw line to IRC server
 */
IRC.prototype.send = function(data)
{
	this.socket.write(data + '\r\n', 'utf-8');
}



/**
 * Process raw data and emit message types
 * @param string data
 */
IRC.prototype.process = function(data)
{
	var self = this;

	// PRIVMSG
	check_message = data.match(/^:(.*?)\!(.*?)\@(.*?) PRIVMSG \#(.*?) \:(.*?)$/);
	if(check_message !== null)
	{
		this.emit('message', {
			user    : check_message[1],
			host    : check_message[3],
			channel : "#" + check_message[4],
			message : check_message[5],
		});
		return;
	}

	// PING
	check_ping = data.match(/^PING :(.*?)$/);
	if(check_ping !== null)
	{
		this.emit('ping', check_ping[1]);
		return;
	}
}



/**
 * Pass raw data to processing method
 * @param string data
 */
IRC.prototype.on('data', function(data)
{
	// Process message
	this.process(data);
});



/**
 * Listen for ping messages
 * @param string pong
 */
IRC.prototype.on('ping', function(pong)
{
	// Reply to ping requests
	this.send("PONG " + String(pong));
});



/**
 * Listen for socket disconnect and auto reconnect
 */
IRC.prototype.on('disconnect', function()
{
	var self = this;
	
	// Check if auto reconnect is enabled
	if(self._config.autoReconnect)
	{
		// Reconnect after retry delay
		setTimeout(function(){ self.connect(); }, parseInt(self._config.reconnectDelay));
	}
});



/**
 * Listen for socket connect and log in
 */
IRC.prototype.on('connect', function()
{
	// Password
	if(typeof(this._config.password) === 'string'){ this.send('PASS ' + String(this._config.password)); }
	
	// Nickname
	if(typeof(this._config.nickname) === 'string'){ this.send('NICK ' + String(this._config.nickname)); }
	
	// User
	if(typeof(this._config.nickname) === 'string'){ this.send('USER ' + String(this._config.nickname) + ' 8 * :Node.js IRC bot'); }
	
	// Join
	if(typeof(this._config.channel) === 'object'){ this.send('JOIN ' + this._config.channel.join(',')); }
});


// Export IRC module
module.exports = IRC;