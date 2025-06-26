const assert = require('assert');
const createServer = require('../backend');

describe('server shutdown', function() {
  it('closes the database when HTTP server is closed', function(done) {
    const { httpServer, db } = createServer();
    let closed = false;
    const original = db.close;
    db.close = function() {
      closed = true;
      original.apply(db, arguments);
    };
    const server = httpServer.listen(0, () => {
      server.close(() => {
        db.close();
        assert.ok(closed);
        done();
      });
    });
  });
});
