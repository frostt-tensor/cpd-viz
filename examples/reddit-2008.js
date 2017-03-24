
/*
 * Date x User x Subreddit x Word tensor formed from Reddit comments over 2008.
 */

var reddit_host_url = 'https://dl.dropboxusercontent.com/u/1636548/frostt_data/cpd-viz/reddit-2008-ntf/';
var ex_reddit_2008 = {
  display: '#plotly',
  select: '#nav',
  plotModes: [0, 2],  // index of default modes to plot from dataURLs below
  dataURLs: [{
      name: 'dates', map: reddit_host_url + 'mode-1-dates.map', mode: reddit_host_url + 'mode1.mat'
    }, { // users
      name: 'users', map: reddit_host_url + 'mode-2-users.map', mode: reddit_host_url + 'mode2.mat'
    }, { // subreddits
      name: 'subreddits', map: reddit_host_url + 'mode-3-subreddits.map', mode: reddit_host_url + 'mode3.mat'
    }, { // words
      name: 'words', map: reddit_host_url + 'mode-4-words.map', mode: reddit_host_url + 'mode4.mat'
  }]
};

