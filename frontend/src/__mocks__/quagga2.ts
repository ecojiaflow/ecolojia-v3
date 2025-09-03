// PATH: frontend/src/__mocks__/quagga2.ts
const Quagga = {
  init: (_cfg: any, cb: (err?: Error) => void) => cb(),
  start: () => {},
  stop: () => {},
  onDetected: (handler: (res: any) => void) => {
    (globalThis as any).__quaggaHandler = handler;
  },
  offDetected: () => {},
};
export default Quagga;
