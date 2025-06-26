const request = require('supertest');
const assert = require('assert');
const createServer = require('../backend');

describe('static files', function() {
  let serverObj;
  let server;

  before(function(done) {
    serverObj = createServer();
    serverObj.dbReady
      .then(() => {
        server = serverObj.httpServer.listen(0, done);
      })
      .catch(done);
  });

  after(function(done) {
    server.close(done);
  });

  it('serves login.html from /docs', function(done) {
    request(serverObj.app)
      .get('/docs/login.html')
      .expect('Content-Type', /html/)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        assert.ok(/<html/i.test(res.text));
        done();
      });
  });
});
