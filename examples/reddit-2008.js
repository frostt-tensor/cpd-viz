
/*
 * Date x User x Subreddit x Word tensor formed from Reddit comments over 2008.
 */

var reddit_host_url = 'https://dl.dropboxusercontent.com/u/1636548/frostt_data/cpd-viz/reddit-2008-ntf/';
var ex_reddit_2008 = {
  plotModes: [0, 2],  // index of default modes to plot from dataURLs below

  modes: [
    {
      name: 'dates',
      map_url: reddit_host_url + 'mode-1-dates.map',
      matrix_url: reddit_host_url + 'mode1.mat'
    },
    { // users
      name: 'users',
      map_url: reddit_host_url + 'mode-2-users.map',
      matrix_url: reddit_host_url + 'mode2.mat'
    },
    { // subreddits
      name: 'subreddits',
      map_url: reddit_host_url + 'mode-3-subreddits.map',
      matrix_url: reddit_host_url + 'mode3.mat'
    },
    { // words
      name: 'words',
      map_url: reddit_host_url + 'mode-4-words.map',
      matrix_url: reddit_host_url + 'mode4.mat'
    }
  ],
};

