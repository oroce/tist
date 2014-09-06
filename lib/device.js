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
  var self = this;
  options || (options = {});
  debug('new device with options: %j', options);
  if (device == null) {
    debug('missing raw sensortag device')
    throw new Error('Missing device');
  }
  this.sensors = options.sensors||sensors;
  this.watch = options.watch !== false;
  this.transforms = merge(SensorTagDevice.transforms, options.transforms);
  this.device = device;
  this.uuid = device.uuid;

  this.device.on('disconnect', function() {
    debug('device disconnected: %s', self.uuid);
    self.emit('disconnect');
  });

  this.connect();
}

util.inherits(SensorTagDevice, EventEmitter);

SensorTagDevice.prototype.characteristics = function() {
  debug('discovering characteristics');
  var self = this;
  this.device.discoverServicesAndCharacteristics(function() {
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
    var method = methodName(service);
    var enable = 'enable' + method;
    var fn = function(value) {
      debug('new value for %s', service, [].slice.call(arguments));
      var metrics = this.transform(service,arguments);

      return metrics;

    }.bind(this);
    debug('enable %s', service);
    this.device[enable](function(err) {
      if (err) {
        return console.warn('Couldnt enable: %s', service, err);
      }

      if (this.watch === false) {
        return;
      }
      var notify = 'notify' + method;
      var change = service + 'Change';
      
      
      this.device[notify](function() {
        debug('we\'ll be notified of %s', service);
      });
      debug('listening to %s', change);
      this.device.on(change, function() {
        var metrics = fn.apply(null, arguments);
        metrics.forEach(function(metric) {
          this.emit('metric', metric.name, metric.value);
        }, this);
      }.bind(this));
    }.bind(this));
    
  }, this);
};

SensorTagDevice.prototype.read = function read(sensor, fn) {
  debug('read sensor: %s', sensor);
  var method = 'read' + methodName(sensor);
  this.device[method](function() {
    fn(null, this.transform(sensor, arguments));
  }.bind(this));
};

SensorTagDevice.prototype.transform = function transform(sensor, args) {
  var transform = this.transforms[sensor];
  var metrics;
  if (transform){
    metrics = transform.apply(this, [].slice.call(args));
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
  return metrics;
};
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


function methodName(sensorName) {
  return sensorName.charAt(0).toUpperCase() + sensorName.slice(1);
}
SensorTagDevice.sensors = sensors;
module.exports = SensorTagDevice;