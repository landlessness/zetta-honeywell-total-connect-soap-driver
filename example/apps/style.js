var util = require('util');
var extend = require('node.extend');

var IMAGE_URL_ROOT = 'http://www.zettaapi.org/icons/';
var IMAGE_EXTENSION = '.png';

var stateImageForDevice = function(device) {
  var typeState = device.type + '-' + device.state;
  
  var preferredImageFor = {
    'security-arming': 'security-arming-stay'
  }

  var preferredImage = preferredImageFor[typeState];
  if (typeof preferredImage !== 'undefined') {
    typeState = preferredImage;
  }

  return IMAGE_URL_ROOT + typeState + IMAGE_EXTENSION;
}

module.exports = function(server) {
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
          {name: 'imageURL', type: 'text'}
        ]
      };

      var stateStream = device.createReadStream('state');
      stateStream.on('data', function(newState) {
        device.call('update-state-image', stateImageForDevice(device));
      });
      
    });
  });
}