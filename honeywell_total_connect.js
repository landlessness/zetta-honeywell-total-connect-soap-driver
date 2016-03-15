var Device = require('zetta-device');
var util = require('util');

var HoneywellTotalConnect = module.exports = function(soapClient, sessionID, locationID, deviceID) {
  Device.call(this);
  this._panelFullStatusByDeviceIDResult = {};
  
  this._soapClient = soapClient;
  this._sessionID = sessionID;
  
  this.locationID = locationID;
  this.deviceID = deviceID;
  
  this._lastUpdatedTimestampTicks = this._ticks(); //GMT Timestamp represented in ticks
};
util.inherits(HoneywellTotalConnect, Device);

// TODO: check the actual status of the panel then set current state
HoneywellTotalConnect.prototype.init = function(config) {
  config
    .name('HoneywellTotalConnect')
    .type('security')
    .state('disarmed')
    .when('disarmed', {allow: ['arm-stay', 'arm-away']})
    .when('armed-stay', {allow: ['disarm']})
    .when('armed-away', {allow: ['disarm']})
    .when('arming-away', {allow: []})
    .when('arming-stay', {allow: []})
    .when('disarming', {allow: []})
    .map('arm-stay', this.armStay)
    .map('arm-away', this.armAway)
    .map('disarm', this.disarm);
};
  
HoneywellTotalConnect.prototype.armStay = function(cb) {
  console.log('armStay');
  
  var self = this;

  var previousState = this.state;
  this.state = 'arming-stay';
  cb();

  console.log('this._sessionID: ' + this._sessionID);
  console.log('this.locationID: ' + this.locationID);
  console.log('this.deviceID: ' + this.deviceID);
  this._soapClient.ArmSecuritySystem({
    SessionID: this._sessionID,
    LocationID: this.locationID,
    DeviceID: this.deviceID,
    ArmType: 1,
    UserCode: -1
  }, function(err, result, raw, soapHeader) {
    // TODO: handle err
    console.log('armStay: ' + util.inspect(result));
    if (result.ArmSecuritySystemResult.ResultCode >= 0) {
      self._checkSecurityPanelLastCommandState({nextState: 'armed-stay', callback: cb});
    } else {
      // log an err?
      self.state = previousState;
      cb();
      console.log('armStay: ERROR: result.ArmSecuritySystemResult.ResultCode: ' + result.ArmSecuritySystemResult.ResultCode);
    }
  });
  
}

HoneywellTotalConnect.prototype.armAway = function(cb) {
  console.log('armAway');
  
  var self = this;

  this.state = 'arming-away';
  cb();

  this._soapClient.ArmSecuritySystem({
    SessionID: this._sessionID,
    LocationID: this.locationID,
    DeviceID: this.deviceID,
    ArmType: 0,
    UserCode: -1
  }, function(err, result, raw, soapHeader) {
    // TODO: handle err
    console.log('armAway: ' + util.inspect(result));
    self._checkSecurityPanelLastCommandState({nextState: 'armed-away', callback: cb});
  });
  
}

HoneywellTotalConnect.prototype.disarm = function(cb) {
  console.log('disarm');
  
  var self = this;
  
  this.state = 'disarming';
  cb();
  
  this._soapClient.DisarmSecuritySystem({
    SessionID: this._sessionID,
    LocationID: this.locationID,
    DeviceID: this.deviceID,
    UserCode: -1
  }, function(err, result, raw, soapHeader) {
    // TODO: handle err
    console.log('disarm: ' + util.inspect(result));
    
    self._checkSecurityPanelLastCommandState({nextState: 'disarmed', callback: cb});
  });

}

HoneywellTotalConnect.prototype._checkSecurityPanelLastCommandState = function(arg) {
  console.log('CheckSecurityPanelLastCommandState');
  var self = this;
  this._soapClient.CheckSecurityPanelLastCommandState({
    SessionID: this._sessionID,
    LocationID: this.locationID,
    DeviceID: this.deviceID,
    CommandCode: -1
  }, function(err, result, raw, soapHeader) {
    console.log('_checkSecurityPanelLastCommandState: ' + util.inspect(result));
    var resultCode = result.CheckSecurityPanelLastCommandStateResult.ResultCode;
    console.log('_checkSecurityPanelLastCommandState resultCode: ' + resultCode);
    if (resultCode == 0) {
      self.state = arg.nextState;
      arg.callback();
      // success
    } else {
      // TODO: handle err state and setting Zetta state
      setTimeout(self._checkSecurityPanelLastCommandState.bind(self), 250, arg);
    }
  });
}

HoneywellTotalConnect.prototype._getStatus = function() {
  console.log('_getStatus');
  
  var self = this;
  this._soapClient.GetPanelFullStatusByDeviceID({
    SessionID: this._sessionID,
    DeviceID: this.deviceID,
    LastUpdatedTimestampTicks: self._lastUpdatedTimestampTicks,
    PartitionID: 1
  }, function(err, result, raw, soapHeader) {
    console.log('client._getStatus: ' + util.inspect(result));
    self._panelFullStatusByDeviceIDResult = result.GetPanelFullStatusByDeviceIDResult;
    console.log('self._panelFullStatusByDeviceIDResult: ' + util.inspect(self._panelFullStatusByDeviceIDResult))
  });
  this._lastUpdatedTimestampTicks = this._ticks();
}

HoneywellTotalConnect.prototype._ticks = function() {
  var currentTime = new Date().getTime();

  // 10,000 ticks in 1 millisecond
  // jsTicks is number of ticks from midnight Jan 1, 1970
  var jsTicks = currentTime * 10000;

  // add 621355968000000000 to jsTicks
  // netTicks is number of ticks from midnight Jan 1, 01 CE
  return jsTicks + 621355968000000000;
}