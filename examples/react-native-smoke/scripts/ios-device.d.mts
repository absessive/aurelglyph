type Simulator = { isAvailable: boolean; name: string; state: string; udid: string };
export function selectIphoneSimulator(inventory: { devices: Record<string, Simulator[]> }, requestedId?: string): Simulator | undefined;
