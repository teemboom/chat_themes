function teemboomChatInit(args) {

	let appTheme = null
	let apiUrl = 'https://chat-api.teemboom.com'
	let socketUrl = 'https://chat-socket.teemboom.com'
    if (!args) {
		console.error('Teemboom Chat: teemboomChatInit missing parameter');
		return;
	}

	
	if (args.token) {
		window.teemboomChatConfig = {
			'token': args.token,
			'apiUrl': args.apiUrl,
			'socketUrl': args.socketUrl,
		}
		appTheme = args.appTheme
	}else{
		let appID = null
		let userID = null
		let username = null
		let userProfilePicture = null
		let recipientUserID = null
		let recipientUsername = null
		let recipientProfilePicture = null

		appID = args.appId
		appTheme = args.appTheme
		userID = args.user.id
		username = args.user.username
		userProfilePicture = args.user.profile_pic
		if (args.recipient) {
			recipientUserID = args.recipient.id
			recipientUsername = args.recipient.username
			recipientProfilePicture = args.recipient.profile_pic
		}

		if (!appID) { console.error('Teemboom Chat: Missing appId'); return; }
		if (!userID) { console.error('Teemboom Chat: Missing user.id'); return; }
		if (!appTheme) { console.error('Teemboom Chat: Missing appTheme'); return; }

		window.teemboomChatConfig = {
			'appId': appID,
			'appTheme': appTheme,
			'apiUrl': apiUrl,
			'socketUrl': socketUrl,
			'user': {
				'id': userID,
				'username': username,
				'profile_pic': userProfilePicture
			}
		}
		if (recipientUserID) {
			window.teemboomChatConfig.recipient = {
				'id': recipientUserID,
				'username': recipientUsername,
				'profile_pic': recipientProfilePicture
			}
		}
	}


	const scripts_url = 'https://chat-app.teemboom.com'
	let theme_js = document.createElement('script');
	theme_js.setAttribute('src', `${scripts_url}/theme/${appTheme}/teemboom_app.js`)
	document.head.appendChild(theme_js);

	let theme_css = document.createElement('link');
	theme_css.setAttribute('rel', 'stylesheet');
	theme_css.setAttribute('href', `${scripts_url}/theme/${appTheme}/teemboom_app.css`);
	document.head.appendChild(theme_css);
}