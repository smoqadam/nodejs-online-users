module.exports = function(io, db) {
  var collection;
  var request = require('request');
  var uid;
  var ip;
  var users = {};
  io.on('connection', function(socket) {
    collection = db.get('onlines');
    ip = socket.handshake.headers['x-real-ip'];
    socket.on('sendMessage', function(msg) {
      socket.broadcast.emit('showMessage', msg);
    });
    socket.on('userConnect', function(data) {
      uid = data.uid;
      socket.broadcast.emit('addActivity', uid + ' connected!');
      users[socket.id] = uid;
      addUser(uid, ip);
    });

    function updateMarkers() {
      collection.aggregate(
        [{
          "$group": {
            "_id": {
              "lat": "$lat",
              "lng": "$lng"
            },
            "sum": {
              "$sum": 1
            }
          }
        }],
        function(err, docs) {
          if (docs.length) {
            socket.emit('updateMarkers', docs);
            socket.broadcast.emit('updateMarkers', docs);
          }
        });
    }

    function addUser(uid, ip) {
      request('http://ip-api.com/json/' + ip, function(err,
        response, body) {
        if (!err && response.statusCode == 200) {
          body = JSON.parse(body);
          var data = {
            uid: uid,
            lat: body.lat,
            lng: body.lon
          };
          collection.update({
              uid: uid
            }, data, {
              upsert: true
            },
            function(error, docs) {
              updateMarkers();
            });
          return data;
        }
      });

      socket.on('disconnect', function(a) {
        duid = users[socket.id];
        collection.remove({
          uid: uid
        });
        socket.broadcast.emit('addActivity', uid +
          ' disconnected!');
        updateMarkers();
        delete users[socket.id];
      });
    };
  });
};
