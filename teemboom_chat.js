function teemboomChatInit(args = false) {
	let appID = null
    let appTheme = null
	let userID = null
	let username = null
	let userProfilePicture = null
	let recipientUserID = null
	let recipientUsername = null
	let recipientProfilePicture = null

	if (!args) {
		if (document.getElementById('teemboom_chat')) {
			mainDiv = document.getElementById('teemboom_chat')
			appID = mainDiv.dataset.app_id
			appTheme = mainDiv.dataset.app_theme
			userID = mainDiv.dataset.user_id
			username = mainDiv.dataset.username
			userProfilePicture = mainDiv.dataset.user_profile_pic
			recipientUserID = mainDiv.dataset.recipient_user_id
			recipientUsername = mainDiv.dataset.recipient_username
			recipientProfilePicture = mainDiv.dataset.recipient_profile_pic
		}

	} else {
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
	}

	if (!appID) { console.error('Teemboom Chat: Missing app id'); return }
	if (!userID) { console.error('Teemboom Chat: Missing user id'); return }
	if (!username) { console.error('Teemboom Chat: Missing username'); return }

	window.teemboomChatConfig = {
		'appId': appID,
		'appTheme': appTheme,
		'apiUrl': "https://chat-api.teemboom.com",
		'socketUrl': "https://chat-socket.teemboom.com",
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
	const scripts_url = 'https://chat-app.teemboom.com'
    let theme_js = document.createElement('script');
    theme_js.setAttribute('src', `${scripts_url}/theme/${appTheme}/teemboom_app.js`)
    document.head.appendChild(theme_js);

    let theme_css = document.createElement('link');
    theme_css.setAttribute('rel', 'stylesheet');
    theme_css.setAttribute('href', `${scripts_url}/theme/${appTheme}/teemboom_app.css`);
    document.head.appendChild(theme_css);
}