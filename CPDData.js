
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

    this.rank = 0;
    this.numModes = 0;

    this.names   = new Array();
    this.maps    = new Array();
    this.factors = new Array();

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
  // Private functions
  //

  // TODO: ensure matrix and map are the same length
  _addMode()
  {
    var self = this;

    var name      = $(self.divName + ' .mode_name').val();
    var matrixLoc = $(self.divName + ' .mode_matrix')[0].files[0];
    var mapLoc    = $(self.divName + ' .mode_map')[0].files[0];

    // reset form
    $(self.divName + ' .mode_name').val('');
    $(self.divName + ' .mode_matrix').val('');
    $(self.divName + ' .mode_map').val('');

    if(!name) {
      name = 'Mode ' + (self.numModes + 1);
    }

    if(!matrixLoc) {
      alert('Matrix required for mode addition.');
      return;
    }

    console.log('Adding mode ' + name);

    self.names.push(name);

    // Load the matrix
    // TOOD: We should instead build a new row and pass that to the callback.
    // As it loads, give it the loading snowflake...
    parse_matrix(matrixLoc, function(data) {
      self.factors.push(data);

      if(self.rank == 0) {
        self.rank = data[0].length;
      } else {
        if(self.rank != data[0].length) {
          alert('Error! expecting matrix of rank ' + self.rank);
        }
      }

      self._renderModeTable('tblModes');
    });

    // Load the map, or just null if unspecified.
    if(mapLoc) {
      parse_matrix(mapLoc, function(data) {
        self.maps.push(flatten_map(data));
      });
    } else {
      self.maps.push(null)
    }

    self.numModes++;
  }



  // TODO: this shouldn't clear the table each time..
  _renderModeTable()
  {
    // grab the table body
    var tbl_body = $(this.divName + ' > .cpd_tbl > tbody')[0];

    // clear the table
    $(tbl_body).children().remove();

    // Add modes
    for(var mode = 0; mode < this.numModes; ++mode) {
      var tr_string = '<tr>';
      tr_string += '<td>' + this.names[mode] + '</td>';
      tr_string += '<td>' + this.factors[mode].length + '</td>';
      tr_string += '<td>' + 0 + '</td>';
      tr_string += '<td>' + 0 + '</td>';
      tr_string += '<td> <input type="button" onclick="return false;" value="x"> </td>';
      tr_string += '</tr>';
      $(tbl_body).append(tr_string);
    }
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
    $(self.divName + ' .add_mode').bind('click', function() {self._addMode()});

    $(self.divName).append(`
      <table class='cpd_tbl'>
        <thead>
          <tr>
            <th> Name </th>
            <th> Length </th>
            <th> Matrix </th>
            <th> Map </th>
            <th> Remove? </th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    `);
  }
}

