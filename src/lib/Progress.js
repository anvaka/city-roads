import eventify from 'ngraph.events';

export default class Progress {
  constructor(notify) {
    eventify(this)
    this.callback = notify || Function.prototype;
  }

  cancel() {
    this.isCancelled = true;
    this.fire('cancel');
  }

  notify(progress) {
    if (!this.isCancelled) {
      this.callback(progress);
    }
  }

  onCancel(callback) {
    this.on('cancel', callback, this);
  }

  offCancel(callback) {
    this.off('cancel', callback);
  }
}