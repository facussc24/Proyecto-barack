const assert = require('assert');
const createServer = require('../backend');

describe('server shutdown', function() {
  it('closes database when http server is closed', function(done) {
    const { httpServer, dbReady, db } = createServer();
    dbReady.then(() => {
      let closed = false;
      const origClose = db.close;
      db.close = function(...args) { closed = true; return origClose.apply(this,args); };
      const srv = httpServer.listen(0, () => {
        srv.close(() => {
          assert.ok(closed);
          done();
        });
      });
    }).catch(done);
  });
});
