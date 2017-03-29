
/*
 * NTF from Enron
 */

var enron_host_url = 'https://dl.dropboxusercontent.com/u/1636548/frostt_data/cpd-viz/enron-ntf/';
var ex_enron= {
  plotModes: [3, 2],  // index of default modes to plot from dataURLs below

  modes: [
    {
      name: 'senders',
      matrix_url: enron_host_url + 'mode1.mat',
      map_url: enron_host_url + 'mode-1-senders.map',
      modifiers: { prune : true}
    },
    {
      name: 'receivers',
      matrix_url: enron_host_url + 'mode2.mat',
      map_url: enron_host_url + 'mode-2-receivers.map',
      modifiers: { prune : true}
    },
    {
      name: 'words',
      matrix_url: enron_host_url + 'mode3.mat',
      map_url: enron_host_url + 'mode-3-words.map',
      modifiers: { prune : true}
    },
    {
      name: 'dates',
      matrix_url: enron_host_url + 'mode4.mat',
      map_url: enron_host_url + 'mode-4-dates.map',
      modifiers: { sequential : true}
    }
  ],
};
