const CHANGE_EVENT = 'characteristicvaluechanged';

class Sensor {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.writeCharacteristics = {};
  }

  async connect() {
    try {
      // eslint-disable-next-line
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.serviceName] }],
        optionalServices: [this.serviceName],
      });

      this.server = await device.gatt.connect();
      this.service = await this.server.getPrimaryService(this.serviceName);
      return this;
    } catch (error) {
      console.error(
        `There was an error while connection to ${this.serviceName}`,
      );
      throw error;
    }
  }

  getCharacteristics() {
    return this.service.getCharacteristics();
  }

  async addListener(characteristic, func) {
    if (!this.service) {
      throw Error('You need to connect to a sensor before you can listen');
    }
    const char = await this.service.getCharacteristic(characteristic);
    char.addEventListener(CHANGE_EVENT, func);
    char.startNotifications();
  }

  async write(characteristic, value) {
    if (this.writeCharacteristics[characteristic]) {
      return this.writeCharacteristics[characteristic].writeValue(value);
    }
    const char = await this.service.getCharacteristic(characteristic);
    await char.startNotifications();
    char.writeValue(value);
    this.writeCharacteristics[characteristic] = char;
  }
}

export default Sensor;
