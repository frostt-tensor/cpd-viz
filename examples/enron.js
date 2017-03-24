
/*
 * NTF from Enron
 */

var enron_host_url = 'https://dl.dropboxusercontent.com/u/1636548/frostt_data/cpd-viz/enron-ntf/';
var ex_enron= {
  display: '#plotly',
  select: '#nav',
  plotModes: [3, 2],  // index of default modes to plot from dataURLs below
  dataURLs: [{
      name: 'senders', map: enron_host_url + 'mode-1-senders.map',
      mode: enron_host_url + 'mode1.mat'
    }, {
      name: 'receivers', map: enron_host_url + 'mode-2-receivers.map',
      mode: enron_host_url + 'mode2.mat'
    }, {
      name: 'words', map: enron_host_url + 'mode-3-words.map',
      mode: enron_host_url + 'mode3.mat'
    }, {
      name: 'dates', map: enron_host_url + 'mode-4-dates.map',
      mode: enron_host_url + 'mode4.mat'
  }]
};

