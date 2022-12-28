/* eslint-disable @typescript-eslint/no-explicit-any */
import { Path } from "./definition";
import { History, Location } from "./history";

type Listener = (l: Location) => void;
type StopListening = () => void;

export interface INavigator {
  get location(): Location;

  push(path: string): void;
  push<P extends Path<any, never | null | undefined>>(path: P): void;
  push<P extends Path>(path: P, params: P["_params"]): void;
}

export class Navigator implements INavigator {
  constructor(private history: History) {
    this._location = Object.freeze(history.location);
  }

  private _stop: StopListening | null = null;
  start() {
    this.stop();
    this._stop = this.history.observe(l => this._observe(l));
  }

  stop() {
    this._stop?.();
    this._stop = null;
  }

  private _location: Location;
  private listeners = new Set<Listener>();

  get location(): Location {
    return this._location;
  }

  listen(f: Listener): StopListening {
    this.listeners.add(f);
    return () => {
      this.listeners.delete(f);
    };
  }

  // push<P extends Path | string>(to: P) {
  //   const path = typeof to === "string" ? to : to.make();
  //   this.history.push(path);
  // }
  push(path: string): void;
  push<P extends Path<any, null | undefined>>(path: P): void;
  push<P extends Path<any, any>>(path: P, params: P["_params"]): void;
  push(path: string | Path, params?: any): void {
    if (typeof path === "string") {
      this.history.push(path);
    } else {
      this.history.push(path.make(params || {}));
    }
    this.updateAndNotify();
  }

  private notify() {
    this.listeners.forEach(l => l(this._location));
  }

  private updateAndNotify() {
    this._location = Object.freeze(this.history.location);
    this.notify();
  }

  private _observe(l: Location) {
    this._location = Object.freeze(l);
    this.notify();
  }
}
