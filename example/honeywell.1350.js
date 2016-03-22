var zetta = require('zetta');
var HoneywellTotalConnectSoap = require('../index');
var HoneywellTotalConnectSecurity = require('../../zetta-honeywell-total-connect-security-driver/index');
var HoneywellTotalConnectAutomation = require('../../zetta-honeywell-total-connect-automation-driver/index');
var HoneywellTotalConnectLight = require('../../zetta-honeywell-total-connect-light-driver/index');
var HoneywellTotalConnectCamera = require('../../zetta-honeywell-total-connect-camera-driver/index');


var style = require('./apps/style');

var soapURL = process.env.HONEYWELL_ALARMNET_SOAP_URL;
var userName = process.env.HONEYWELL_ALARMNET_USERNAME;
var password = process.env.HONEYWELL_ALARMNET_PASSWORD;
var applicationID = process.env.HONEYWELL_ALARMNET_APPLICATION_ID;
var applicationVersion = process.env.HONEYWELL_ALARMNET_APPLICATION_VERSION;

zetta()
  .name('Honeywell TotalConnect 2.0')
  .properties({ style: 
    { 
      backgroundColor: {hex: '#013153', decimal: {red: 1, green: 49, blue: 83}},
      foregroundColor: {hex: '#ffffff', decimal: {red: 255, green: 255, blue: 255}}
    }})
  .use(style)
  .use(HoneywellTotalConnectSoap, soapURL, userName, password, applicationID, applicationVersion)
  .use(HoneywellTotalConnectSecurity)
  .use(HoneywellTotalConnectAutomation)
  .use(HoneywellTotalConnectLight)
  .use(HoneywellTotalConnectCamera)
  .link('http://honeywell.zettaapi.org')
  .listen(1350);