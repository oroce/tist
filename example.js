var Tist = require('./');
var tist = new Tist();
tist.on('device', function(device) {
  device
    .once('disconnect', function(){
      device.removeAllListeners();
    })
    .on('metric', function() {
      var args = [].slice.call(arguments);
      console.log.apply(console, ['metric arrived:'].concat(args));
    });
});
