/*global Quintus:false */

Quintus.Touch = function(Q) {
  if(Q._isUndefined(Quintus.Sprites)) {
    throw "Quintus.Touch requires Quintus.Sprites Module";
  }

  var hasTouch =  !!('ontouchstart' in window);

  var touchStage = [0];
  var touchType = 0;

  Q.Evented.extend("TouchSystem",{

    init: function() {
      var touchSystem = this;

      this.boundTouch = function(e) { touchSystem.touch(e); };
      this.boundDrag = function(e) { touchSystem.drag(e); };
      this.boundEnd = function(e) { touchSystem.touchEnd(e); };

      // Pointer events cover mouse, touch and pen with one stream (no
      // duplicate touch + emulated mouse events).
      Q.el.addEventListener('pointerdown',this.boundTouch);
      Q.el.addEventListener('pointermove',this.boundDrag);
      Q.el.addEventListener('pointerup',this.boundEnd);
      Q.el.addEventListener('pointercancel',this.boundEnd);

      this.touchPos = new Q.Evented();
      this.touchPos.grid = {};
      this.touchPos.p = { w:1, h:1, cx: 0, cy: 0 };
      this.activeTouches = {};
      this.touchedObjects = {};
    },

    destroy: function() {
      Q.el.removeEventListener('pointerdown',this.boundTouch);
      Q.el.removeEventListener('pointermove',this.boundDrag);
      Q.el.removeEventListener('pointerup',this.boundEnd);
      Q.el.removeEventListener('pointercancel',this.boundEnd);
    },

    normalizeTouch: function(touch,stage) {
      // Map client coordinates through the canvas' on-screen rectangle, so
      // taps land right however the canvas is scaled or transformed by CSS.
      var rect = Q.el.getBoundingClientRect();
      this.touchPos.p.ox = this.touchPos.p.px = (touch.clientX - rect.left) * Q.width / rect.width;
      this.touchPos.p.oy = this.touchPos.p.py = (touch.clientY - rect.top) * Q.height / rect.height;

      if(stage.viewport) {
        this.touchPos.p.px /= stage.viewport.scale;
        this.touchPos.p.py /= stage.viewport.scale;
        this.touchPos.p.px += stage.viewport.x;
        this.touchPos.p.py += stage.viewport.y;
      }

      this.touchPos.p.x = this.touchPos.p.px;
      this.touchPos.p.y = this.touchPos.p.py;

      this.touchPos.obj = null;
      return this.touchPos;
    },

    touch: function(e) {
      var touches = e.changedTouches || [ e ];

      for(var i=0;i<touches.length;i++) {

        for(var stageIdx=0;stageIdx < touchStage.length;stageIdx++) {
          var touch = touches[i],
              stage = Q.stage(touchStage[stageIdx]);

          if(!stage) { continue; }

          touch.identifier = touch.pointerId || touch.identifier || 0;
          var pos = this.normalizeTouch(touch,stage);

          stage.regrid(pos,true);
          var col = stage.search(pos,touchType), obj;

          if(col || stageIdx === touchStage.length - 1) {
            obj = col && col.obj;
            pos.obj = obj;
            this.trigger("touch",pos);
          }

          if(obj && !this.touchedObjects[obj]) {
            this.activeTouches[touch.identifier] = {
              x: pos.p.px,
              y: pos.p.py,
              origX: obj.p.x,
              origY: obj.p.y,
              sx: pos.p.ox,
              sy: pos.p.oy,
              identifier: touch.identifier,
              obj: obj,
              stage: stage
            };
            this.touchedObjects[obj.p.id] = true;
            obj.trigger('touch', this.activeTouches[touch.identifier]);
            break;
          }

        }

      }
      //e.preventDefault();
    },

    drag: function(e) {
      var touches = e.changedTouches || [ e ];

      for(var i=0;i<touches.length;i++) {
        var touch = touches[i];
        touch.identifier = touch.pointerId || touch.identifier || 0;

        var active = this.activeTouches[touch.identifier],
            stage = active && active.stage;

        if(active) {
          var pos = this.normalizeTouch(touch,stage);
          active.x = pos.p.px;
          active.y = pos.p.py;
          active.dx = pos.p.ox - active.sx;
          active.dy = pos.p.oy - active.sy;

          active.obj.trigger('drag', active);
        }
      }
      e.preventDefault();
    },

    touchEnd: function(e) {
      var touches = e.changedTouches || [ e ];

      for(var i=0;i<touches.length;i++) {
        var touch = touches[i];

        touch.identifier = touch.pointerId || touch.identifier || 0;

        var active = this.activeTouches[touch.identifier];

        if(active) {
          active.obj.trigger('touchEnd', active);
          delete this.touchedObjects[active.obj.p.id];
          this.activeTouches[touch.identifier] = null;
        }
      }
      e.preventDefault();
    }

  });

  Q.touch = function(type,stage) {
    Q.untouch();
    touchType = type || Q.SPRITE_UI;
    touchStage = stage || [2,1,0];
    if(!Q._isArray(touchStage)) {
      touchStage = [touchStage];
    }

    if(!Q._touch) {
      Q.touchInput = new Q.TouchSystem();
    }
    return Q;
  };

  Q.untouch = function() {
    if(Q.touchInput) {
      Q.touchInput.destroy();
      delete Q['touchInput'];
    }
    return Q;
  };

};
