var util = require('util');
var sensortag = require('sensortag');
var EventEmitter = require('events').EventEmitter;
var SensorTagDevice = require('./device');
var debug = require('debug')('tist:manager');

function Manager(uuids, options) {
  debug('new tist manager, uuids: %j, options: %j', uuids, options);
  this.uuids = uuids||[];
  this.options = options||{};
  this.devices = [];
  debug('discovering');
  this.startDiscover();
}

util.inherits(Manager, EventEmitter);

Manager.prototype.startDiscover = function startDiscover() {
  sensortag.discover(this.discover.bind(this));
};

Manager.prototype.discover = function discover(device) {
  debug('found device: %s', device.uuid);
  var self = this;
  if (!this.isAllowed(device.uuid)) {
    debug('device (%s) isnt allowed (%j)', devices.uuid, this.uuids);
    return;
  }
  var stDevice = new SensorTagDevice(device, {
    sensors: this.options.sensors
  });
  this.emit('device', stDevice);
  this.devices.push(stDevice);
  stDevice.once('disconnect', function() {
    var index = self.devices.indexOf(stDevice);
    self.devices.slice(index, 1).
    stDevice = null;
    self.startDiscover();
  });
};

Manager.prototype.isAllowed = function isAllowed(uuid) {
  if (this.uuids.length) {
    return !!~this.uuids.indexOf(uuid);
  }
  return true;
};

Manager.Device = SensorTagDevice;
module.exports = Manager;
