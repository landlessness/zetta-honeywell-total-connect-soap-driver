var util = require('util');
var extend = require('node.extend');

var IMAGE_URL_ROOT = 'http://www.zettaapi.org/icons/';
var IMAGE_EXTENSION = '.png';

var stateImageForDevice = function(device) {
  return IMAGE_URL_ROOT + device.type + '-' + device.state + IMAGE_EXTENSION;
}

module.exports = function(server) {
  console.log('util.inspect(server): ' + util.inspect(server));

  ['security', 'light', 'camera'].forEach(function(deviceType){
    var deviceQuery = server.where({ type: deviceType});
    server.observe([deviceQuery], function(device) {
      var states = Object.keys(device._allowed);
      for (i = 0; i < states.length; i++) {
        device._allowed[states[i]].push('update-state-image');
      }
      device._transitions['update-state-image'] = {
        handler: function(updatedStateImage, cb) {
          device.style = extend(device.style, {stateImage: updatedStateImage});
          cb();
        },
        fields: [
          {name: 'image', type: 'text'}
        ]
      };

      device.call('update-state-image', stateImageForDevice(device));
      var stateStream = device.createReadStream('state');
      stateStream.on('data', function(newState) {
        device.call('update-state-image', stateImageForDevice(device));
      });

      var hideUpdateStateImageAction = {
        action: 'update-state-image',
        display: 'none'
      };
      if (typeof device.style.actions === 'undefined' || device.style.actions.constructor !== Array) {
        device.style.actions = [hideUpdateStateImageAction];
      } else {
        device.style.actions.push(hideUpdateStateImageAction);
      }
      
    });
  });
}