var Filer = require('filer'),
    Path = Filer.Path,
    Errors = Filer.Errors,
    CryptoJS = require('crypto-js'),
    async = require('async'),
    cache = {},
    rsync = {};

function configure() {
  var options;
  if(typeof this === 'function') {
    callback = this;
    options = {};
    options.size = 750;
    options.checksum = false;
    options.recursive = false;
    options.time = false;
    options.links = false;
  }
  else {
    options = this || {};
    options.size = options.size || 750;
    options.checksum = options.checksum || false;
    options.recursive = options.recursive || false;
    options.time = options.time || false;
    options.links = options.links || false;
  }
  return options;
}

//MD5 hashing for RSync
//Used from Node.js Anchor module
//MIT Licensed
//https://github.com/ttezel/anchor
function _md5(data) {
  return CryptoJS.MD5(String.fromCharCode(data)).toString();
}

//Weak32 hashing for RSync
//Used from Node.js Anchor module
//MIT Licensed
//https://github.com/ttezel/anchor
function _weak32(data, prev, start, end) {
  var a = 0;
  var b = 0;
  var sum = 0;
  var M = 1 << 16;

  if (!prev) {
    var len = start >= 0 && end >= 0 ? end - start : data.length;
    var i = 0;

      for (; i < len; i++) {
        a += data[i];
        b += a;
      }

      a %= M;
      b %= M;
  } else {
    var k = start;
    var l = end - 1;
    var prev_k = k - 1;
    var prev_l = l - 1;
    var prev_first = data[prev_k];
    var prev_last = data[prev_l];
    var curr_first = data[k];
    var curr_last = data[l];

    a = (prev.a - prev_first + curr_last) % M;
    b = (prev.b - (prev_l - prev_k + 1) * prev_first + a) % M;
  }
  return { a: a, b: b, sum: a + b * M };
}

//Weak16 hashing for RSync
//Used from Node.js Anchor module
//MIT Licensed
//https://github.com/ttezel/anchor
function _weak16(data) {
  return 0xffff & (data >> 16 ^ data*1009);
}

/* RSync Algorithm function
* Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
* Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
* https://github.com/ttezel/anchor
* MIT Licensed
*/
function createHashtable(checksums) {
  var hashtable = {};
  var len = checksums.length;
  var i = 0;
  for (; i < len; i++) {
    var checksum = checksums[i];
    var weak16 = _weak16(checksum.weak);
    if (hashtable[weak16]) {
      hashtable[weak16].push(checksum);
    } else {
      hashtable[weak16] = [checksum];
    }
  }
  return hashtable;
}

/* RSync Algorithm function
* Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
* Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
* https://github.com/ttezel/anchor
* MIT Licensed
*/
function roll(data, checksums, chunkSize) {
  var results = [];
  var hashtable = createHashtable(checksums);
  var length = data.length;
  var start = 0;
  var end = chunkSize > length ? length : chunkSize;
      // Updated when a block matches
  var lastMatchedEnd = 0;
      // This gets updated every iteration with the previous weak 32bit hash
  var prevRollingWeak = null;
  for (; end <= length; start++, end++) {
    var weak = _weak32(data, prevRollingWeak, start, end);
    var weak16 = _weak16(weak.sum);
    var match = false;
    var d;
    prevRollingWeak = weak;
    if (hashtable[weak16]) {
      var len = hashtable[weak16].length;
      var i = 0;
      for (; i < len; i++) {
        if (hashtable[weak16][i].weak === weak.sum) {
          var mightMatch = hashtable[weak16][i];
          var chunk = data.subarray(start, end);
          var strong = _md5(chunk);
          if (mightMatch.strong === strong) {
            match = mightMatch;
            break;
          }
        }
      }
    }
    if (match) {
      if(start < lastMatchedEnd) {
        d = data.subarray(lastMatchedEnd - 1, end);
        results.push({
          data: d,
          index: match.index
        });
      } else if (start - lastMatchedEnd > 0) {
        d = data.subarray(lastMatchedEnd, start);
        results.push({
          data: d,
          index: match.index
        });
      } else {
        results.push({
          index: match.index
        });
      }
      lastMatchedEnd = end;
    } else if (end === length) {
      // No match and last block
      d = data.subarray(lastMatchedEnd);
      results.push({
        data: d
      });
    }
  }
  return results;
}

/* RSync Checksum Function
* Based on Node.js Anchor module checksum function
* Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
* Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
* https://github.com/ttezel/anchor
* MIT Licensed
*/
function checksum (path, options, callback) {
  //var destFS = this;
  this.readFile(path, function (err, data) {
    if (!err) {
      // cache file
      cache[path] = data;  
    }
    else if (err && err.code === 'ENOENT') {
      cache[path] = [];
    }
    else {
      return callback(err);
    }
    var length = cache[path].length;
    var incr = options.size;
    var start = 0;
    var end = incr > length ? length : incr;
    var blockIndex = 0;
    var result = [];
    while (start < length) {
      var chunk  = cache[path].subarray(start, end);
      var weak   = _weak32(chunk).sum;
      var strong = _md5(chunk);
      result.push({
        index: blockIndex,
        weak: weak,
        strong: strong
      });
      // update slice indices
      start += incr;
      end = (end + incr) > length ? length : end + incr;
      // update block index
      blockIndex++;
    }
    return callback(null, result);
  });
}

rsync.sourceList = function getSrcList(srcFs, path, options, callback) {
  configure.call(options);
  var result = [];
  srcFS.lstat(path, function(err, stats) {
    if(err) {
      callback(err);
      return;
    }
    if(stats.isDirectory()) {
      srcFS.readdir(path, function(err, entries) {
        if(err) {
          callback(err);
          return;
        }

        function getSrcContents(_name, callback) {
          var name = Path.join(path, _name);
          srcFS.lstat(name, function(error, stats) {

            if(error) {
              callback(error);
              return;
            }

            var entry = { 
              node: stats.node,
              path: Path.basename(name),
              modified: stats.mtime,
              size: stats.size,
              type: stats.type
            };
            if(options.recursive && stats.isDirectory()) {
              getSrcList(name, function(error, items) {
                if(error) {
                  callback(error);
                  return;
                }
                entry.contents = items;
                result.push(entry);
                callback();
              });
            } else if(stats.isFile() || !options.links) {
              result.push(entry);                
              callback();
            } else if (entry.type === 'SYMLINK'){
              result.push(entry);                
              callback();
            }              
          });
        }

        async.each(entries, getSrcContents, function(error) {
          callback(error, result);
        });
      });
    }
    else {
      var entry = { 
        node: stats.node,
        path: Path.basename(path),
        size: stats.size,
        type: stats.type,
        modified: stats.mtime
      };
      result.push(entry);
      callback(err, result);
    }
  });
};

rsync.checksums = function(fs, destPath, srcList, options, callback) {
  fs.mkdir(destPath, function(err) {
    configure.call(options);
    var result = [];
    function getDirChecksums(entry, callback) {
      var item = { path: entry.path, node: entry.node };
      if(options.recursive && entry.type === 'DIRECTORY') {
        rsync.checksums(fs, Path.join(destPath, entry.path), entry.contents, options, function(error, items) {
          if(error) {
            callback(error);
            return;
          }
          item.contents = items;
          result.push(item);
          callback();
        });
      } else if(entry.type === 'FILE' || !options.links) {
        if(!options.checksum) {
          fs.stat(Path.join(destPath, entry.path), function(err, stat) {
            if(!err && stat.mtime === entry.modified && stat.size === entry.size) {
              callback();
            }
            else {
              checksum.call(fs, Path.join(destPath, entry.path), options, function(err, checksums) {
                if(err) {
                  callback(err);
                  return;
                }
                item.checksum = checksums;
                item.modified = entry.modified;
                result.push(item); 
                callback();               
              });
            }
          }); 
        }
        else {
          checksum.call(fs, Path.join(destPath, entry.path), options, function(err, checksums) {
            if(err) {
              callback(err);
              return;
            }
            item.checksum = checksums;
            item.modified = entry.modified;
            result.push(item); 
            callback();               
          });
        }
      }
      else if(entry.type === 'SYMLINK'){
        if(!options.checksum) {
          fs.stat(Path.join(destPath, entry.path), function(err, stat){
            if(!err && stat.mtime === entry.modified && stat.size === entry.size) {
              callback();
            }
            else {
              item.link = true;
              result.push(item);
              callback();
            }
          });
        } else {
          item.link = true;
          result.push(item);
          callback();
        }
      }           
    }
    async.each(srcList, getDirChecksums, function(error) {
      if(error) {
        callback(err);
      } else if (result.length === 0) {
        callback();
      } else {
        callback(error, result);
      }
    });
  });
};

/* RSync Checksum Function
* Based on Node.js Anchor module diff function
* Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
* Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
* https://github.com/ttezel/anchor
* MIT Licensed
*/
rsync.diff = function(fs, path, checksums, options, callback) {
  //var srcFS = this;
  // roll through the file
  configure.call(options);
  var diffs = [];
  fs.lstat(path, function(err, stat) {
    if(stat.isDirectory()) {
      async.each(checksums, getDiff, function(err) {
        callback(err, diffs);
      }); 
    }
    else if (stat.isFile() || !options.links) {
      fs.readFile(path, function (err, data) {
        if (err) { return callback(err); }
        diffs.push({
          diff: roll(data, checksums[0].checksum, options.size),
          modified: checksums[0].modified,
          path: checksums[0].path
        });
        callback(err, diffs);
      });
    }
    else if (stat.isSymbolicLink()) {
      fs.readlink(path, function(err, linkContents) {
        if(err) {
          callback(err);
          return;
        }
        fs.lstat(path, function(err, stats){
          if(err) {
            callback(err);
            return;
          }
          diffs.push({
            link: linkContents,
            modified: stats.mtime,
            path: path
          });
          callback(err, diffs);
        });
      });
    }
  });

  function getDiff(entry, callback) {
    if(entry.hasOwnProperty('contents')) {
      rsync.diff(fs, Path.join(path, entry.path), entry.contents, function(err, stuff) {
        if(err) {
          callback(err);
          return;
        }
        diffs.push({
          path: entry.path,
          contents: stuff
        });
        callback();
      });
    } else if (entry.hasOwnProperty('link')) {
      fs.readlink(Path.join(path, entry.path), function(err, linkContents) {
        if(err) {
          callback(err);
          return;
        }
        fs.lstat(Path.join(path, entry.path), function(err, stats){
          if(err) {
            callback(err);
            return;
          }
          diffs.push({
            link: linkContents,
            modified: stats.mtime,
            path: entry.path
          });
          callback(err, diffs);
        });
      });
    } else {
      fs.readFile(Path.join(path,entry.path), function (err, data) {
        if (err) { return callback(err); }
        diffs.push({
          diff: roll(data, entry.checksum, options.size),
          modified: entry.modified,
          path: entry.path
        });
        callback(err, diffs);
      });
    }
  }
};

/* RSync Checksum Function
* Based on Node.js Anchor module sync function
* Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
* Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
* https://github.com/ttezel/anchor
* MIT Licensed
*/
rsync.patch = function(fs, path, diff, options, callback) {
  configure.call(options);
  function syncEach(entry, callback) { 

    //get slice of raw file from block's index
    function rawslice(index) {
      var start = index*options.size;
      var end = start + options.size > raw.length ? raw.length : start + options.size;
      return raw.subarray(start, end);
    }
    
    if(entry.hasOwnProperty('contents')) {
      rsync.patch(fs, Path.join(path, entry.path), entry.contents, options, function(err) {
        if(err) {
          callback(err);
          return;
        }
        callback();
      });
    } else if (entry.hasOwnProperty('link')) {
      var syncPath = Path.join(path,entry.path);
      fs.symlink(entry.link, syncPath, function(err){ 
        if(err) {
          callback(err);
          return;
        }
        return callback();
      }); 
    } else {
      var raw = cache[Path.join(path,entry.path)];
      var i = 0;
      var len = entry.diff.length;
      if(typeof raw === 'undefined') {
        return callback('must do checksum() first', null);
      }

      var buf = new Uint8Array();
      for(; i < len; i++) {
        var chunk = entry.diff[i];
        if(typeof chunk.data === 'undefined') { //use slice of original file
          buf = appendBuffer(buf, rawslice(chunk.index));
        } else {
          buf = appendBuffer(buf, chunk.data);
          if(typeof chunk.index !== 'undefined') {
            buf = appendBuffer(buf, rawslice(chunk.index));
          }
        }
      }
      delete cache[Path.join(path,entry.path)];
      fs.writeFile(Path.join(path,entry.path), buf, function(err) {
        if(err) {
          callback(err);
          return;
        }
        if(options.time) {
          fs.utimes(Path.join(path,entry.path), entry.modified, entry.modified, function(err) {
            if(err) {
              callback(err);
              return;
            }
            return callback();
          });
        }
        else {
          return callback();
        }
      });

    }
  }
  fs.mkdir(path, function(err){
    if(err && err.code != "EEXIST"){
      callback(err);
      return;   
    }
    async.each(diff, syncEach, function(err) {
      callback(err);
    });
  });
};

function appendBuffer( buffer1, buffer2 ) {
  var tmp = new Uint8Array( buffer1.byteLength + buffer2.byteLength );
  tmp.set( new Uint8Array( buffer1 ), 0 );
  tmp.set( new Uint8Array( buffer2 ), buffer1.byteLength );
  return tmp;
}

module.exports = rsync;