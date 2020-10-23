import Sensor from './Sensor';

const getHeartRateData = (value) => value.getUint8(1);

export default class HeartRateSensor extends Sensor {
  constructor() {
    super('heart_rate');
  }

  addListener(func) {
    super.addListener('heart_rate_measurement', (event) => {
      func(getHeartRateData(event.target.value));
    });
  }
}
