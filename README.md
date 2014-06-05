### Tist - Texas Instruments SensorTag

Wrapper around @sandeepmistry's amazing [https://github.com/sandeepmistry/node-sensortag](sensortag) module.

### Features

* [x] notify, enable sensors
* [x] uuid filtering
* [x] restarting discovering if device disconnects

### Example

    var Tist = require('tist');
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


### License

MIT