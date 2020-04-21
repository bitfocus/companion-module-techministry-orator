// TechMinistry-Orator

var instance_skel = require('../../instance_skel');
var debug;
var log;

var io = require('socket.io-client');
var socket = null;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions
	
	return self;
}

instance.prototype.ConfigData = [];
instance.prototype.SystemVoices = [];
instance.prototype.PollyVoices = [];

instance.prototype.Clients = [];

instance.prototype.Years = [];
instance.prototype.Months = [
	{id: 1, label: 'January'},
	{id: 2, label: 'February'},
	{id: 3, label: 'March'},
	{id: 4, label: 'April'},
	{id: 5, label: 'May'},
	{id: 6, label: 'June'},
	{id: 7, label: 'July'},
	{id: 8, label: 'August'},
	{id: 9, label: 'September'},
	{id: 10, label: 'October'},
	{id: 11, label: 'November'},
	{id: 12, label: 'December'}
];
instance.prototype.Days = [];
instance.prototype.Hours = [];
instance.prototype.Minutes = [];
instance.prototype.Seconds = [];

instance.prototype.init = function () {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.status(self.STATUS_OK);

	self.initVariables();
	
	self.initModule();
};

instance.prototype.updateConfig = function (config) {
	var self = this;
	self.config = config;

	self.status(self.STATUS_OK);

	self.initModule();
};

instance.prototype.initVariables = function () {
	var self = this;

	var variables = [
		{
			label: 'Speaker Output Muted',
			name:  'muted'
		},
		{
			label: 'Server Local Output',
			name: 'localoutput'
		}
	];

	self.setVariableDefinitions(variables);
};

instance.prototype.populateDateArrays = function () {
	var self = this;
	
	let d = new Date();
	
	let d_year = d.getFullYear();
	
	self.Years = [];
	self.Days = [];
	self.Hours = [];
	self.Minutes = [];
	self.Seconds = [];
	
	for (let i = 0; i < 5; i++) {
		let year = (d_year + i);
		self.Years.push({id: year, label: year});
	}
	
	for (let i = 1; i <= 31; i++) {
		self.Days.push({id: i, label: i});
	}
	
	for (let i = 1; i <= 24; i++) {
		self.Hours.push({id: i, label: i});
	}
	
	for (let i = 0; i <= 59; i++) {
		self.Minutes.push({id: i, label: i});
	}
	
	for (let i = 0; i <= 59; i++) {
		self.Seconds.push({id: i, label: i});
	}
};

instance.prototype.initModule = function () {
	var self = this;
	
	self.populateDateArrays();
	
	self.ConfigData = [];
	self.SystemVoices = [];
	self.PollyVoices = [];
	
	self.Clients = [];
	
	if (self.config.host) {		
		socket = io.connect('http://' + self.config.host + ':' + self.config.port, {reconnection: true});

		// Add a connect listener
		socket.on('connect', function() { 
			socket.emit('Controller_JoinRoom', 'Companion');
		});
		
		socket.on('Config', function(configData) {
			self.ConfigData = configData;
			
			if (self.ConfigData.usePolly) {
				//populate Amazon Polly Voices array
				self.PollyVoices = [];
				for (let i = 0; i < self.ConfigData.pollyVoices.length; i++) {
					let voiceObj = {};
					voiceObj.id = self.ConfigData.pollyVoices[i].Id;
					voiceObj.label = `${self.ConfigData.pollyVoices[i].Id} (${self.ConfigData.pollyVoices[i].LanguageCode})`;
					self.PollyVoices.push(voiceObj);
				}
			}

			if (self.ConfigData.muted === true) {
				//set variable to muted
				self.setVariable('muted', 'true');

			}
			else {
				//set variable to unmuted
				self.setVariable('muted', 'false');
			}

			if (self.ConfigData.localOutput === true) {
				self.setVariable('localoutput', 'true');
			}
			else {
				self.setVariable('localoutput', 'false');
			}
			
			self.SystemVoices = [];

			for (let i = 0; i < self.ConfigData.systemVoices.length; i++) {
				if (self.ConfigData.systemVoices[i].LanguageCode === self.ConfigData.languageCode) {
					let voiceObj = {};
					voiceObj.id = self.ConfigData.systemVoices[i].Id;
					voiceObj.label = `${self.ConfigData.systemVoices[i].Id} (${self.ConfigData.systemVoices[i].LanguageCode})`;
					self.SystemVoices.push(voiceObj);	
				}
			}

			self.actions(); // export actions
		});
		
		socket.on('Clients', function(clientData) {
			self.Clients = [];
			
			if (self.ConfigData.localOutput === true) {
				let localClientObj = {};
				localClientObj.id = 'local';
				localClientObj.label = 'Orator Server Local Output';
				self.Clients.push(localClientObj);	
			}

			for (let i = 0; i < clientData.length; i++) {
				let clientObj = {};
				clientObj.id = clientData[i].id;
				clientObj.label = clientData[i].id;
				self.Clients.push(clientObj);
			}
			
			self.actions();
		});
		
		socket.on('MuteStatus', function (muteStatus) {
			if (muteStatus) {
				//set variable to muted
				self.setVariable('muted', 'true');
			}
			else {
				//set variable to unmuted
				self.setVariable('muted', 'false');
			}
		});
		
		socket.on('ReportError', function(message, code) {
			self.log('error', message + ': ' + code);
		});
		
		socket.on('ReportInfo', function(message) {
			self.log('debug', message);
		});
	}
	
	self.actions(); // export actions
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'You will need to have the Orator program running on the remote computer.'
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Target Port',
			default: 7000,
			width: 4,
			regex: self.REGEX_PORT
		}
	]
}

// When module gets deleted
instance.prototype.destroy = function () {
	var self = this;

	debug('destroy', self.id);
}

instance.prototype.actions = function (system) {
	var self = this;
	
	let d = new Date();

	self.PollyActions = {
		'speak_system': {
			label: 'Send Message using System/OS voice',
			options: [
				{
					type: 'dropdown',
					label: 'Voice',
					id: 'voice',
					choices: self.SystemVoices,
					tooltip: 'Voice to use for speech output.'
				},
				{
					type: 'checkbox',
					label: 'Priority Message',
					id: 'priority',
					default: false
				},
				{
					type: 'textinput',
					label: 'Message',
					id: 'message',
					default: ''
				},
				{
					type: 'speed',
					label: 'Speech Speed',
					id: 'speed',
					min: 0.5,
					max: 2,
					default: 1,
					required: true,
					range: true
				},
				{
					type: 'checkbox',
					label: 'Broadcast Message',
					id: 'broadcast',
					default: true
				},
				{
					type: 'multiselect',
					label: 'Send to Client(s)',
					id: 'clients',
					tooltop: 'Which Orator clients should specifically receive this message?',
					choices: self.Clients
				}
			]
		},
		'speak_system_scheduled': {
			label: 'Send Scheduled Message using System/OS voice',
			options: [
				{
					type: 'dropdown',
					label: 'Voice',
					id: 'voice',
					choices: self.SystemVoices,
					tooltip: 'Voice to use for speech output.'
				},
				{
					type: 'textinput',
					label: 'Message',
					id: 'message',
					default: ''
				},
				{
					type: 'speed',
					label: 'Speech Speed',
					id: 'speed',
					min: 0.5,
					max: 2,
					default: 1,
					required: true,
					range: true
				},
				{
					type: 'dropdown',
					label: 'Year',
					id: 'year',
					choices: self.Years,
					default: d.getFullYear()
				},
				{
					type: 'dropdown',
					label: 'Month',
					id: 'month',
					choices: self.Months,
					default: d.getMonth()+1
				},
				{
					type: 'dropdown',
					label: 'Day',
					id: 'day',
					choices: self.Days,
					default: d.getDate()
				},
				{
					type: 'dropdown',
					label: 'Hour',
					id: 'hour',
					choices: self.Hours,
					default: d.getHours()
				},
				{
					type: 'dropdown',
					label: 'Minute',
					id: 'minute',
					choices: self.Minutes,
					default: d.getMinutes()
				},
				{
					type: 'dropdown',
					label: 'Second',
					id: 'second',
					choices: self.Seconds,
					default: 0
				},
				{
					type: 'checkbox',
					label: 'Broadcast Message',
					id: 'broadcast',
					default: true
				},
				{
					type: 'multiselect',
					label: 'Send to Client(s)',
					id: 'clients',
					tooltop: 'Which Orator clients should specifically receive this message?',
					choices: self.Clients
				}
			]
		},
		'speak_polly': {
			label: 'Send Message using an Amazon Polly voice',
			options: [
				{
					type: 'dropdown',
					label: 'Voice',
					id: 'voice',
					choices: self.PollyVoices,
					tooltip: 'Voice to use for speech output.'
				},
				{
					type: 'checkbox',
					label: 'Priority Message',
					id: 'priority',
					default: false
				},
				{
					type: 'textinput',
					label: 'Message',
					id: 'message',
					default: '',
					tooltip: 'Supports Amazon SSML.'
				},
				{
					type: 'dropdown',
					label: 'Engine',
					id: 'engine',
					choices: [
						{id: 'standard', label: 'Standard'},
						{id: 'neural', label: 'Neural'}
					],
					default: 'standard',
					tooltip: 'Engine to use for synthesization.'
				},
				{
					type: 'checkbox',
					label: 'Broadcast Message',
					id: 'broadcast',
					default: true
				},
				{
					type: 'multiselect',
					label: 'Send to Client(s)',
					id: 'clients',
					tooltop: 'Which Orator clients should specifically receive this message?',
					choices: self.Clients
				}
			]
		},
		'speak_polly_scheduled': {
			label: 'Send Scheduled Message using an Amazon Polly voice',
			options: [
				{
					type: 'dropdown',
					label: 'Voice',
					id: 'voice',
					choices: self.PollyVoices,
					tooltip: 'Voice to use for speech output.'
				},
				{
					type: 'textinput',
					label: 'Message',
					id: 'message',
					default: '',
					tooltip: 'Supports Amazon SSML.'
				},
				{
					type: 'dropdown',
					label: 'Engine',
					id: 'engine',
					choices: [
						{id: 'standard', label: 'Standard'},
						{id: 'neural', label: 'Neural'}
					],
					default: 'standard',
					tooltip: 'Engine to use for synthesization.'
				},
				{
					type: 'dropdown',
					label: 'Year',
					id: 'year',
					choices: self.Years,
					default: d.getFullYear()
				},
				{
					type: 'dropdown',
					label: 'Month',
					id: 'month',
					choices: self.Months,
					default: d.getMonth()+1
				},
				{
					type: 'dropdown',
					label: 'Day',
					id: 'day',
					choices: self.Days,
					default: d.getDate()
				},
				{
					type: 'dropdown',
					label: 'Hour',
					id: 'hour',
					choices: self.Hours,
					default: d.getHours()
				},
				{
					type: 'dropdown',
					label: 'Minute',
					id: 'minute',
					choices: self.Minutes,
					default: d.getMinutes()
				},
				{
					type: 'dropdown',
					label: 'Second',
					id: 'second',
					choices: self.Seconds,
					default: 0
				},
				{
					type: 'checkbox',
					label: 'Broadcast Message',
					id: 'broadcast',
					default: true
				},
				{
					type: 'multiselect',
					label: 'Send to Client(s)',
					id: 'clients',
					tooltop: 'Which Orator clients should specifically receive this message?',
					choices: self.Clients
				}
			]
		},
		'mute': {
			label: 'Mute All Speech Output on a specific Orator Client',
			options: [
				{
					type: 'dropdown',
					label: 'Select Client',
					id: 'client',
					tooltop: 'Which Orator clients should specifically be muted?',
					choices: self.Clients
				}
			]
		},
		'mute_all': {
			label: 'Mute All Speech Output on Orator Server'
		},
		'unmute': {
			label: 'Unmute All Speech Output on a specific Orator Client',
			options: [
				{
					type: 'dropdown',
					label: 'Select Client',
					id: 'client',
					tooltop: 'Which Orator clients should specifically be unmuted?',
					choices: self.Clients
				}
			]
		},
		'unmute_all': {
			label: 'Unmute All Speech Output on Orator Server'
		},
		'stop': {
			label: 'Stop All Speech Output on a specific Orator Client',
			options: [
				{
					type: 'dropdown',
					label: 'Select Client',
					id: 'client',
					tooltop: 'Which Orator clients should specifically be stopped?',
					choices: self.Clients
				}
			]
		},
		'stop_all': {
			label: 'Stop Current Speech Output on Orator Server and all Clients'
		},
		'stopall_client': {
			label: 'Stop Current Speech Output on a specific Orator Client',
			options: [
				{
					type: 'multiselect',
					label: 'Select Client(s)',
					id: 'clients',
					tooltop: 'Which Orator clients should specifically be stopped?',
					choices: self.Clients
				}
			]
		},
	};

	if ((self.ConfigData.platform !== 'darwin') && (self.ConfigData.platform !== 'win32')) {
		//delete self.PollyActions.speak_system.options['speed'];
	}

	self.SystemActions = Object.assign({}, self.PollyActions);
	delete self.SystemActions.speak_polly;
	delete self.SystemActions.speak_polly_scheduled;
				
	
	if (self.ConfigData.usePolly) {
		self.system.emit('instance_actions', self.id, self.PollyActions );
	}
	else {
		self.system.emit('instance_actions', self.id, self.SystemActions );
	}
};

instance.prototype.action = function (action) {
	var self = this;
	var options = action.options;
	
	var host = self.config.host;
	var port = self.config.port;
	
	let messageObj = {};
	
	let jsonObj = {};

	switch (action.action) {
		case 'speak_system':
			messageObj = {};
			messageObj.message = options.message;
			messageObj.type = 'system';
			messageObj.priority = options.priority;
			messageObj.voice = options.voice;
			messageObj.speed = options.speed;
			messageObj.broadcast = options.broadcast;
			messageObj.clients = options.clients;
			
			socket.emit('AddMessage', messageObj);
			break;
		case 'speak_system_scheduled':
			messageObj = {};
			messageObj.message = options.message;
			messageObj.type = 'system';
			messageObj.priority = options.priority;
			messageObj.voice = options.voice;
			messageObj.speed = options.speed;
			messageObj.broadcast = options.broadcast;
			messageObj.clients = options.clients;

			messageObj.datetime_tospeak = {
				year: options.year,
				month: options.month,
				day: options.day,
				hour: options.hour,
				minute: options.minute,
				second: options.second
			};
			
			socket.emit('AddMessage', messageObj);
			break;
		case 'speak_polly':
			messageObj = {};
			messageObj.message = options.message;
			messageObj.type = 'polly';
			messageObj.priority = options.priority;
			messageObj.voice = options.voice;
			messageObj.engine = options.engine;
			messageObj.broadcast = options.broadcast;
			messageObj.clients = options.clients;
			
			if (messageObj.message.indexOf('<speak>') > -1) {
				messageObj.textType = 'ssml';
			}
			else {
				messageObj.textType = 'text';
			}
			
			socket.emit('AddMessage', messageObj);
			break;
		case 'speak_polly_scheduled':
			messageObj = {};
			messageObj.message = options.message;
			messageObj.type = 'polly';
			messageObj.priority = options.priority;
			messageObj.voice = options.voice;
			messageObj.engine = options.engine;
			messageObj.broadcast = options.broadcast;
			messageObj.clients = options.clients;
			
			messageObj.datetime_tospeak = {
				year: options.year,
				month: options.month,
				day: options.day,
				hour: options.hour,
				minute: options.minute,
				second: options.second
			};
			
			if (messageObj.message.indexOf('<speak>') > -1) {
				messageObj.textType = 'ssml';
			}
			else {
				messageObj.textType = 'text';
			}
			
			socket.emit('AddMessage', messageObj);
			break;
		case 'mute':		
			socket.emit('Mute', options.client);
			break;
		case 'mute_all':
			socket.emit('MuteAll');
			break;
		case 'unmute':
			socket.emit('Unmute', options.client);
			break;
		case 'unmute_all':
			socket.emit('UnmuteAll');
			break;
		case 'stop':
			socket.emit('Stop', options.client);
			break;
		case 'stop_all':
			socket.emit('StopAll');
			break;
		default:
			break;
	}
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;
