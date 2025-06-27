const assert = require('assert');
const createServer = require('../backend');

describe('server shutdown', function() {
  it('keeps database open when http server is closed', function(done) {
    const { httpServer, dbReady, db } = createServer();
    dbReady.then(() => {
      const srv = httpServer.listen(0, () => {
        srv.close(() => {
          db.all('SELECT 1', err => {
            assert.ifError(err);
            done();
          });
        });
      });
    }).catch(done);
  });
});
