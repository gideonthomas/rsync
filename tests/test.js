var Filer = require('filer'),
    rsync = require('../rsync'),
    expect = require('chai').expect;

afterEach(function(fs))

describe('Rsync', function() {
  
  it('should fail generating sourceList if filesystem is null', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    rsync.sourceList(null, '/', function(err) {  
        expect(err).to.exist;
        expect(err.code).to.equal('EINVAL');
        done();
    });
  });
  
  it('should fail generating checksums if filesystem is null', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    rsync.checksums(null, '/', [], function(err) {  
        expect(err).to.exist;
        expect(err.code).to.equal('EINVAL');
        done();
    });
  });
  
  it('should fail generating diffs if filesystem is null', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    rsync.diff(null, '/', [],  function(err) {  
        expect(err).to.exist;
        expect(err.code).to.equal('EINVAL');
        done();
    });
  });
  
  it('should fail patching if filesystem is null', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    rsync.patch(null, '/', [], function(err) {  
        expect(err).to.exist;
        expect(err.code).to.equal('EINVAL');
        done();
    });
  });

  it('should fail generating sourceList if source path is null', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    rsync.sourceList(fs, null, function(err) {  
        expect(err).to.exist;
        expect(err.code).to.equal('EINVAL');
        done();
    });
  });
  
  it('should fail generating checksums if source path is null', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    rsync.checksums(fs, null, [], function(err) {  
        expect(err).to.exist;
        expect(err.code).to.equal('EINVAL');
        done();
    });
  });
  
  it('should fail generating diffs if source path is null', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    rsync.diff(fs, null, [], function(err) {  
        expect(err).to.exist;
        expect(err.code).to.equal('EINVAL');
        done();
    });
  });
  
  it('should fail patching if source path is null', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    rsync.patch(fs, null, [], function(err) {  
        expect(err).to.exist;
        expect(err.code).to.equal('EINVAL');
        done();
    });
  });

  it('should fail if source path doesn\'t exist', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

      rsync.sourceList(fs, '/1.txt', function(err) {
          expect(err).to.exist;
          expect(err.code).to.equal('ENOENT');
          done();
      });
  });

  it('should succeed if the source file is different in content but not length from the destination file. (Destination edited)', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.writeFile('/1.txt','This is my file. It does not have any typos.','utf8',function(err) { 
        expect(err).to.not.exist;
        fs.writeFile('/test/1.txt','This iz mi fiel. It doez not have any topos,', 'utf8', function(err) {
          expect(err).to.not.exist;
          rsync.sourceList(fs, '/1.txt', {recursive: true, size: 5 }, function(err, data) {
            expect(err).to.not.exist;
            rsync.checksums(fs, '/test', data, {recursive: true, size: 5 }, function(err, data) {
              expect(err).to.not.exist;
              rsync.diff(fs, '/1.txt', data, {recursive: true, size: 5 }, function(err, data) {
                expect(err).to.not.exist;
                rsync.patch(fs, '/test', data, {recursive: true, size: 5 }, function(err) {
                  expect(err).to.not.exist;
                  fs.readFile('/test/1.txt', 'utf8', function(err, data) {
                    expect(err).to.not.exist;
                    expect(data).to.exist;
                    expect(data).to.equal('This is my file. It does not have any typos.');
                    done();
                  });
                });
              });
            });
          });
        }); 
      });   
    });
  });

  it('should succeed if the source file is longer than the destination file. (Destination appended)', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/test', function(err) {
      console.log(err);
      expect(err).to.not.exist;
      fs.writeFile('/1.txt','This is my file. It is longer than the destination file.', 'utf8', function(err) { 
        console.log(err);
        expect(err).to.not.exist;
        fs.writeFile('/test/1.txt','This is my file.','utf8',function(err) {
          console.log(err);
          expect(err).to.not.exist;
          rsync.sourceList(fs, '/1.txt', {recursive: true, size: 5 }, function(err, data) {
            console.log(err);
            expect(err).to.not.exist;
            rsync.checksums(fs, '/test', data, {recursive: true, size: 5 }, function(err, data) {
              console.log(err);
              expect(err).to.not.exist;
              rsync.diff(fs, '/1.txt', data, {recursive: true, size: 5 }, function(err, data) {
                console.log(err);
                expect(err).to.not.exist;
                rsync.patch(fs, '/test', data, {recursive: true, size: 5 }, function(err) {
                  console.log(err);
                  expect(err).to.not.exist;
                  fs.readFile('/test/1.txt', 'utf8', function(err, data){
                    console.log(err);
                    expect(err).to.not.exist;
                    expect(data).to.exist;
                    expect(data).to.equal('This is my file. It is longer than the destination file.');
                    done();
                  });
                });
              });
            });
          });
        }); 
      });   
    });
  });

  it('should succeed if the source file shorter than the destination file. (Destination truncated)', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.writeFile('/1.txt','This is my file.','utf8',function(err) { 
        expect(err).to.not.exist;
        fs.writeFile('/test/1.txt','This is my file. It is longer than the source version.', 'utf8', function(err) {
          expect(err).to.not.exist;
          rsync.sourceList(fs, '/1.txt', {recursive: true, size: 5 }, function(err, data) {
            expect(err).to.not.exist;
            rsync.checksums(fs, '/test', data, {recursive: true, size: 5 }, function(err, data) {
              expect(err).to.not.exist;
              rsync.diff(fs, '/1.txt', data, {recursive: true, size: 5 }, function(err, data) {
                expect(err).to.not.exist;
                rsync.patch(fs, '/test', data, {recursive: true, size: 5 }, function(err) {
                  expect(err).to.not.exist;
                  fs.readFile('/test/1.txt', 'utf8', function(err, data){
                    expect(err).to.not.exist;
                    expect(data).to.exist;
                    expect(data).to.equal('This is my file.');
                    done();
                  });
                });
              });
            });
          });
        }); 
      });   
    });
  });

  it('should succeed if the source file does not exist in the destination folder (Destination file created)', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.writeFile('/1.txt','This is my file. It does not exist in the destination folder.', 'utf8', function(err) { 
        expect(err).to.not.exist;
        rsync.sourceList(fs, '/1.txt', {recursive: true, size: 5 }, function(err, data) {
          expect(err).to.not.exist;
          rsync.checksums(fs, '/test', data, {recursive: true, size: 5 }, function(err, data) {
            expect(err).to.not.exist;
            rsync.diff(fs, '/1.txt', data, {recursive: true, size: 5 }, function(err, data) {
              expect(err).to.not.exist;
              rsync.patch(fs, '/test', data, {recursive: true, size: 5 }, function(err) {
                expect(err).to.not.exist;
                fs.readFile('/test/1.txt', 'utf8', function(err, data) {
                  expect(err).to.not.exist;
                  expect(data).to.exist;
                  expect(data).to.equal('This is my file. It does not exist in the destination folder.');
                  done();
                });
              });
            });
          });
        });
      }); 
    });   
  });

  it('should succeed if no options are provided', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.writeFile('/1.txt','This is my file. It does not exist in the destination folder.', 'utf8', function(err) { 
        expect(err).to.not.exist;
        rsync.sourceList(fs, '/1.txt', {recursive: true, size: 5 }, function(err, data) {
          expect(err).to.not.exist;
          rsync.checksums(fs, '/test', data, {recursive: true, size: 5 }, function(err, data) {
            expect(err).to.not.exist;
            rsync.diff(fs, '/1.txt', data, {recursive: true, size: 5 }, function(err, data) {
              expect(err).to.not.exist;
              rsync.patch(fs, '/test', data, {recursive: true, size: 5 }, function(err) {
                expect(err).to.not.exist;
                fs.readFile('/test/1.txt', 'utf8', function(err, data){
                  expect(err).to.not.exist;
                  expect(data).to.exist;
                  expect(data).to.equal('This is my file. It does not exist in the destination folder.');
                  done();
                });
              });
            });
          });
        }); 
      });   
    });
  });

  it('should do nothing if the source file and destination file have the same mtime and size with \'checksum = false\' flag (Default)', function(done){
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
    var date = Date.parse('1 Oct 2000 15:33:22'); 
    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.writeFile('/1.txt', 'This is a file.', 'utf8', function(err) {
        expect(err).to.not.exist;
        fs.writeFile('/test/1.txt', 'Different file.', 'utf8', function(err) {
          expect(err).to.not.exist;
          fs.utimes('/1.txt', date, date, function(err) {
            expect(err).to.not.exist;
            fs.utimes('/test/1.txt', date, date, function(err) {
              expect(err).to.not.exist;
              rsync.sourceList(fs, '/1.txt', {recursive: true, size: 5, checksum: false}, function(err, data) {
                expect(err).to.not.exist;
                rsync.checksums(fs, '/test', data, {recursive: true, size: 5, checksum: false}, function(err, data) {
                  expect(err).to.not.exist;
                  rsync.diff(fs, '/1.txt', data, {recursive: true, size: 5, checksum: false}, function(err, data) {
                    expect(err).to.not.exist;
                    rsync.patch(fs, '/test', data, {recursive: true, size: 5, checksum: false}, function(err) {
                      expect(err).to.not.exist;
                      fs.readFile('/test/1.txt', 'utf8', function(err, data) {
                        expect(err).to.not.exist;
                        expect(data).to.exist;
                        expect(data).to.equal('Different file.');
                        done();
                      });
                    });
                  });
                });
              });   
            });
          });
        });
      });
    });
  });

  it('should succeed if the source file and destination file have the same mtime and size with \'checksum = true\' flag', function(done){
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.writeFile('/1.txt', 'This is a file.', 'utf8', function(err) {
        expect(err).to.not.exist;
        fs.writeFile('/test/1.txt', 'Different file.', 'utf8', function(err) {
          expect(err).to.not.exist;
          rsync.sourceList(fs, '/1.txt', {recursive: true, size: 5, checksum: true}, function(err, data) {
            expect(err).to.not.exist;
            rsync.checksums(fs, '/test', data, {recursive: true, size: 5, checksum: true}, function(err, data) {
              expect(err).to.not.exist;
              rsync.diff(fs, '/1.txt', data, {recursive: true, size: 5, checksum: true}, function(err, data) {
                expect(err).to.not.exist;
                rsync.patch(fs, '/test', data, {recursive: true, size: 5, checksum: true}, function(err) {
                  expect(err).to.not.exist;
                  fs.readFile('/test/1.txt', 'utf8', function(err, data) {
                    expect(err).to.not.exist;
                    expect(data).to.exist;
                    expect(data).to.equal('This is a file.');
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('should succeed and update mtime with \'time = true\' flag', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
    var mtime;

    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.writeFile('/1.txt','This is my file.', 'utf8', function(err) { 
        expect(err).to.not.exist;
        fs.stat('/1.txt', function(err, stats){
          expect(err).to.not.exist;
          expect(stats).to.exist;
          mtime = stats.mtime;
          rsync.sourceList(fs, '/1.txt', {recursive: true, size: 5, time: true}, function(err, data) {
            expect(err).to.not.exist;
            rsync.checksums(fs, '/test', data, {recursive: true, size: 5, time: true}, function(err, data) {
              expect(err).to.not.exist;
              rsync.diff(fs, '/1.txt', data, {recursive: true, size: 5, time: true}, function(err, data) {
                expect(err).to.not.exist;
                rsync.patch(fs, '/test', data, {recursive: true, size: 5, time: true}, function(err) {
                  expect(err).to.not.exist;
                  fs.readFile('/test/1.txt', 'utf8', function(err, data){
                    expect(err).to.not.exist;
                    expect(data).to.exist;
                    expect(data).to.equal('This is my file.');
                    fs.stat('/test/1.txt', function(err, stats){
                      expect(err).to.not.exist;
                      expect(stats).to.exist;
                      expect(stats.mtime).to.equal(mtime);
                      done();
                    });
                  });
                });
              });
            });
          }); 
        })
      });   
    });
  });

 it('should copy a symlink as a file with \'links = false\' flag (Default)', function(done){
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/test', function(err){
      expect(err).to.not.exist;
      fs.writeFile('/1.txt', 'This is a file', function(err){
        expect(err).to.not.exist;
        fs.symlink('/1.txt', '/2', function(err){
          expect(err).to.not.exist;
          rsync.sourceList(fs, '/2', {recursive: true, size: 5}, function(err, data) {
            expect(err).to.not.exist;
            rsync.checksums(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
              expect(err).to.not.exist;
              rsync.diff(fs, '/2', data, {recursive: true, size: 5}, function(err, data) {
                expect(err).to.not.exist;
                rsync.patch(fs, '/test', data, {recursive: true, size: 5}, function(err) {
                  expect(err).to.not.exist;
                  fs.unlink('/1.txt', function(err){
                    expect(err).to.not.exist;
                    fs.lstat('/test/2', function(err, stats){
                      expect(err).to.not.exist;
                      expect(stats).to.exist;
                      expect(stats.type).to.equal('FILE');
                      fs.readFile('/test/2', 'utf8', function(err, data){
                        expect(err).to.not.exist;
                        expect(data).to.exist;
                        expect(data).to.equal('This is a file');
                        done();
                      });
                    });  
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('should copy a symlink as a file with \'links = true\' flag', function(done){
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
   
    fs.mkdir('/test', function(err){
      expect(err).to.not.exist;
      fs.writeFile('/apple.txt', 'This is a file', function(err){
        expect(err).to.not.exist;
        fs.symlink('/apple.txt', '/apple', function(err){
          expect(err).to.not.exist;
          rsync.sourceList(fs, '/apple', {recursive: true, size: 5, links: true}, function(err, data) {
            expect(err).to.not.exist;
            rsync.checksums(fs, '/test', data, {recursive: true, size: 5, links: true}, function(err, data) {
              expect(err).to.not.exist;
              rsync.diff(fs, '/apple', data, {recursive: true, size: 5, links: true}, function(err, data) {
                expect(err).to.not.exist;
                rsync.patch(fs, '/test', data, {recursive: true, size: 5, links: true}, function(err) {
                  expect(err).to.not.exist;
                  fs.lstat('/test/apple', function(err, stats){
                    expect(err).to.not.exist;
                    expect(stats).to.exist;
                    expect(stats.type).to.equal('SYMLINK');
                    fs.readFile('/test/apple', 'utf8', function(err, data){
                      expect(err).to.not.exist;
                      expect(data).to.exist;
                      expect(data).to.equal('This is a file');
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('should copy a symlink as a file with \'links = false\' flag and update time with \'time: true\' flag', function(done){
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
    var mtime;

    fs.mkdir('/test', function(err){
      expect(err).to.not.exist;
      fs.writeFile('/1.txt', 'This is a file', function(err){
        expect(err).to.not.exist;
        fs.symlink('/1.txt', '/2', function(err){
          expect(err).to.not.exist;
          fs.lstat('/2', function(err, stats){
            expect(err).to.not.exist;
            expect(stats).to.exist;
            mtime = stats.mtime;
            rsync.sourceList(fs, '/2', {recursive: true, size: 5, time: true}, function(err, data) {
              expect(err).to.not.exist;
              rsync.checksums(fs, '/test', data, {recursive: true, size: 5, time: true}, function(err, data) {
                expect(err).to.not.exist;
                rsync.diff(fs, '/2', data, {recursive: true, size: 5, time: true}, function(err, data) {
                  expect(err).to.not.exist;
                  rsync.patch(fs, '/test', data, {recursive: true, size: 5, time: true}, function(err) {
                    expect(err).to.not.exist;
                    fs.unlink('/1.txt', function(err){
                      expect(err).to.not.exist;
                      fs.lstat('/test/2', function(err, stats){
                        expect(err).to.not.exist;
                        expect(stats).to.exist;
                        expect(stats.mtime).to.equal(mtime);
                        expect(stats.type).to.equal('FILE');
                        fs.readFile('/test/2', 'utf8', function(err, data){
                          expect(err).to.not.exist;
                          expect(data).to.exist;
                          expect(data).to.equal('This is a file');
                          done();
                        });
                      });  
                    });
                  });
                });
              });
            });
          })
        });
      });
    });
  });

  it('should succeed if the destination folder does not exist (Destination directory created)', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.writeFile('/1.txt','This is my file. It does not exist in the destination folder.', 'utf8', function(err) { 
      expect(err).to.not.exist;
      rsync.sourceList(fs, '/1.txt', {recursive: true, size: 5}, function(err, data) {
        expect(err).to.not.exist;
        rsync.checksums(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
          expect(err).to.not.exist;
          rsync.diff(fs, '/1.txt', data, {recursive: true, size: 5}, function(err, data) {
            expect(err).to.not.exist;
            rsync.patch(fs, '/test', data, {recursive: true, size: 5}, function(err) {
              expect(err).to.not.exist;
              fs.readFile('/test/1.txt', 'utf8', function(err, data){
                expect(err).to.not.exist;
                expect(data).to.exist;
                expect(data).to.equal('This is my file. It does not exist in the destination folder.');
                done();
              });
            });
          });
        });
      }); 
    });   
  });

  it('should succeed syncing a directory if the destination directory is empty', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.mkdir('/test2', function(err) {
        expect(err).to.not.exist;
        fs.writeFile('/test/1.txt','This is my 1st file. It does not have any typos.', 'utf8', function(err) { 
          expect(err).to.not.exist;
          fs.writeFile('/test/2.txt','This is my 2nd file. It is longer than the destination file.', 'utf8', function(err) { 
            expect(err).to.not.exist;
            rsync.sourceList(fs, '/test', {recursive: true, size: 5}, function(err, data) {
              expect(err).to.not.exist;
              rsync.checksums(fs, '/test2', data, {recursive: true, size: 5}, function(err, data) {
                expect(err).to.not.exist;
                rsync.diff(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
                  expect(err).to.not.exist;
                  rsync.patch(fs, '/test2', data, {recursive: true, size: 5}, function(err) {
                    expect(err).to.not.exist;
                    fs.readFile('/test2/1.txt', 'utf8', function(err, data){
                      expect(err).to.not.exist;
                      expect(data).to.exist;
                      expect(data).to.equal('This is my 1st file. It does not have any typos.');
                      fs.readFile('/test2/2.txt', 'utf8', function(err, data){
                        expect(err).to.not.exist;
                        expect(data).to.exist;
                        expect(data).to.equal('This is my 2nd file. It is longer than the destination file.');
                        done();
                      });
                    });
                  });
                });
              });
            });
          }); 
        });   
      });
    });
  });

  it('should succeed syncing a directory if the destination directory doesn\'t exist', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.writeFile('/test/1.txt','This is my 1st file. It does not have any typos.', 'utf8', function(err) { 
        expect(err).to.not.exist;
        fs.writeFile('/test/2.txt','This is my 2nd file. It is longer than the destination file.', 'utf8', function(err) { 
        expect(err).to.not.exist;
          rsync.sourceList(fs, '/test', {recursive: true, size: 5}, function(err, data) {
            expect(err).to.not.exist;
            rsync.checksums(fs, '/test2', data, {recursive: true, size: 5}, function(err, data) {
              expect(err).to.not.exist;
              rsync.diff(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
                expect(err).to.not.exist;
                rsync.patch(fs, '/test2', data, {recursive: true, size: 5}, function(err) {
                  expect(err).to.not.exist;
                  fs.readFile('/test2/1.txt', 'utf8', function(err, data){
                    expect(err).to.not.exist;
                    expect(data).to.exist;
                    expect(data).to.equal('This is my 1st file. It does not have any typos.');
                    fs.readFile('/test2/2.txt', 'utf8', function(err, data){
                      expect(err).to.not.exist;
                      expect(data).to.exist;
                      expect(data).to.equal('This is my 2nd file. It is longer than the destination file.');
                      done();
                    });
                  });
                });
              });
            });
          });
        }); 
      });   
    });
  });

  it('should succeed syncing a directory recursively, skipping same-size and time files (recursive: true)', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
    var date = Date.parse('1 Oct 2000 15:33:22'); 

    fs.mkdir('/test/sync', function(err){
      expect(err).to.not.exist;
      fs.mkdir('/test2/sync', function(err){
        expect(err).to.not.exist;
        fs.writeFile('/test/1.txt','This is my 1st file.', 'utf8', function(err) { 
          expect(err).to.not.exist;
          fs.writeFile('/test/sync/2.txt','This is my 2nd file.', 'utf8', function(err) { 
            expect(err).to.not.exist;
            fs.writeFile('/test/sync/3.txt','This is my 3rd file.', 'utf8', function(err) { 
              expect(err).to.not.exist;
              fs.writeFile('/test2/sync/3.txt','This shouldn\'t sync.', 'utf8', function(err) { 
                expect(err).to.not.exist;
                fs.utimes('/test/sync/3.txt', date, date, function(err) {
                  expect(err).to.not.exist;
                  fs.utimes('/test2/sync/3.txt', date, date, function(err) {
                    expect(err).to.not.exist;
                    rsync.sourceList(fs, '/test', {recursive: true, size: 5}, function(err, data) {
                      expect(err).to.not.exist;
                      rsync.checksums(fs, '/test2', data, {recursive: true, size: 5}, function(err, data) {
                        expect(err).to.not.exist;
                        rsync.diff(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
                          expect(err).to.not.exist;
                          rsync.patch(fs, '/test2', data, {recursive: true, size: 5}, function(err) {
                            expect(err).to.not.exist;
                            fs.readFile('/test2/1.txt', 'utf8', function(err, data){
                              expect(err).to.not.exist;
                              expect(data).to.exist;
                              expect(data).to.equal('This is my 1st file.');
                              fs.readFile('/test2/sync/2.txt', 'utf8', function(err, data){
                                expect(err).to.not.exist;
                                expect(data).to.exist;
                                expect(data).to.equal('This is my 2nd file.');
                                fs.readFile('/test2/sync/3.txt', 'utf8', function(err, data){
                                  expect(err).to.not.exist;
                                  expect(data).to.exist;
                                  expect(data).to.equal('This shouldn\'t sync.')
                                  done();
                                });
                              });
                            }); 
                          });
                        });
                      });
                    });

                  }); 
                });

              });
            });
          });
        });
      });
    });
  });

  it('qweefw', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
    var fs2 = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/projects', function(err){
      expect(err).to.not.exist;
      fs.mkdir('/projects/proj_1', function(err){
        expect(err).to.not.exist;
        fs.mkdir('/projects/proj_2', function(err) {
          expect(err).to.not.exist;
          fs.writeFile('/projects/proj_1/index.html','Hello world', 'utf8', function(err) { 
            expect(err).to.not.exist;
            fs.writeFile('/projects/proj_1/styles.css','CSS', 'utf8', function(err) { 
              expect(err).to.not.exist;
              fs.writeFile('/projects/proj_2/styles2.css','CSS', 'utf8', function(err) { 
                expect(err).to.not.exist;
                fs.mkdir('/projects/proj_2/inside_proj_2', function(err) {
                  expect(err).to.not.exist;
                  rsync.sourceList(fs, '/projects', {recursive: true, size: 5}, function(err, data) {
                    expect(err).to.not.exist;
                    rsync.checksums(fs2, '/', data, {recursive: true, size: 5}, function(err, data) {
                      expect(err).to.not.exist;
                      rsync.diff(fs, '/projects', data, {recursive: true, size: 5}, function(err, data) {
                        expect(err).to.not.exist;
                        rsync.patch(fs2, '/', data, {recursive: true, size: 5}, function(err) {
                          expect(err).to.not.exist;
                          fs2.readFile('/proj_1/index.html', 'utf8', function(err, data) {
                            expect(err).to.not.exist;
                            expect(data).to.exist;
                            expect(data).to.equal('Hello world');
                            fs2.readFile('/proj_1/styles.css', 'utf8', function(err, data) {
                              expect(err).to.not.exist;
                              expect(data).to.exist;
                              expect(data).to.equal('CSS');
                              fs2.readFile('/proj_2/styles2.css', 'utf8', function(err, data) {
                                expect(err).to.not.exist;
                                expect(data).to.exist;
                                expect(data).to.equal('CSS');
                                fs2.stat('/proj_2/inside_proj_2', function(err, stats) {
                                  expect(err).to.not.exist;
                                  done();
                                })
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('##should succeed syncing a directory if the destination directory doesn\'t exist', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
    var fs2 = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.mkdir('/test/dir', function(err) {
        expect(err).to.not.exist;
        fs.mkdir('/test/dir/dirdir', function(err) {
          expect(err).to.not.exist;
          fs.writeFile('/test/dir/dirdir/1.txt','This is my 1st file. It does not have any typos.', 'utf8', function(err) { 
            expect(err).to.not.exist;
            rsync.sourceList(fs, '/test', {recursive: true, size: 5}, function(err, data) {
              expect(err).to.not.exist;
              rsync.checksums(fs2, '/', data, {recursive: true, size: 5}, function(err, data) {
                expect(err).to.not.exist;
                rsync.diff(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
                  expect(err).to.not.exist;
                  rsync.patch(fs2, '/', data, {recursive: true, size: 5}, function(err) {
                    expect(err).to.not.exist;
                    fs2.readFile('/dir/dirdir/1.txt', 'utf8', function(err, data){
                      expect(err).to.not.exist;
                      expect(data).to.exist;
                      expect(data).to.equal('This is my 1st file. It does not have any typos.');
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });   
    });
  });

  it('##should succeed syncing a directory if the destination directories do not exist', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.mkdir('/test/dir1', function(err) { 
        expect(err).to.not.exist;
        fs.mkdir('/test/dir2', function(err) { 
          expect(err).to.not.exist;
          fs.mkdir('/test/dir1/dir12', function(err) { 
            expect(err).to.not.exist;
            fs.mkdir('/test2', function(err) {
              expect(err).to.not.exist;
              rsync.sourceList(fs, '/test', {recursive: true, size: 5}, function(err, data) {
                expect(err).to.not.exist;
                rsync.checksums(fs, '/test2', data, {recursive: true, size: 5}, function(err, data) {
                  expect(err).to.not.exist;
                  rsync.diff(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
                    expect(err).to.not.exist;
                    rsync.patch(fs, '/test2', data, {recursive: true, size: 5}, function(err) {
                      expect(err).to.not.exist;
                      fs.stat('/test2', function(err, stats) {
                        expect(err).to.not.exist;
                        expect(stats).to.exist;
                        expect(stats.type).to.equal('DIRECTORY');
                        fs.stat('/test2/dir1', function(err, stats) {
                          expect(err).to.not.exist;
                          expect(stats).to.exist;
                          expect(stats.type).to.equal('DIRECTORY');
                          fs.stat('/test2/dir2', function(err, stats) {
                            expect(err).to.not.exist;
                            expect(stats).to.exist;
                            expect(stats.type).to.equal('DIRECTORY');
                            fs.stat('/test2/dir1/dir12', function(err, stats) {
                              expect(err).to.not.exist;
                              expect(stats).to.exist;
                              expect(stats.type).to.equal('DIRECTORY');
                              done();
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        }); 
      });   
    });
  });

  it('##should succeed syncing a file that has been renamed', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()}),
        fs2 = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});

    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.writeFile('/test/file1.txt', 'This is the file I created', 'utf8', function(err) {
        expect(err).to.not.exist;
        rsync.sourceList(fs, '/test', {recursive: true, size: 5}, function(err, data) {
          expect(err).to.not.exist;
          rsync.checksums(fs2, '/', data, {recursive: true, size: 5}, function(err, data) {
            expect(err).to.not.exist;
            rsync.diff(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
              expect(err).to.not.exist;
              rsync.patch(fs2, '/', data, {recursive: true, size: 5}, function(err) {
                expect(err).to.not.exist;
                fs2.readFile('/file1.txt', 'utf8', function(err, data) {
                  expect(err).to.not.exist;
                  expect(data).to.exist;
                  expect(data).to.equal('This is the file I created');
                  fs.rename('/test/file1.txt', '/test/myfile.txt', function(err) {
                    expect(err).to.not.exist;
                    fs.readFile('/test/file1.txt', 'utf8', function(err, data) {
                      console.log(data);
                      expect(err).to.exist;
                      expect(err.code).to.equal('ENOENT');
                      console.log('Rsync 1 complete');
                      rsync.sourceList(fs, '/test', {recursive: true, size: 5}, function(err, data) {
                        expect(err).to.not.exist;
                        rsync.checksums(fs2, '/', data, {recursive: true, size: 5}, function(err, data) {
                          expect(err).to.not.exist;
                          rsync.diff(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
                            expect(err).to.not.exist;
                            rsync.patch(fs2, '/', data, {recursive: true, size: 5}, function(err) {
                              expect(err).to.not.exist;
                              fs2.readFile('/myfile.txt', 'utf8', function(err, data) {
                                expect(err).to.not.exist;
                                expect(data).to.exist;
                                expect(data).to.equal('This is the file I created');
                                fs2.readFile('/file1.txt', 'utf8', function(err, data) {
                                  expect(err).to.exist;
                                  expect(err.code).to.equal('ENOENT');
                                  done();
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('##should succeed syncing a directory that has been renamed', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()}),
        fs2 = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
    
    console.log('-----------------');
    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.mkdir('/test/olddir', function(err) {
        expect(err).to.not.exist;
        fs.mkdir('/test/mydir', function(err) {
          expect(err).to.not.exist;
          fs.writeFile('/test/olddir/file1.txt', 'This is the file I created', 'utf8', function(err) {
            expect(err).to.not.exist;
            rsync.sourceList(fs, '/test', {recursive: true, size: 5}, function(err, data) {
              expect(err).to.not.exist;
              rsync.checksums(fs2, '/', data, {recursive: true, size: 5}, function(err, data) {
                expect(err).to.not.exist;
                rsync.diff(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
                  expect(err).to.not.exist;
                  rsync.patch(fs2, '/', data, {recursive: true, size: 5}, function(err) {
                    expect(err).to.not.exist;
                    fs2.stat('/olddir', function(err, stats) {
                      expect(err).to.not.exist;
                      expect(stats).to.exist;
                      expect(stats.type).to.equal('DIRECTORY');
                      fs2.readFile('/olddir/file1.txt', 'utf8', function(err, data) {
                        expect(err).to.not.exist;
                        expect(data).to.exist;
                        expect(data).to.equal('This is the file I created');
                        fs2.stat('/mydir', function(err, stats) {
                          expect(err).to.not.exist;
                          expect(stats).to.exist;
                          expect(stats.type).to.equal('DIRECTORY');
                          fs.rename('/test/olddir', '/test/newdir', function(err) {
                            expect(err).to.not.exist;
                            fs.rename('/test/mydir', '/test/notmydir', function(err) {
                              expect(err).to.not.exist;
                              rsync.sourceList(fs, '/test', {recursive: true, size: 5}, function(err, data) {
                                expect(err).to.not.exist;
                                rsync.checksums(fs2, '/', data, {recursive: true, size: 5}, function(err, data) {
                                  expect(err).to.not.exist;
                                  rsync.diff(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
                                    expect(err).to.not.exist;
                                    rsync.patch(fs2, '/', data, {recursive: true, size: 5}, function(err) {
                                      expect(err).to.not.exist;
                                      fs2.stat('/newdir', function(err, stats) {
                                        expect(err).to.not.exist;
                                        expect(stats).to.exist;
                                        expect(stats.type).to.equal('DIRECTORY');
                                        fs2.readFile('/newdir/myfile.txt', 'utf8', function(err, data) {
                                          expect(err).to.not.exist;
                                          expect(data).to.exist;
                                          expect(data).to.equal('This is the file I created');
                                          fs2.stat('/notmydir', function(err, stats) {
                                            expect(err).to.not.exist;
                                            expect(stats).to.exist;
                                            expect(stats.type).to.equal('DIRECTORY');
                                            fs2.stat('/olddir', function(err, stats) {
                                              expect(err).to.exist;
                                              expect(err.code).to.equal('ENOENT');
                                              fs2.stat('/mydir', function(err, stats) {
                                                expect(err).to.exist;
                                                expect(err.code).to.equal('ENOENT');
                                                done();
                                              });
                                            });
                                          });
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('##should not sync a deleted file', function(done) {
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()}),
        fs2 = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
    console.log('-----------------');

    fs.mkdir('/test', function(err) {
      expect(err).to.not.exist;
      fs.writeFile('/test/myfile.txt', 'My file', 'utf8', function(err) {
        expect(err).to.not.exist;
        rsync.sourceList(fs, '/test', {recursive: true, size: 5}, function(err, data) {
          expect(err).to.not.exist;
          rsync.checksums(fs2, '/', data, {recursive: true, size: 5}, function(err, data) {
            expect(err).to.not.exist;
            rsync.diff(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
              expect(err).to.not.exist;
              rsync.patch(fs2, '/', data, {recursive: true, size: 5}, function(err) {
                expect(err).to.not.exist;
                fs2.readFile('/myfile.txt', 'utf8', function(err, data) {
                  expect(err).to.not.exist;
                  expect(data).to.exist;
                  expect(data).to.equal('My file');
                  fs.unlink('/test/myfile.txt', function(err) {
                    expect(err).to.not.exist;
                    rsync.sourceList(fs, '/test', {recursive: true, size: 5}, function(err, data) {
                      expect(err).to.not.exist;
                      rsync.checksums(fs2, '/', data, {recursive: true, size: 5}, function(err, data) {
                        expect(err).to.not.exist;
                        rsync.diff(fs, '/test', data, {recursive: true, size: 5}, function(err, data) {
                          expect(err).to.not.exist;
                          rsync.patch(fs2, '/', data, {recursive: true, size: 5}, function(err) {
                            expect(err).to.not.exist;
                            fs2.readFile('/myfile.txt', 'utf8', function(err, data) {
                              expect(err).to.exist;
                              expect(err.code).to.equal('ENOENT');
                              expect(data).to.not.exist;
                              done();
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

});
