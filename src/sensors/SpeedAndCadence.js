import Sensor from './Sensor';

const getHeartRateData = (value) => value.getUint8(1);

// credit to gpedal again: https://github.com/chadj/gpedal
const ble_sint16 = ['getInt16', 2, true];
const ble_uint8 = ['getUint8', 1];
const ble_uint16 = ['getUint16', 2, true];
const ble_uint32 = ['getUint32', 4, true];
// TODO: paired 12bit uint handling
const ble_uint24 = ['getUint8', 3];

const csc_measurement = [
  [1, [[ble_uint32, 'cumulative_wheel_revolutions'], [ble_uint16, 'last_wheel_event_time']]],
  [2, [[ble_uint16, 'cumulative_crank_revolutions'], [ble_uint16, 'last_crank_event_time']]],
];

const getData = (dataview) => {
  let offset = 0;
  let mask;
  if (this.mask_size === 16) {
    mask = dataview.getUint16(0, true);
    offset += 2;
  } else {
    mask = dataview.getUint8(0);
    offset += 1;
  }

  const fieldArrangement = [];

  // Contains required fields
  if (csc_measurement[0][0] === 0) {
    for (const fdesc of csc_measurement[0][1]) {
      fieldArrangement.push(fdesc);
    }
  }

  for (const [flag, fieldDescriptions] of csc_measurement) {
    if (mask & flag) {
      for (const fdesc of fieldDescriptions) {
        fieldArrangement.push(fdesc);
      }
    }
  }

  const data = {};
  for (const field of fieldArrangement) {
    const [[accessor, fieldSize, endianness], fieldName] = field;
    let value;
    if (endianness) {
      value = dataview[accessor](offset, endianness);
    } else {
      value = dataview[accessor](offset);
    }

    data[fieldName] = value;
    offset += fieldSize;
  }

  return data;
};
// END gpedal code

export default class SpeedAndCadence extends Sensor {
  constructor() {
    super('cycling_speed_and_cadence');
  }

  addListener(func) {
    super.addListener(0x2a5b, (event) => {
      func(getData(event.target.value));
    });
  }
}
