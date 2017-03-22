
// Returns V_q = A_{qr} B_{pr}
// Assumes A is a q x r matrix, B is p x r
function tensor_dot(A, B, p)
{
    var q_max = A.length;
    var r_max = A[0].length;

    var V = new Array(q_max); // return vector
    
    for (var q = 0; q < q_max; q++) {
        V[q] = 0;
        for (var r = 0; r < r_max; r++) {    
            V[q] += A[q][r] * B[p][r];
        }
    }

    return V;
}

function normalize(V)
{
    var total = 0;
    for(var i = 0; i < V.length; i++) {
        total += isNaN(V[i]) ? 0 : V[i];
    }
    for(var i = 0; i < V.length; i++) {
        V[i] = V[i]/total;
    }
    return V;
}

// parse matrix at url, apply callback to data
// Papa.parse call is async.
function papaparse_matrix(url, callback)
{
  Papa.parse(url, {
    download: true,
    delimiter: ' ',
    worker: true,
    skipEmptyLines: true,
    complete: function(results) {
      // Make a note in the console when done
      console.log("Loaded data array of length: "
        + results.data.length + ", rows of length: "
        + results.data[0].length
      );
      // add to array
      callback(results.data);
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function async_recurse_until_test(sleep_time, test, callback, callback_arg)
{
  if(test()) {
    callback(callback_arg);
  } else {
    await sleep(sleep_time);
    async_recurse_until_test(sleep_time, test, callback, callback_arg);
  }
}

// ECMAScript 6 class TensorData
class TensorDataDisplay
{

// class constructor

  // config should be an object with: 
  // {
  //   display: 'display_div_id',
  //   select: 'select_div_id',
  //   plotModes: [0, 1],
  //   dataURLs: [{map: url, mode: url},...],
  // }
  constructor(config)
  {
    console.log("Creating TensorDataDisplay class.");

    var self = this;
    
    this.modes = {};
    this.maps = {};

    this.config = config;
    this.dataURLs = config.dataURLs;
    this.display = config.display;
    this.select = config.select;

    // before doing anything, check to see if data should actually be loaded...
    var text = "Continue loading?\nWarning to mobile users: this may use a lot of data.";
    if(confirm(text) != true) {
      $(this.display).empty().append("Data not loaded. Refresh the page to try again.");
      return;
    }

    this.plotModes = config.plotModes;

    // clear then populate display div with 'loading' info
    $(this.display).empty().append(`
      <div id='loading_maps'>
        <span class='fa-stack orange' id='fa-maps-cloud'>
          <i class='fa fa-cloud fa-stack-2x'></i>
          <i class='fa fa-arrow-down fa-stack-1x fa-inverse'></i>
        </span>
        Loading maps... (shouldn't take too long)
        <ul></ul>
        <i class='fa fa-snowflake-o fa-spin fa-2x fa-fw'></i>
      </div>
      <div id='loading_modes'>
        <span class='fa-stack orange' id='fa-modes-cloud'>
          <i class='fa fa-cloud fa-stack-2x'></i>
          <i class='fa fa-arrow-down fa-stack-1x fa-inverse'></i>
        </span>
        Loading modes... (this may take a while)
        <ul></ul>
        <i class='fa fa-snowflake-o fa-spin fa-2x fa-fw'></i>
      </div>
    `);

    // prepare nav
    $(this.select).empty().append(`
      <div id='mode_a_picker' class='mode_picker'></div>
      <div id='mode_b_picker' class='mode_picker'></div>
      <div id='plot_picker'></div>
    `);

    // parse CSV files (async)
    this.dataURLs.forEach(function(el) {
      papaparse_matrix(el.map, function(data) {
        self.maps[el.map] = [].concat.apply([], data); // flattened array
        var text = el.name + ' map (' + Object.keys(self.maps).length + '/' + self.dataURLs.length + ')';
        self.updateLoadingDisplay({
          div: '#loading_maps',
          text: text,
        });
      });
      papaparse_matrix(el.mode, function(data) {
        self.modes[el.mode] = data;
        var text = el.name + ' mode (' + Object.keys(self.modes).length + '/' + self.dataURLs.length + ')';
        self.updateLoadingDisplay({
          div: '#loading_modes',
          text: text,
        });
      });
    });

    // recurse until all maps are loaded (maps object length = config data length) 
    async_recurse_until_test(100, function() {
      return Object.keys(self.maps).length >= self.dataURLs.length;
    }, this.finalizeLoadingDisplay, {div: '#loading_maps', text: 'maps'});
    
    // recurse until all modes are loaded (modes object length = config data length) 
    async_recurse_until_test(100, function() {
      return Object.keys(self.modes).length >= self.dataURLs.length;
    }, this.finalizeLoadingDisplay, {div: '#loading_modes', text: 'modes'});

    // recurse until all maps + modes are loaded
    async_recurse_until_test(100, function() {
      return Object.keys(self.maps).length >= self.dataURLs.length
              && Object.keys(self.modes).length >= self.dataURLs.length;
    }, this.initializeSelectize, self);

  } // constructor


// prototype functions

  // params = { div: '#div_id', text: '...' }
  updateLoadingDisplay(params)
  {
    $(params.div + ' ul').append('<li>Loaded ' + params.text + '...</li>');
  }

  // params = { div: '#div_id', text: '...' }
  finalizeLoadingDisplay(params)
  {
    $(params.div + ' .fa-snowflake-o').remove();
    $(params.div).append('...done loading ' + params.text + '. <i class=\'fa fa-snowflake-o fa-fw\'></i>');
    $(params.div + ' .fa-arrow-down').removeClass('fa-arrow-down').addClass('fa-check');
    $(params.div + ' .fa-cloud').removeClass('orange red').addClass('green');
    $(params.div + ' .fa-cloud').removeClass('orange red').addClass('green');
  }

  initializeSelectize(_self)
  {
    console.log("Initializing selectize.");

    var mode_a_idx = _self.plotModes[0];
    var mapURL_a = _self.dataURLs[mode_a_idx].map;
    var modeURL_a = _self.dataURLs[mode_a_idx].mode;
    var map_a = _self.maps[mapURL_a];
    var mode_a = _self.modes[modeURL_a];

    var mode_b_idx = _self.plotModes[1];
    var mapURL_b = _self.dataURLs[mode_b_idx].map;
    var modeURL_b = _self.dataURLs[mode_b_idx].mode;
    var map_b = _self.maps[mapURL_b];
    var mode_b = _self.modes[modeURL_b];


    // selectize to pick what to plot

    var options = new Array(map_b.length);
    for(var i=0; i<map_b.length; i++) {
      options[i] = { value: i, label: map_b[i] };
    }

    $('#plot_picker').empty().append('<select></select>');
    var $select = $('#plot_picker select:last-child').selectize({
      options: options,
      labelField: 'label',
      valueField: 'value',
      maxItems: null,
      searchField: ['label', 'value'],
      placeholder: 'Choose something to plot... (type to search)',
      onChange: function(value) {
        _self.plotResults(value, mode_a, mode_b, map_a, map_b, "plotly");
      },
    });

    var control = $select[0].selectize;
    control.clear();
    $(_self.display).empty();


    // selectize to pick what modes to use
    var mode_options = new Array(_self.dataURLs.length);
    for(var i=0; i<_self.dataURLs.length; i++) {
      mode_options[i] = { value: i, label: _self.dataURLs[i].name };
    }

    $('.mode_picker').empty().append('<select></select>');
    $select = $('#mode_a_picker select:last-child').selectize({
      options: mode_options,
      labelField: 'label',
      valueField: 'value',
      maxItems: 1,
      items: [mode_a_idx],
      searchField: ['label', 'value'],
      onChange: function(value) {
        _self.setPlotMode(0, value);
      },
    });
    $select = $('#mode_b_picker select:last-child').selectize({
      options: mode_options,
      labelField: 'label',
      valueField: 'value',
      maxItems: 1,
      items: [mode_b_idx],
      searchField: ['label', 'value'],
      onChange: function(value) {
        _self.setPlotMode(1, value);
      },
    });

  }

  plotResults(p, mode_a, mode_b, map_a, map_b, div)
  {
    var data = new Array();
    p.forEach(function(el) {
      var y_vals = normalize(tensor_dot(mode_a, mode_b, el));
      var x_vals = map_a;

      var trace = {
          x: x_vals,
          y: y_vals,
          type: 'scatter',
          name: map_b[el],
      };

      data.push(trace);
    });

    var layout = {
      xaxis: {
        autorange: true,
      },
      yaxis: {
        autorange: true,
      }
    };

    Plotly.newPlot(div, data, layout);
  }

  setPlotModes(plotModes)
  {
    this.plotModes = plotModes;
    this.initializeSelectize(this);
  }

  setPlotMode(mode_aorb, mode_idx)
  {
    this.plotModes[mode_aorb] = mode_idx;
    this.initializeSelectize(this);
  }

} // TensorDataDisplay class
