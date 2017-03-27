
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
  constructor(cpd, divID)
  {
    console.log('Constructing CPDDisplay, attaching to ' + divID + '.');

    this.cpd = cpd;
    this.div = '#' + divID;

    // build plotting div

    // plotModes[0] = x-axis, plotModes[1] = y-axis
    this.plotModes = [0, 1];
    if(this.cpd.getNumModes() == 1) {
      this.plotModes[1] = 0;
    }

    this._buildModeSelection();
  }


  //
  // Public interface
  //

  // axis=0 = x-axis, axis=1, y-axis
  setPlotMode(axis, modeName)
  {
    if(axis > this.plotModes.length) {
      alert('Axis: ' + axis + ' invalid.');
      return;
    }

    // Search through CPD modes and find one with a matching name.
    var found = false;
    for(var m=0; m < this.cpd.getNumModes(); ++m) {
      var mode = this.cpd.getMode(m);
      if(mode.name == modeName) {
        this.plotModes[axis] = m;
        console.log('Setting plotMode[' + axis + ']: ' + m);
        found = true;
        break;
      }
    }

    if(!found) {
      alert('ERROR: could not find mode "' + modeName + '".');
      return;
    }

    this._buildModeSelection();
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
    console.log('CPDDisplay: Building selectize.');

    if(this.plotModes.length != 2) {
      alert('ERROR: CPDDisplay currently requires two modes to plot.');
      return;
    }

    // prepare nav and plotting region
    $(this.div).empty().append(`
      <nav class='cpd_nav'>
        <div id='mode_a_picker' class='mode_picker'></div>
        <div id='mode_b_picker' class='mode_picker'></div>
        <div id='plot_picker'></div>
      </nav>
      <div id='plotly'></div>
    `);

    this.x_mode = this.cpd.getMode(this.plotModes[0]);
    this.y_mode = this.cpd.getMode(this.plotModes[1]);

    // fill in selectize options
    var picker_div = this.div + ' #plot_picker';
    $(picker_div).empty();
    this._buildSelectize(picker_div, this.y_mode);
  }


  _buildSelectize(div_select, mode)
  {
    var self = this;

    var options = new Array(mode.dim);
    for(var i=0; i < mode.dim; ++i) {
      options[i] = { value: i, label: mode.map[i] };
    }

    $(div_select).append('<select></select>');

    var select = $(div_select + ' select:last-child').selectize({
      options: options,
      labelField: 'label',
      valueField: 'value',
      maxItems: null,
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

