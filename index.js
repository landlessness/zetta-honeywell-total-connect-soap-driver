var util = require('util');
var Scout = require('zetta-scout');
var HoneywellTotalConnectSoap = require('./honeywell_total_connect_soap');
var soap = require('soap');

var HoneywellTotalConnectSoapScout = module.exports = function() {
  Scout.call(this);
  this.soapURL = arguments[0];
  this.userName = arguments[1];
  this.password = arguments[2];
  this.applicationID = arguments[3];
  this.applicationVersion = arguments[4];
  
};
util.inherits(HoneywellTotalConnectSoapScout, Scout);

HoneywellTotalConnectSoapScout.prototype.init = function(next) {
  //TODO: call GetSessionDetails then parse results:
  // ignore locations for now (akin to how Zetta treat servers today)
  // loop through device list (SecurityDeviceID is special for some reason)
  // filter thru a switch statement based on DeviceClassID (?)
  // create a query per device as a tuple of type and device id {type: 'security', deviceID: 773354, locationID: 773123}
  // store the proper device type and send to provision and discover

    
  var self = this;
  soap.createClient(this.soapURL, function(err, client) {
    if (err) {
      return;
    }
    self.authenticateUser(client, next);
  });

}

// HoneywellTotalConnectSoap.prototype.locations = function() {
//   return this._locations;
// }
HoneywellTotalConnectSoapScout.prototype.authenticateUser = function(client, next) {
  var self = this;
  client.AuthenticateUserLoginEx({
    userName: this.userName,
    password: this.password,
    ApplicationID: this.applicationID,
    ApplicationVersion: this.applicationVersion
  }, function(err, result, raw, soapHeader){
    // TODO: handle err
    if (result.AuthenticateUserLoginExResult.ResultCode >=0) {
      self.getSessionDetails(result.AuthenticateUserLoginExResult.SessionID, client, next);
    } else {
      // TODO: handle invalid
    }
  });
}

HoneywellTotalConnectSoapScout.prototype.getSessionDetails = function(sessionID, client, next) {
  var self = this;
  
  client.GetSessionDetails({
    SessionID: sessionID,
    ApplicationID: this.applicationID,
    ApplicationVersion: this.applicationVersion
  }, function(err, result, raw, soapHeader) {
    var resultCode = result.GetSessionDetailsResult.ResultCode;
    if (resultCode == 0) {
      // success
      var deviceLocations = result.GetSessionDetailsResult.Locations.LocationInfoBasic;
      var query = self.server.where({type: 'soap'});
      self.server.find(query, function(err, results) {
        if (results[0]) {
          self.provision(results[0], HoneywellTotalConnectSoap, client, sessionID, deviceLocations);
        } else {
          self.discover(HoneywellTotalConnectSoap, client, sessionID, deviceLocations);
        }
      });
      next();
    } else {
      // TODO: handle err
    }
  });
}
