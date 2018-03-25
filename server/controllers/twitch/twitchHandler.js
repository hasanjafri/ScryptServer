import request from 'request';
import qs from 'querystring';
import { jsonSuccess } from '../../utils/json';

const OAuth2 = require('oauth').OAuth2

const twitchHandler = {};

const twitchClientId = process.env.TWITCH_CLIENT_ID;
const twitchSecret = process.env.TWITCH_SECRET;

const authorizationURL = 'https://id.twitch.tv/oauth2/authorize';
const tokenURL = 'https://id.twitch.tv/oauth2/token';
const callbackURL = `${process.env.SERVER_HOST}/api/twitch/callback`;

twitchHandler.init = (req, res) => {
    return res.redirect(`${authorizationURL}?client_id=${twitchClientId}&redirect_uri=${callbackURL}&response_type=code&scope=user_read`);
};

twitchHandler.receiveCallback = (req, res) => {
    const { code } = req.query;
    request.post({
        url: `${tokenURL}?client_id=${twitchClientId}&client_secret=${twitchSecret}&redirect_uri=${callbackURL}&grant_type=authorization_code&code=${code}`,
    }, (e, response, body) => {
        if (response && response.statusCode == 200) {
            const { access_token, expires_in, refresh_token } = JSON.parse(body);
            // TODO: store access_token/refresh_token in user collection.
            // TODO: call different endpoint using this access_token.

            // Example call
            request({
                url: 'https://api.twitch.tv/helix/users?login=singsing',
                headers: { 'Client-ID': twitchClientId },
                auth: { bearer: access_token }
            }, (err, res) => {
                console.log('printing api call', res.body);
            });
        } else {
            console.log(JSON.parse(body));
        }
        return jsonSuccess(res);
    });
};

export default twitchHandler;