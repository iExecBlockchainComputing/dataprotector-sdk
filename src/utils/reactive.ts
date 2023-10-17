class SafeObserver<DataMessageType> {
  destination;

  unsub;

  isUnsubscribed = false;

  constructor(destination) {
    this.destination = destination;
  }

  next(value: DataMessageType) {
    if (!this.isUnsubscribed && this.destination.next) {
      try {
        this.destination.next(value);
      } catch (err) {
        this.unsubscribe();
        throw err;
      }
    }
  }

  error(err: Error) {
    if (!this.isUnsubscribed && this.destination.error) {
      try {
        this.destination.error(err);
      } catch (e2) {
        this.unsubscribe();
        throw e2;
      }
      this.unsubscribe();
    }
  }

  complete() {
    if (!this.isUnsubscribed && this.destination.complete) {
      try {
        this.destination.complete();
      } catch (err) {
        this.unsubscribe();
        throw err;
      }
      this.unsubscribe();
    }
  }

  unsubscribe() {
    this.isUnsubscribed = true;
    if (this.unsub) {
      this.unsub();
    }
  }
}

type ObservableNext<DataMessageType> = (data: DataMessageType) => void;
type ObservableError = (e: Error) => void;
type ObservableComplete = () => void;

type Observer<DataMessageType> = {
  next: ObservableNext<DataMessageType>;
  error: ObservableError;
  complete: ObservableComplete;
};

class Observable<DataMessageType> {
  private _subscribe;

  constructor(_subscribe) {
    this._subscribe = _subscribe;
  }

  subscribe(
    observerOrNext: Observer<DataMessageType> | ObservableNext<DataMessageType>,
    error?: ObservableError,
    complete?: ObservableComplete
  ) {
    const safeObserver: SafeObserver<DataMessageType> = new SafeObserver(
      observerOrNext
    );
    if (typeof observerOrNext === 'function') {
      safeObserver.destination = {
        next: observerOrNext,
        error: error,
        complete: complete,
      };
    } else if (typeof observerOrNext === 'object') {
      safeObserver.destination = observerOrNext;
    }
    return this._subscribe(safeObserver);
  }
}

export { Observable, SafeObserver };
