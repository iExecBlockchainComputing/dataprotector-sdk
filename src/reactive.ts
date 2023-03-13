class SafeObserver {
  destination;
  unsub;
  isUnsubscribed = false;

  constructor(destination) {
    this.destination = destination;
  }

  next(value) {
    if (!this.isUnsubscribed && this.destination.next) {
      try {
        this.destination.next(value);
      } catch (err) {
        this.unsubscribe();
        throw err;
      }
    }
  }

  error(err) {
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

class Observable {
  _subscribe;

  constructor(_subscribe) {
    this._subscribe = _subscribe;
  }

  subscribe(observer) {
    const safeObserver = new SafeObserver(observer);
    return this._subscribe(safeObserver);
  }
}

export { Observable, SafeObserver };
