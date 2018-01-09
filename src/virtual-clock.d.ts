export = VirtualClock;
declare class VirtualClock {
  start(): VirtualClock;
  stop(): VirtualClock;
  on(event: string, callback: () => void): VirtualClock;
  off(event: string, callback: () => void): VirtualClock;
  trigger(event: string, ...args: any[]): VirtualClock;
  onceAt(time: number, callback: () => void): VirtualClock;
  alwaysAt(time: number, callback: () => void): VirtualClock;
  removeAt(time: number, callback: () => void): VirtualClock;
  time: number;
  running: boolean;
  rate: number;
  minimum: number;
  maximum: number;
  loop: boolean;
}
