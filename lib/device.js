var util = require('util');
var EventEmitter = require('events').EventEmitter;
var merge = require('merge');
var debug = require('debug')('tist:device');
var sensors = [
  'irTemperature',
  'accelerometer',
  'humidity',
  'accelerometer',
  'magnetometer',
  'barometricPressure',
  'gyroscope'
];

function SensorTagDevice(device, options) {
  options || (options = {});
  debug('new device with options: %j', options);
  if (device == null) {
    debug('missing raw sensortag device')
    throw new Error('Missing device');
  }
  this.sensors = options.sensors||sensors;
  this.transforms = merge(SensorTagDevice.transforms, options.transforms);
  this.device = device;
  
  this.connect();
}

util.inherits(SensorTagDevice, EventEmitter);

SensorTagDevice.prototype.characteristics = function() {
  debug('discovering characteristics');
  var self = this;
  this.device.discoverServicesAndCharacteristics(function(){
    console.log('chars', self.device._characteristics, self.device._services);

    this.enableServices();
  }.bind(this));
}
SensorTagDevice.prototype.onConnect = function onConnect(err) {
  if (err) {
    debug('failed to connect to: %s', this.device.uuid);
    throw err;
  }
  debug('device connected %s', this.device.uuid);
  this.characteristics();
}
SensorTagDevice.prototype.connect = function connect() {
  debug('connecting to device: %s', this.device.uuid);
  this.device.connect(this.onConnect.bind(this));
}
SensorTagDevice.prototype.enableServices = function() {
  debug('enabling services for %s', this.device.uuid);
  this.sensors.forEach(function(service) {
    var method = service.charAt(0).toUpperCase() + service.slice(1);
    var enable = 'enable' + method;
    var fn = function(value) {
      debug('new value for %s', service, [].slice.call(arguments));
      var transform = this.transforms[service];
      var metrics;
      if (transform){
        metrics = transform.apply(this, [].slice.call(arguments));
      }
      else {
        metrics = [{
          name: service,
          value: value
        }]
      }
      if (!Array.isArray(metrics)) {
        metrics = [metrics];
      }

      metrics.forEach(function(metric) {
        this.emit('metric', metric.name, metric.value);
      }, this);

    }.bind(this);
    this.device[enable](function(err) {
      if (err) {
        return console.warn('Couldnt enable: %s', service, err);
      }
      var notify = 'notify' + method;
      var change = service + 'Change';
      
      
      this.device[notify](function() {
        debug('we\'ll be notified of %s', service);
      });
      debug('listening to %s', change);
      this.device.on(change, fn);
    }.bind(this));
    
  }, this);
}

SensorTagDevice.transforms = {
  'irTemperature': function(object, ambient) {
    return [{
      name: 'temperature/object',
      value: object
    }, {
      name: 'temperature/ambient',
      value: ambient
    }];
  },
  'magnetometer': function(x,y,z) {
    return {
      name: 'magnetometer',
      value: {
        x: x,
        y: y,
        z: z
      }
    };
  },
  'humidity': function(temperature, humidity) {
    return [{
      name: 'humidity/temperature',
      value: temperature
    }, {
      name: 'humidity/humidity',
      value: humidity
    }];
  }
};
module.exports = SensorTagDevice;