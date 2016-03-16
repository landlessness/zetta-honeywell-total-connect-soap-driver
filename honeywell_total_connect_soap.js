var Device = require('zetta-device');
var util = require('util');

var HoneywellTotalConnectSoap = module.exports = function() {
  Device.call(this);

  this._client = arguments[0];
  this._sessionID = arguments[1];
  this.deviceLocations = arguments[2];
  this.automationDevices = arguments[3];
};
util.inherits(HoneywellTotalConnectSoap, Device);

// TODO: check the actual status of the panel then set current state
HoneywellTotalConnectSoap.prototype.init = function(config) {
  config
    .name('HoneywellTotalConnectSoap')
    .type('soap')
    .state('ready');
};

HoneywellTotalConnectSoap.prototype._getPanelMetaDataAndFullStatusByDeviceID = function(deviceID, ticks, lastSequenceNumber, cb) {
  console.log('_getStatus');
  
  // TODO: find source of PartitionID
  var self = this;
  this._client.GetPanelMetaDataAndFullStatusByDeviceID({
    SessionID: this._sessionID,
    DeviceID: deviceID,
    LastSequenceNumber: lastSequenceNumber,
    LastUpdatedTimestampTicks: ticks,
    PartitionID: 1
  }, cb);
}

HoneywellTotalConnectSoap.prototype._getPanelFullStatusByDeviceID = function(deviceID, ticks, lastSequenceNumber, cb) {
  console.log('_getStatus');
  
  // TODO: find source of PartitionID
  var self = this;
  this._client.GetPanelFullStatusByDeviceID({
    SessionID: this._sessionID,
    DeviceID: deviceID,
    LastSequenceNumber: lastSequenceNumber,
    LastUpdatedTimestampTicks: ticks,
    PartitionID: 1
  }, cb);
}

HoneywellTotalConnectSoap.prototype._ticks = function() {
  var currentTime = new Date().getTime();

  // 10,000 ticks in 1 millisecond
  // jsTicks is number of ticks from midnight Jan 1, 1970
  var jsTicks = currentTime * 10000;

  // add 621355968000000000 to jsTicks
  // netTicks is number of ticks from midnight Jan 1, 01 CE
  return jsTicks + 621355968000000000;
}