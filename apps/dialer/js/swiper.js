'use strict';

var swiper = {
  /* init */
  init: function ls_init() {
    this.getAllElements();

    this.area.addEventListener('mousedown', this);
    this.areaHandle.addEventListener('mousedown', this);
    this.areaCamera.addEventListener('mousedown', this);
    this.areaUnlock.addEventListener('mousedown', this);

    /* Unlock & camera panel clean up */
    this.overlay.addEventListener('transitionend', this);

    /* switching panels */
    window.addEventListener('home', this);

    var self = this;
  },

  handleEvent: function ls_handleEvent(evt) {
    switch (evt.type) {
      case 'mousedown':
        var leftTarget = this.areaCamera;
        var rightTarget = this.areaUnlock;
        var handle = this.areaHandle;
        var overlay = this.overlay;
        var target = evt.target;

        this._touch = {
          target: null,
          touched: false,
          leftTarget: leftTarget,
          rightTarget: rightTarget,
          initRailLength: this.railLeft.offsetWidth,
          maxHandleOffset: rightTarget.offsetLeft - handle.offsetLeft -
            (handle.offsetWidth - rightTarget.offsetWidth) / 2
        };
        window.addEventListener('mouseup', this);
        window.addEventListener('mousemove', this);

        switch (target) {
          case leftTarget:
            overlay.classList.add('touched-left');
            break;

          case rightTarget:
            overlay.classList.add('touched-right');
            break;

          case this.areaHandle:
            this._touch.touched = true;
            this._touch.initX = evt.pageX;
            this._touch.initY = evt.pageY;

            overlay.classList.add('touched');
            break;

          case this.accessibilityUnlock:
            overlay.classList.add('touched');
            this.areaUnlock.classList.add('triggered');
            this.areaHandle.classList.add('triggered');
            this._touch.target = this.areaUnlock;
            this.handleGesture();
            break;

          case this.accessibilityCamera:
            overlay.classList.add('touched');
            this.areaUnlock.classList.add('triggered');
            this.areaHandle.classList.add('triggered');
            this._touch.target = this.areaCamera;
            this.handleGesture();
            break;
        }
        break;

      case 'mousemove':
        this.handleMove(evt.pageX, evt.pageY);
        break;

      case 'mouseup':
        var handle = this.areaHandle;
        window.removeEventListener('mousemove', this);
        window.removeEventListener('mouseup', this);

        this.overlay.classList.remove('touched-left');
        this.overlay.classList.remove('touched-right');

        this.handleMove(evt.pageX, evt.pageY);
        this.handleGesture();
        delete this._touch;
        this.overlay.classList.remove('touched');

        break;

      case 'transitionend':
        if (evt.target !== this.overlay)
          return;

        if (this.overlay.dataset.panel !== 'camera' &&
            this.camera.firstElementChild) {
          this.camera.removeChild(this.camera.firstElementChild);
        }

    }
  },

  handleMove: function ls_handleMove(pageX, pageY) {
    var touch = this._touch;

    if (!touch.touched) {
      // Do nothing if the user have not move the finger to the handle yet
      if (document.elementFromPoint(pageX, pageY) !== this.areaHandle)
        return;

      touch.touched = true;
      touch.initX = pageX;
      touch.initY = pageY;

      var overlay = this.overlay;
      overlay.classList.remove('touched-left');
      overlay.classList.remove('touched-right');
      overlay.classList.add('touched');
    }

    var dx = pageX - touch.initX;

    var handleMax = touch.maxHandleOffset;
    this.areaHandle.style.MozTransition = 'none';
    this.areaHandle.style.MozTransform =
      'translateX(' + Math.max(- handleMax, Math.min(handleMax, dx)) + 'px)';

    var railMax = touch.initRailLength;
    var railLeft = railMax + dx;
    var railRight = railMax - dx;

    this.railLeft.style.width =
      Math.max(0, Math.min(railMax * 2, railLeft)) + 'px';
    this.railRight.style.width =
      Math.max(0, Math.min(railMax * 2, railRight)) + 'px';

    var base = this.overlay.offsetWidth / 4;
    var opacity = Math.max(0.1, (base - Math.abs(dx)) / base);
    if (dx > 0) {
      touch.rightTarget.style.opacity =
        this.railRight.style.opacity = '';
      touch.leftTarget.style.opacity =
        this.railLeft.style.opacity = opacity;
    } else {
      touch.rightTarget.style.opacity =
        this.railRight.style.opacity = opacity;
      touch.leftTarget.style.opacity =
        this.railLeft.style.opacity = '';
    }

    var handleWidth = this.areaHandle.offsetWidth;

    if (railLeft < handleWidth / 2) {
      touch.leftTarget.classList.add('triggered');
      touch.rightTarget.classList.remove('triggered');
      touch.target = touch.leftTarget;
    } else if (railRight < handleWidth / 2) {
      touch.leftTarget.classList.remove('triggered');
      touch.rightTarget.classList.add('triggered');
      touch.target = touch.rightTarget;
    } else {
      touch.leftTarget.classList.remove('triggered');
      touch.rightTarget.classList.remove('triggered');
      touch.target = null;
    }
  },

  handleGesture: function ls_handleGesture() {
    var touch = this._touch;
    var target = touch.target;
    this.areaHandle.style.MozTransition = null;

    var distance = target.offsetLeft - this.areaHandle.offsetLeft -
      (this.areaHandle.offsetWidth - target.offsetWidth) / 2;
    this.areaHandle.classList.add('triggered');

    var transition = 'translateX(' + distance + 'px)';
    var railLength = touch.rightTarget.offsetLeft -
      touch.leftTarget.offsetLeft -
      (this.areaHandle.offsetWidth + target.offsetWidth) / 2;

    var self = this;
    switch (target) {
      case this.areaCamera:
        this.railRight.style.width = railLength + 'px';
        this.railLeft.style.width = '0';
        OnCallHandler.end();
        break;

      case this.areaUnlock:
        this.railLeft.style.width = railLength + 'px';
        this.railRight.style.width = '0';
        OnCallHandler.answer();
        break;
    }
  },

  getAllElements: function ls_getAllElements() {
    // ID of elements to create references
    var elements = ['connstate', 'mute', 'clock', 'date',
        'notification', 'notification-icon', 'notification-title',
        'notification-detail', 'notification-time',
        'area', 'area-unlock', 'area-camera', 'area-handle',
        'rail-left', 'rail-right',
        'passcode-code', 'passcode-pad',
        'camera', 'accessibility-camera', 'accessibility-unlock'];

    var toCamelCase = function toCamelCase(str) {
      return str.replace(/\-(.)/g, function replacer(str, p1) {
        return p1.toUpperCase();
      });
    }

    elements.forEach((function createElementRef(name) {
      this[toCamelCase(name)] = document.getElementById('lockscreen-' + name);
    }).bind(this));

    this.overlay = document.getElementById('main-container');
    this.mainScreen = document.getElementById('call-screen');
  }
};

swiper.init();
