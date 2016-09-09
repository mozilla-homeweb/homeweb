/**
 * HomeWeb Server
 */
const http = require('http');
const serialport = require('serialport').SerialPort;
const xbee_api = require('xbee-api');

const TCP_PORT = 8080; // TCP port for HTTP server
const SERIAL_PORT = '/dev/ttyUSB1'; // Serial port of XStick
const SENSOR_ADDRESS_64 = '0013A20040F53592'; // 64-bit address of XBee
const SENSOR_ADDRESS_16 = '5E59'; // 16-bit address of XBee
const CONSTS = xbee_api.constants; // XBee API constants

var TEMPERATURE = null;

// Instantiate XBee API in API mode without escaping
var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 1
});

// Configure serial port with XBee parser
var serialPort = new serialport(SERIAL_PORT, {
  baudrate: 9600,
  parser: xbeeAPI.rawParser()
});

// Start HTTP server
http.createServer((request, response) => {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end('Temperature: ' + TEMPERATURE + '\n');
}).listen(TCP_PORT);
console.log('Server running on port ' + TCP_PORT);

// Define remote AT command to send to XBee over ZigBee network to request
// sensor data.
var readSensorDataRequest = {
    type: CONSTS.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST, // Remote AT command
    destination64: SENSOR_ADDRESS_64, // 64-bit destination address
    destination16: SENSOR_ADDRESS_16, // optional, "fffe" is default
    command: 'IS', // Force sample command to request sensor data
    commandParameter: [] // Can either be string or byte array
}

// Send remote request for sensor data
function getSensorData() {
  serialPort.on.on('open', function() {
    serialPort.write(xbeeAPI.buildFrame(readSensorDataRequest));
  });
};

// Set temperature from remote response
xbeeAPI.on('frame_object', function(frame) {
  TEMPERATURE = frame.analogSamples.AD2;
  console.log('>>', frame); 
});
