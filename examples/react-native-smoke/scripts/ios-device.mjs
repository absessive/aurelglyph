/** Explicit destinations isolate local checks from unrelated booted apps. */
export function selectIphoneSimulator(inventory, requestedId) {
  const phones = Object.entries(inventory.devices).flatMap(([runtime, devices]) =>
    runtime.includes('iOS') ? devices.filter(device => device.isAvailable && device.name.includes('iPhone')) : [],
  );
  if (requestedId) {
    const requested = phones.find(device => device.udid === requestedId);
    if (!requested) throw new Error('AURELGLYPH_IOS_DEVICE_ID must identify an available iPhone simulator.');
    return requested;
  }
  return phones.find(device => device.state === 'Booted')
    ?? phones.find(device => device.name === 'iPhone 16 Pro')
    ?? phones[0];
}
