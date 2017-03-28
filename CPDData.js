
// Recursive algorithms for this can blow the call stack.
function flatten_map(a){
    for(var i=0; i<a.length; i++){
        a[i] = a[i][0];
    }
    return a;
}


// parse matrix at url, apply callback to data
// Papa.parse call is async.
function parse_matrix(url, callback)
{
  console.log('Loading ' + url);

  Papa.parse(url, {
    download: true,
    delimiter: ' ',
    worker: true,
    skipEmptyLines: true,
    complete: function(results) {

      // Remove last column if empty. Happens when lines have trailing spaces.
      if(results.data[0].slice(-1) == '') {
        for(var row=0; row < results.data.length; ++row) {
          results.data[row].pop();
        }
      }

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



class CPDData
{
  constructor(divName)
  {
    console.log('Creating new CPDData instance.');

    this.divName = '#' + divName;


    this._clearCPD();

    this._buildModeTable();
  }



  //
  // Public interface
  //

  getNumModes()
  {
    return this.numModes;
  }


  getMode(mode)
  {
    // Maps are optional, just fill with [1..dim] if unspecified.
    if(!this.maps[mode]) {
      this.maps[mode] = new Array(this.factors[mode].length);
      for(var i=0; i < this.maps[mode].length; ++i) {
        this.maps[mode][i] = i+1;
      }
    }

    var dict = {
      name   : this.names[mode],
      matrix : this.factors[mode],
      map    : this.maps[mode],
      dim    : this.factors[mode].length
    };

    return dict;
  }



  //
  // configModes should be a list of structures with fields:
  // configModes = [
  //   {
  //      'name',
  //      'matrix_url',
  //      'map_url',
  //   },
  //   ...
  // ]
  //
  addCustomConfig(configModes)
  {
    var text = "Continue loading?\nWarning to mobile users: this may use ~100MB of data.";
    if(confirm(text) != true) {
      $(this.display).empty().append("Data not loaded. Refresh the page to try again.");
      return;
    }

    for(var m=0; m < configModes.length; ++m) {
      var name = configModes[m].name;
      var matrixURL = configModes[m].matrix_url;
      var mapURL = configModes[m].map_url;

      this._registerMode(name, matrixURL, mapURL);
    }
  }


  delMode(modeIdx)
  {
    console.log('Removing mode ' + modeIdx);

    if(modeIdx > this.numModes) {
      alert('Cannot remove mode ' + modeIdx + '. Have only' + this.numModes+'.');
      return;
    }

    this.names.splice(modeIdx, 1);
    this.maps.splice(modeIdx, 1);
    this.factors.splice(modeIdx, 1);

    this.numModes--;

    // If we have removed the last mode, forget things such as rank.
    if(this.numModes == 0) {
      this._clearCPD();
    }
    this._renderModeTable();
  }






  //
  // Private functions
  //

  // A constructor for the CPD-specific data.
  _clearCPD()
  {
    this.rank = 0;
    this.numModes = 0;

    this.names   = new Array();
    this.maps    = new Array();
    this.factors = new Array();
  }


  // add a new form from the cpd_build form.
  _addFormMode()
  {
    var name      = $(this.divName + ' .mode_name').val();
    var matrixLoc = $(this.divName + ' .mode_matrix')[0].files[0];
    var mapLoc    = $(this.divName + ' .mode_map')[0].files[0];

    // reset form
    $(this.divName + ' .mode_name').val('');
    $(this.divName + ' .mode_matrix').val('');
    $(this.divName + ' .mode_map').val('');

    this._registerMode(name, matrixLoc, mapLoc);
  }



  // TODO: ensure matrix and map are the same length
  _registerMode(name, matrixLoc, mapLoc)
  {
    var self = this;

    console.log('Registering mode with {name: ' + name + ' matrix: ' + 
        matrixLoc + ' mapLoc: ' + mapLoc + '}.');

    if(!name) {
      name = 'Mode ' + (self.numModes + 1);
    }

    if(!matrixLoc) {
      alert('Matrix required for mode addition.');
      return;
    }

    console.log('Adding mode ' + name);

    // Push empty values -- these will be written to as data is loaded async.
    self.names.push(name);
    self.factors.push('loading');

    // Maps optional
    if(mapLoc) {
      self.maps.push('loading');
    } else {
      self.maps.push(null);
    }

    var curr_mode = self.numModes;
    self.numModes++;
    self._renderModeTable('tblModes');


    //
    // BEGIN ASYNC
    //

    // Load the matrix
    // TODO: We should instead build a new row and pass that to the callback.
    // As it loads, give it the loading snowflake...
    parse_matrix(matrixLoc, function(data) {
      self.factors[curr_mode] = data;

      if(self.rank == 0) {
        self.rank = data[0].length;
      } else {
        if(self.rank != data[0].length) {
          alert('Error! expecting matrix of rank ' + self.rank + '. Found ' + data[0].length);
        }
      }

      self._renderModeTable('tblModes');
    });

    // Load the map if provided.
    if(mapLoc) {
      parse_matrix(mapLoc, function(data) {
        self.maps[curr_mode] = flatten_map(data);
        self._renderModeTable('tblModes');
      });
    }
  }



  // TODO: this shouldn't clear the table each time..
  _renderModeTable()
  {
    var self = this;

    // grab the table body
    var tbl_body = $(this.divName + ' > .cpd_tbl > tbody')[0];

    // clear the table
    $(tbl_body).children().remove();

    // A silly array [0 .. numModes) that lets us use forEach(). The reason we
    // want forEach() is to give each iteration its own variable scope
    // (closure), which lets us bind ids/buttons to iterations.
    var tbl_rows = new Array(this.numModes);
    for(var m=0; m < this.numModes; ++m) {
      tbl_rows[m] = self;
    }

    // Add modes
    tbl_rows.forEach(function(cpd, mode) {
      var tr_string = '<tr>';
      tr_string += '<td>' + cpd.names[mode] + '</td>';

      tr_string += '<td>';
      if(cpd.factors[mode] == 'loading') {
        tr_string += '-';
      } else {
        tr_string += cpd.factors[mode].length;
      }
      tr_string += '</td>';

      // display loading or OK symbols

      // Matrices
      tr_string += '<td>';
      if(cpd.factors[mode] == 'loading') {
        tr_string += "<i class='fa fa-snowflake-o fa-spin fa-fw'></i>";
      } else {
        tr_string += "<i class='fa fa-check fa-fw'></i>";
      }
      tr_string += '</td>';

      // Maps
      tr_string += '<td>';
      if(cpd.maps[mode] == 'loading') {
        tr_string += "<i class='fa fa-snowflake-o fa-spin fa-fw'></i>";
      } else if(cpd.maps[mode] == null) {
        tr_string += '-';
      } else {
        tr_string += "<i class='fa fa-check fa-fw'></i>";
      }
      tr_string += '</td>';

      // Delete button
      tr_string += "<td> <button id=rmMode" + mode + "><i class='fa fa-trash fa-fw'></i></button> </td>";
      tr_string += '</tr>';

      $(tbl_body).append(tr_string);
      $(cpd.divName + ' #rmMode' + mode).bind('click', function() {
          cpd.delMode(mode)});
    });
  }


  // Build a form for submitting new modes and a table for displaying the
  // loaded modes.
  _buildModeTable()
  {
    var self = this;

    $(self.divName).append(`
      <form id='add_mode_form' onsubmit='return false;'>
        name:    <input type='text', class='mode_name'>
        matrix*: <input type='file', class='mode_matrix'>
        map:     <input type='file', class='mode_map'>
        <input class='add_mode' type='submit' value='Add mode'>
      </form>
    `);
    $(self.divName + ' .add_mode').bind('click', function() {self._addFormMode()});

    $(self.divName).append(`
      <table class='cpd_tbl'>
        <thead>
          <tr>
            <th> Name </th>
            <th> Length </th>
            <th> Matrix </th>
            <th> Map </th>
            <th> </th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    `);
  }
}

