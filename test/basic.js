var Tist = require('..');
var TistDevice = Tist.Device;
var EventEmitter = require('events').EventEmitter;
describe('Manager', function() {
  it('should export Device', function() {
    Tist.Device.should.be.a.Function;
  });

  it('should inherit from EventEmitter', function() {
    (new Tist()).should.be.an.instanceof(EventEmitter);
  });

  it('should store uuids', function() {
    var t = new Tist([0]);
    t.uuids.should.eql([0]);
  });

  it('should isAllowed return true for empty uuids', function() {
    var t = new Tist();
    t.isAllowed(0).should.be.true;
  });

  it('should isAllowed return false for non matching uuids', function() {
    var t = new Tist([0]);
    t.isAllowed(1).should.be.false;
  });

  it('should isAllowed return true for matching uuid', function() {
    var t = new Tist([0]);
    t.isAllowed(0).should.be.true;
  });
});

describe('Device', function() {
  it('should throw error if no device', function(){
    (function() {
      new TistDevice();
    }).should.throw(/missing device/i);
  });

  it('should inherit from EventEmitter', function() {
    (new (Tist.Device)({connect:function(){}})).should.be.an.instanceof(EventEmitter);
  });

  it('should merge transforms', function() {
    var d = new (Tist.Device)({connect:function(){}}, {
      transforms: {
        'irTemperature': true,
        'foo': 'bar'
      }
    });

    d.transforms.irTemperature.should.be.true;
    d.transforms.foo.should.eql('bar');
  });
});