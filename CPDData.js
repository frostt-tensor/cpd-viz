
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
  constructor()
  {
    console.log('Creating new CPDData instance.');

    this.rank = 0;
    this.numModes = 0;

    this.maps = new Array();
    this.factors = new Array();
  }


  // TODO: ensure matrix and map are the same length
  addMode(name, matrixLoc, mapLoc)
  {
    if(!matrixLoc) {
      alert('Matrix required for mode addition.');
      return;
    }

    var self = this;

    parse_matrix(matrixLoc, function(data) {
      self.factors.push(data);

      if(self.rank == 0) {
        self.rank = data[0].length;
      } else {
        if(self.rank != data[0].length) {
          alert('Error! expecting matrix of rank ' + self.rank);
        }
      }
    });

    if(mapLoc) {
      parse_matrix(mapLoc, function(data) {
        self.maps.push(flatten_map(data));
      });
    } else {
      self.maps.push([]);
    }

    self.numModes++;
  }
}

