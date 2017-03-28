
// Matrix-vector multiplication.
// A is a q x r matrix, vec is a r x 1 vector.
// TODO: Switch to a numerical JS library?
function matvec(A, vec)
{
  var nrows = A.length;
  var ncols = A[0].length;

  if(vec.length != ncols) {
    alert('ERROR: matvec received mismatched dimensions: (' +
      + nrows + ' x ' + ncols + ') * (' + vec.length + ' x 1)');
    return [];
  }

  var V = new Array(nrows); // return vector

  for(var i=0; i < nrows; ++i) {
    V[i] = 0;
    for(var j=0; j < ncols; ++j) {
      V[i] += A[i][j] * vec[j];
    }
  }

  return V;
}


// Normalize the sum of V to be 1.
function normalize(V)
{
  var total = 0;
  for(var i = 0; i < V.length; ++i) {
    total += isNaN(V[i]) ? 0 : V[i];
  }
  for(var i = 0; i < V.length; ++i) {
    V[i] = V[i]/total;
  }
  return V;
}



class CPDDisplay
{
  constructor(cpd, divID, initialPlotModes)
  {
    console.log('Constructing CPDDisplay, attaching to ' + divID + '.');
    if(cpd.getNumModes() == 0) {
      console.log('ERROR: attempting to plot empty CPD.');
      alert('CPD must be non-empty.');
      return;
    }

    this.cpd = cpd;
    this.div = '#' + divID;

    // build plotting div

    // plotModes[0] = x-axis, plotModes[1] = y-axis
    this.plotModes = this.cpd.bestPlotModes();

    this._buildModeSelection(); // which modes to plot
    this._buildProjectionSelection(); // which values to plot
  }


  //
  // Public interface
  //

  // axis=0 = x-axis, axis=1, y-axis
  setPlotMode(axis, modeIdx)
  {
    if(axis > this.plotModes.length) {
      alert('Axis: ' + axis + ' invalid.');
      return;
    }
    if(modeIdx > this.cpd.getNumModes()) {
      alert('Mode: ' + modeIdx + ' invalid.');
      return;
    }

    this.plotModes[axis] = modeIdx;
    console.log('Setting plotMode[' + axis + ']: ' + modeIdx);

    this._buildProjectionSelection();
  }


  getPlotMode(axis)
  {
    if(axis > this.plotModes.length) {
      alert('Axis: ' + axis + ' invalid.');
      return -1;
    }
    return this.plotModes[axis];
  }



  //
  // Private interface
  //

  _buildModeSelection()
  {
    var self = this;
    console.log('CPDDisplay: Building selectize.');

    if(this.plotModes.length != 2) {
      alert('ERROR: CPDDisplay currently requires two modes to plot.');
      return;
    }

    // prepare nav and plotting region
    $(this.div).empty().append(`
      <nav class='cpd_nav'>
        <div> x-axis: <span id='mode_a_picker' class='mode_picker'></span></div>
        <div> project: <span id='mode_b_picker' class='mode_picker'></span></div>
        <div id='plot_picker'></div>
      </nav>
      <div id='plotly'></div>
    `);


    // selectize to pick what modes to use
    var mode_options = new Array(self.cpd.getNumModes());
    for(var i=0; i < self.cpd.getNumModes(); i++) {
      mode_options[i] = { value: i, label: self.cpd.getMode(i).name };
    }

    $('.mode_picker').empty().append('<select></select>');
    var select_x = $('#mode_a_picker select:last-child').selectize({
      options: mode_options,
      labelField: 'label',
      valueField: 'value',
      maxItems: 1,
      items: [self.getPlotMode(0)],
      searchField: ['label', 'value'],
      onChange: function(value) {
        self.setPlotMode(0, value);
      },
    });
    var select_y = $('#mode_b_picker select:last-child').selectize({
      options: mode_options,
      labelField: 'label',
      valueField: 'value',
      maxItems: 1,
      items: [self.getPlotMode(1)],
      searchField: ['label', 'value'],
      onChange: function(value) {
        self.setPlotMode(1, value);
      },
    });
  }


  _buildProjectionSelection()
  {
    var self = this;
    this.x_mode = this.cpd.getMode(this.plotModes[0]);
    this.y_mode = this.cpd.getMode(this.plotModes[1]);

    // fill in selectize options
    var picker_div = this.div + ' #plot_picker';
    $(picker_div).empty();

    var options = new Array(self.y_mode.dim);
    for(var i=0; i < self.y_mode.dim; ++i) {
      options[i] = { value: i, label: self.y_mode.map[i] };
    }

    $(picker_div).append('<select></select>');

    var select = $(picker_div + ' select:last-child').selectize({
      options: options,
      labelField: 'label',
      valueField: 'value',
      maxItems: null,
      closeAfterSelect: true,
      searchField: ['label', 'value'],
      placeholder: 'Choose something to plot... (type to search)',
      onChange: function(value) {
        self._plotResults(value, self.x_mode, self.y_mode, 'plotly');
      },
    });

    return select;
  }


  _plotResults(pvals, x_mode, y_mode, div)
  {
    var data = new Array();

    // foreach selected item of y_mode
    pvals.forEach(function(el) {
      var y_vec = y_mode.matrix[el];

      var x_vals = x_mode.map;
      var y_vals = normalize(matvec(x_mode.matrix, y_vec));

      var trace = {
        x: x_vals,
        y: y_vals,
        type: 'scatter',
        name: y_mode.map[el],
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

    // plot!
    Plotly.newPlot(div, data, layout);
  }
}

