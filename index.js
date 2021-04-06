const login = require('facebook-chat-api');
const gamesense = require('gamesense-client');

const endpoint = new gamesense.ServerEndpoint();
// This is for windows, will be different in OSX
endpoint.discoverUrl(
	'C:/ProgramData/SteelSeries/SteelSeries Engine 3/coreProps.json',
);
const game = new gamesense.Game(
	'FBM4SSGE',
	'Facebook Messenger For SteelSeries GameEngine',
	'Code Cowboy',
	60000,
);
const client = new gamesense.GameClient(game, endpoint);
const oledEvent = new gamesense.GameEvent('OLED_EVENT');
client.startHeartbeatSending();
client.registerGame().then(() => {
	const handler = new gamesense.ScreenEventHandler();
	handler.datas = [
		new gamesense.MultiLineFrame(
			[
				{ ...new gamesense.LineData(false), context_frame_key: 'line1' },
				{ ...new gamesense.LineData(false), context_frame_key: 'line2' },
			],
			new gamesense.FrameModifiers(1000, 41, true),
		),
	];
	return client.bindEvent(oledEvent, [handler]);
});

let line1Str = 'Loading...';
let line2Str = '';

// FB browser spoof
login(
	{ email: '<FB EMAIL USERNAME>', password: '<FB PASSWORD>' },
	{
		userAgent:
			'Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Mobile Safari/537.36',
	},
	(err, api) => {
		api.listenMqtt((err, message) => {
			if (message.type !== 'message') return;

			console.log(message.body);
		});

		setInterval(() => {
			api.getThreadList(999, null, ['INBOX', 'unread'], (err, list) => {
				if (err) return -1;

				const unreadCount = list.reduce(
					(acc, thread) => acc + thread.unreadCount,
					0,
				);
				const people = list.reduce(
					(acc, thread) => [...acc, thread.name.split(' ')[0]],
					[],
				);
				line1Str = unreadCount ? `Unread: ${unreadCount}` : 'No msgs';
				line2Str = people.length ? people[0] : '';
			});
		}, 500);
	},
);

setInterval(() => {
	oledEvent.frame = {
		line1: line1Str,
		line2: line2Str,
	};
	client.sendGameEventUpdate(oledEvent);
}, 100);
