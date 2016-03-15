var util = require('util');
var Scout = require('zetta-scout');
var HoneywellTotalConnect = require('./honeywell_total_connect');
var soap = require('soap');

var HoneywellTotalConnectScout = module.exports = function() {
  Scout.call(this);
  this.soapURL = arguments[0];
  this.userName = arguments[1];
  this.password = arguments[2];
  this.applicationID = arguments[3];
  this.applicationVersion = arguments[4];

  this.sessionID = null;
  this.soapClient = null;
  this.validSession = false;
};
util.inherits(HoneywellTotalConnectScout, Scout);

HoneywellTotalConnectScout.prototype.init = function(next) {
  //TODO: call GetSessionDetails then parse results:
  // ignore locations for now (akin to how Zetta treat servers today)
  // loop through device list (SecurityDeviceID is special for some reason)
  // filter thru a switch statement based on DeviceClassID (?)
  // create a query per device as a tuple of type and device id {type: 'security', deviceID: 773354, locationID: 773123}
  // store the proper device type and send to provision and discover

    
  var self = this;
  soap.createClient(this.soapURL, function(err, client) {
    if (err) {
      self.soapClient = null;
      return;
    }
    self.soapClient = client;
    console.log('client.describe: ' + util.inspect(client.describe()));
    self.authenticateUser();
  });
  next();
}

HoneywellTotalConnectScout.prototype.scoutDevices = function(locationID, devices) {
  var self = this;

  console.log('scouting devices for locationID: ' + locationID);
  for (i=0; i < devices.length; i++) {
  // for (i=0; i < 1; i++) {
    var deviceID = devices[i].DeviceID;
    var deviceName = devices[i].DeviceName;
    var deviceSerialNumber = devices[i].DeviceSerialNumber;
    var deviceFlags = devices[i].DeviceFlags;
    var deviceClassID = devices[i].DeviceClassID;
    var deviceDriver = null;
    var deviceType = null;

    console.log('deviceClassID: ' + deviceClassID);
    console.log('deviceID: ' + deviceID);
    console.log('deviceName: ' + deviceName);

    switch (deviceClassID) {
    case 1:
      console.log('1 - security');
      deviceType = 'security';
      deviceDriver = // HoneywellTotalConnect;
      console.log('deviceClassID: ' + deviceClassID);
      console.log('deviceID: ' + deviceID);
      console.log('deviceName: ' + deviceName);

      var query = this.server.where({type: 'security'});
      (function(deviceID){
        self.server.find(query, function(err, results) {
          if (results[0]) {
            self.provision(results[0], HoneywellTotalConnect, self.soapClient, self.sessionID, locationID, deviceID);
          } else {
            self.discover(HoneywellTotalConnect, self.soapClient, self.sessionID, locationID, deviceID);
          }
        });
      })(deviceID)




      // var deviceQuery = this.server.where({type: deviceType, deviceID: deviceID, locationID: locationID});
      // this.server.find(deviceQuery, function(err, results) {
      //   if (results[0]) {
      //     self.provision(results[0], deviceDriver, self.soapClient, self.sessionID, locationID, deviceID);
      //   } else {
      //     self.discover(deviceDriver, self.soapClient, self.sessionID, locationID, deviceID);
      //   }
      // });
      break;
    case 2:
      console.log('2 - camera');
      deviceType = 'camera';
      // deviceDriver = HoneywellTotalConnectCamera;
      break;
    case 3:
      console.log('3 - light');
      deviceType = 'light';
      // deviceDriver = HoneywellTotalConnectLight;
      break;
    default:
      console.log('unkown device class');
    }
    
  }
  
  // var HoneywellTotalConnectQuery = this.server.where({type: 'honeywell-total-connect'});
  // var queries = [
    // TODO: added device serial number or device id to query
    // this.server.where({ type: 'camera' }),
    // this.server.where({ type: 'light' }),
    //   this.server.where({ type: 'security' })
    // ];

    // this.server.observe(queries, function(security) {
  // this.server.find(HoneywellTotalConnectQuery, function(err, results) {
  //   if (results[0]) {
  //     self.provision(results[0], HoneywellTotalConnect, self.soapClient, self.sessionID, 594619, 771327);
  //   } else {
  //     self.discover(HoneywellTotalConnect, self.soapClient, self.sessionID, 594619, 771327);
  //   }
  // });
  // });
}

HoneywellTotalConnectScout.prototype.authenticateUser = function() {
  var self = this;
  this.soapClient.AuthenticateUserLoginEx({
    userName: self.userName,
    password: self.password,
    ApplicationID: self.applicationID,
    ApplicationVersion: self.applicationVersion
  }, function(err, result, raw, soapHeader){
    // TODO: handle err
    console.log('_authenticateUser: ' + util.inspect(result));
    if (result.AuthenticateUserLoginExResult.ResultCode >=0) {
      self.validSession = true;
      self.sessionID = result.AuthenticateUserLoginExResult.SessionID;
      self.getSessionDetails();
      // setInterval(function(){self.getStatus()}, 250);
    } else {
      self.validSession = false;
      self.sessionID = null;
    }
    console.log('self.validSession: ' + self.validSession);
    console.log('self.sessionID: ' + self.sessionID);
  });
}

HoneywellTotalConnectScout.prototype.getSessionDetails = function() {
  var self = this;
  
  this.soapClient.GetSessionDetails({
    SessionID: this.sessionID,
    ApplicationID: this.applicationID,
    ApplicationVersion: this.applicationVersion
  }, function(err, result, raw, soapHeader) {
    console.log('GetSessionDetails: ' + util.inspect(result))
    var resultCode = result.GetSessionDetailsResult.ResultCode;
    console.log('GetSessionDetails resultCode: ' + resultCode);
    if (resultCode == 0) {
      // success
      // TODO: handle multiple locations
      var locationID = result.GetSessionDetailsResult.Locations.LocationInfoBasic[0].LocationID;
      console.log('locationID: ' + locationID);
      var devices = result.GetSessionDetailsResult.Locations.LocationInfoBasic[0].DeviceList.DeviceInfoBasic;
      console.log('devices: ' + util.inspect(devices));
      self.scoutDevices(locationID, devices);
    } else {
      // TODO: handle err
    }
  });
  
}