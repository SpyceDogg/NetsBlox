/**
 * The Twitter Service provides access to real-time and historical stock price data.
 * For more information, check out https://twitter.com.
 *
 * Terms of use: https://twitter.com/en/tos
 * @service
 */
// This will use the Twitter API to allow the client to execute certain Twitter functions within NetsBlox

'use strict';
const ApiConsumer = require('../utils/api-consumer');
var KEY = process.env.TWITTER_BEARER_TOKEN;

// make sure key starts with bearer
if (KEY && !KEY.startsWith('Bearer ')) KEY = 'Bearer ' + KEY;

const TwitterConsumer = new ApiConsumer('Twitter', 'https://api.twitter.com/1.1/', {
    cache: {
        ttl: 30
    }
});

function rateCheck(response, res) {
    if (response.statusCode == 429) {
        res.send('Rate limit exceeded--wait before trying again');
        return true;
    }
    return false;
}

TwitterConsumer.isSupported = () => {
    if (!KEY) {
        /* eslint-disable no-console*/
        console.error('TWITTER_BEARER_TOKEN is missing.');
        /* eslint-enable no-console*/
    }
    return KEY;
};

/**
 * Get tweets from a user
 * @param {String} screenName Name of user
 * @param {Number} count Number of tweets to retrieve
 * @returns {Array} Tweets from user
 */
TwitterConsumer.recentTweets = function (screenName, count) {
    return this._requestData({
        queryString: `statuses/user_timeline.json?screen_name=${screenName}&count=${count}`,
        headers: {
            Authorization: KEY,
            gzip: 'true'
        }
    }).then(res => {
        return res.map(tweet => `( ${tweet.retweet_count} RTs, ${tweet.favorite_count} Favs) ${tweet.text}`);
    })
        .catch(err => {
            if (rateCheck(err, this.response)) {
                return;
            }
            throw err;
        });
};

/**
 * Get the number of users following someone on Twitter
 * @param {String} screenName Name of user
 * @returns {Number} Number of followers user has
 */
TwitterConsumer.followers = function (screenName) {
    return this._sendAnswer({
        queryString: `users/show.json?screen_name=${screenName}`,
        headers: {
            Authorization: KEY,
            gzip: 'true'
        }
    }, '.followers_count').catch(err => {
        if (rateCheck(err, this.response)) {
            return;
        }
        throw err;
    });
};

/**
 * Get the number of tweets someone has made on Twitter
 * @param {String} screenName Name of user
 * @returns {Number} Number of tweets user has
 */
TwitterConsumer.tweets = function (screenName) {
    return this._sendAnswer({
        queryString: `users/show.json?screen_name=${screenName}`,
        headers: {
            Authorization: KEY,
            gzip: 'true'
        }
    }, '.statuses_count').catch(err => {
        if (rateCheck(err, this.response)) {
            return;
        }
        throw err;
    });
};


//
/**
 * Searches the most recent tweets
 * @param {String} keyword Keyword to search for
 * @param {Number} count Number of tweets to retrieve
 * @returns {Array} Most recent tweets matching keyword
 */
TwitterConsumer.search = function (keyword, count) {
    return this._requestData({
        queryString: `search/tweets.json?q=${encodeURI(keyword)}&count=${count}`,
        headers: {
            Authorization: KEY,
            gzip: 'true'
        }
    }).then(res => {
        return res.statuses.map(tweet => `( ${tweet.retweet_count} RTs, ${tweet.favorite_count} Favs) @${tweet.user.screen_name}: ${tweet.text}`);
    })
        .catch(err => {
            if (rateCheck(err, this.response)) {
                return;
            }
            throw err;
        });
};


/**
 * Get how many tweets per day the user averages (most recent 200)
 * @param {String} screenName Name of user
 * @returns {Number} How many tweets per day the user averages
 */
TwitterConsumer.tweetsPerDay = function (screenName) {
    var oneDay = 24 * 60 * 60 * 1000, // hours*minutes*seconds*milliseconds
        dateToday = new Date();

    return this._requestData({
        queryString: `statuses/user_timeline.json?screen_name=${screenName}&count=200`,
        headers: {
            Authorization: KEY,
            gzip: 'true'
        }
    }).then(res => {
        var oldestDate = new Date(res[res.length - 1].created_at);
        var diffDays = Math.round(Math.abs((oldestDate.getTime() - dateToday.getTime()) / (oneDay)));
        return this.response.json(res.length / diffDays);
    }).catch(err => {
        if (rateCheck(err, this.response)) {
            return;
        }
        throw err;
    });
};

/**
 * Get the most recent tweets that a user has favorited
 * @param {String} screenName Name of user
 * @param {Number} count Number of tweets to retrieve
 * @returns {Array} Most recent tweets that a user has favorited
 */
TwitterConsumer.favorites = function (screenName, count) {
    return this._requestData({
        queryString: `favorites/list.json?screen_name=${screenName}&count=${count}`,
        headers: {
            Authorization: KEY,
            gzip: 'true'
        }
    }).then(res => {
        return res.map(fav => `@${fav.user.screen_name}: ${fav.text}`);
    })
        .catch(err => {
            if (rateCheck(err, this.response)) {
                return;
            }
            throw err;
        });
};


/**
 * Get the number of favorites someone has on Twitter
 * @param {String} screenName Name of user
 * @returns {Number} Number of favorites user has
 */
TwitterConsumer.favoritesCount = function (screenName) {
    return this._sendAnswer({
        queryString: `users/show.json?screen_name=${screenName}`,
        headers: {
            Authorization: KEY,
            gzip: 'true'
        }
    }, '.favourites_count').catch(err => {
        if (rateCheck(err, this.response)) {
            return;
        }
        throw err;
    });
};

module.exports = TwitterConsumer;
