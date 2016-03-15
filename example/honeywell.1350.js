var zetta = require('zetta');
var HoneywellTotalConnect = require('../index');
var style = require('./apps/style');

var soapURL = process.env.HONEYWELL_ALARMNET_SOAP_URL;
var userName = process.env.HONEYWELL_ALARMNET_USERNAME;
var password = process.env.HONEYWELL_ALARMNET_PASSWORD;
var applicationID = process.env.HONEYWELL_ALARMNET_APPLICATION_ID;
var applicationVersion = process.env.HONEYWELL_ALARMNET_APPLICATION_VERSION;

zetta()
  .name('Honeywell TotalConnect 2.0')
  .properties({style: {colors: {primary: {hex: '#013153', decimal: {red: 1, green: 49, blue: 83}}}}})
  .use(style)
  .use(HoneywellTotalConnect, soapURL, userName, password, applicationID, applicationVersion)
  .link('http://honeywell.zettaapi.org')
  .listen(1350);