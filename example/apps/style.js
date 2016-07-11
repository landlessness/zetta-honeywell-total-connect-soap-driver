var util = require('util');
var extend = require('node.extend');

var IMAGE_URL_ROOT = 'http://www.zettaapi.org/icons/';
var IMAGE_EXTENSION = '.png';

var stateImageForDevice = function(device) {
  return IMAGE_URL_ROOT + device.type + '-' + device.state + IMAGE_EXTENSION;
}

var applyImageStyle = function(device) {
  switch (device.type) {
  case 'security':
    var foregroundColor = null;
    switch (device.state) {
    case 'disarmed':
    case 'disarming':
      foregroundColor = {hex: '#48A70C', decimal: {red: 72, green: 167, blue: 12}};
      break;
    case 'arming-stay':
    case 'armed-stay':
    case 'armed-away':
    case 'arming-away':
      foregroundColor = {hex: '#AD231B', decimal: {red: 173, green: 35, blue: 27}};
      break;
    default:
    }
    device.style.properties.stateImage.foregroundColor = foregroundColor;
    break;
  default:
  }
}

module.exports = function(server) {
  console.log('util.inspect(server): ' + util.inspect(server));

  ['security', 'light'].forEach(function(deviceType){
    var deviceQuery = server.where({ type: deviceType});
    server.observe([deviceQuery], function(device) {
      var states = Object.keys(device._allowed);
      for (i = 0; i < states.length; i++) {
        device._allowed[states[i]].push('_update-state-image');
      }
      device._transitions['_update-state-image'] = {
        handler: function(updatedStateImage, cb) {
          device.style = extend(device.style, {});
          device.style.properties = extend(true, device.style.properties, {stateImage: {url: updatedStateImage}});
          applyImageStyle(device);
          cb();
        },
        fields: [
          {name: 'image', type: 'text'}
        ]
      };

      device.call('_update-state-image', stateImageForDevice(device));
      var stateStream = device.createReadStream('state');
      stateStream.on('data', function(newState) {
        device.call('_update-state-image', stateImageForDevice(device));
      });

      device.style.actions = extend(true, device.style.actions, {'_update-state-image': {display: 'none'}});
      
      device.style.actions = extend(true, device.style.actions, {'update-state': {display: 'none'}});
      
    });
  });
}