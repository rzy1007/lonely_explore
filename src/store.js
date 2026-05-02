/**
 * 全局状态管理
 */
export const store = {
  currentScale: 0,
  selectedBodyId: null,
  isSplashDone: false,
  isImmersive: false,
  sidebarOpen: false,

  listeners: {},

  on(event, fn) {
    (this.listeners[event] ||= []).push(fn);
  },

  off(event, fn) {
    const arr = this.listeners[event];
    if (arr) {
      const i = arr.indexOf(fn);
      if (i >= 0) arr.splice(i, 1);
    }
  },

  emit(event, data) {
    (this.listeners[event] || []).forEach((fn) => fn(data));
  },

  setScale(scale) {
    if (scale !== this.currentScale) {
      this.currentScale = scale;
      this.selectedBodyId = null;
      this.emit('scaleChanged', scale);
    }
  },

  selectBody(id) {
    this.selectedBodyId = id;
    this.emit('bodySelected', id);
    this.sidebarOpen = false;
    this.emit('sidebarToggle', false);
  },

  deselectBody() {
    this.selectedBodyId = null;
    this.emit('bodyDeselected');
  },
};
