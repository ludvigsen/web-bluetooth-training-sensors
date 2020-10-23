import Sensor from './Sensor';

const CYCLING_POWER_WRITE = 'a026e005-0a7d-4ab3-97fa-f1500f9feb8b';

// This code is "stolen" from https://github.com/chadj/gpedal
const ble_sint16 = ['getInt16', 2, true];
const ble_uint8 = ['getUint8', 1];
const ble_uint16 = ['getUint16', 2, true];
const ble_uint32 = ['getUint32', 4, true];
// TODO: paired 12bit uint handling
const ble_uint24 = ['getUint8', 3];

const cycling_power_measurement = [
  [0, [[ble_sint16, 'instantaneous_power']]],
  [1, [[ble_uint8, 'pedal_power_balance']]],
  [
    2,
    [
      /* Pedal Power Balance Reference */
    ],
  ],
  [4, [[ble_uint16, 'accumulated_torque']]],
  [
    8,
    [
      /* Accumulated Torque Source */
    ],
  ],
  [
    16,
    [
      [ble_uint32, 'cumulative_wheel_revolutions'],
      [ble_uint16, 'last_wheel_event_time'],
    ],
  ],
  [
    32,
    [
      [ble_uint16, 'cumulative_crank_revolutions'],
      [ble_uint16, 'last_crank_event_time'],
    ],
  ],
  [
    64,
    [
      [ble_sint16, 'maximum_force_magnitude'],
      [ble_sint16, 'minimum_force_magnitude'],
    ],
  ],
  [
    128,
    [
      [ble_sint16, 'maximum_torque_magnitude'],
      [ble_sint16, 'minimum_torque_magnitude'],
    ],
  ],
  [256, [[ble_uint24, 'maximum_minimum_angle']]],
  [512, [[ble_uint16, 'top_dead_spot_angle']]],
  [1024, [[ble_uint16, 'bottom_dead_spot_angle']]],
  [2048, [[ble_uint16, 'accumulated_energy']]],
  [
    4096,
    [
      /* Offset Compensation Indicator */
    ],
  ],
];

const getPowerData = (dataview) => {
  let offset = 2;
  const mask = dataview.getUint16(0, true);
  const fields = cycling_power_measurement;

  const fieldArrangement = [];

  // Contains required fields
  if (fields[0][0] === 0) {
    for (const fdesc of fields[0][1]) {
      fieldArrangement.push(fdesc);
    }
  }

  for (const [flag, fieldDescriptions] of fields) {
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
// END stolen code

export default class PowerMeter extends Sensor {
  constructor() {
    super('cycling_power');
  }

  addListener(func) {
    super.addListener('cycling_power_measurement', (event) => {
      func(getPowerData(event.target.value));
    });
  }

  async writeErg(targetPower) {
    const resistance = new Uint8Array([0x42, targetPower, 0x00]);
    await this.write(CYCLING_POWER_WRITE, resistance);
  }
}
