// Tile interaction on the main game screen, with pointer events (mouse, touch, pen):
//  - tap a tray tile to select it, then tap a board cell to place it;
//  - or drag a tray tile onto the board (ghost preview + snap highlight);
//  - tap a placed tile to turn it clockwise (right-click: anticlockwise);
//    tapping it with the same tile selected also turns it, another tile replaces it;
//  - drag a placed tile to move it, off the board or onto the trash to remove it;
//    a long press removes it too; a long press on a tray tile explains it;
//  - undo (button or Ctrl/Cmd+Z) restores the board before the last edit.
// The board is locked while a program runs or is paused (see t.GameScreen.locked).
// Hooks for sound/feedback: t.UI.on("tile:select" | "tile:pick" | "tile:place" |
// "tile:rotate" | "tile:remove" | "tile:undo" | "tile:clear" | "tile:locked", fn).
(function() {
	"use strict";
	var UI = t.UI;
	var DRAG_START = 8, LONG_PRESS_MS = 550, UNDO_MAX = 100;
	// quiet UI sounds (js/audio.js); undo and clear are buttons, which click already
	var SOUNDS = { "tile:place": "tile-drop", "tile:rotate": "tile-rotate", "tile:remove": "tile-pick" };

	var TI = t.TileInput = {
		selected: null,	// operator selected in the tray
		press: null,	// pointer down, not yet a drag
		drag: null,		// {op, angle, from:{x,y}|null, p, dy, target, overTrash, before}
		hover: null,	// board cell under the mouse while a tile is selected
		undoStack: [],

		reset: function() {
			this.cancel();
			this.selected = null;
			this.undoStack = [];
		},
		cancel: function() {
			if(this.press && this.press.timer) clearTimeout(this.press.timer);
			if(this.drag && this.drag.from) this.restoreDrag();
			this.press = null; this.drag = null; this.hover = null;
			if(t.GameScreen) t.GameScreen.setTrashHot(false);
		},

		// ---- state ----
		active: function() {
			var Q = window.Q;
			return t.GameScreen && t.GameScreen.active && t.GameScreen.layout &&
				!(Q.stages[2] || Q.stages[4]) && !UI.modalOpen();
		},
		editable: function() { return this.active() && !t.GameScreen.locked(); },

		// ---- board edits (all go through t.TuringTable.setTile, which keeps belt joins) ----
		snapshot: function() {
			var tab = t.TuringTable.table, s = [];
			for(var x = 0; x < tab.length; x++) {
				s.push([]);
				for(var y = 0; y < tab[x].length; y++) s[x].push({ what: tab[x][y].what, angle: tab[x][y].angle || 0 });
			}
			return s;
		},
		pushUndo: function(snap) {
			this.undoStack.push(snap || this.snapshot());
			if(this.undoStack.length > UNDO_MAX) this.undoStack.shift();
		},
		canUndo: function() { return this.undoStack.length > 0; },
		commit: function(evt, data) {
			t.GameSaver.saveTuringTable();
			t.GameScreen.updateTools();
			if(SOUNDS[evt]) UI.sfx(SOUNDS[evt]);
			UI.emit(evt, data);
		},
		undo: function() {
			if(!this.editable() || !this.undoStack.length) return;
			var snap = this.undoStack.pop(), tt = t.TuringTable;
			for(var x = 0; x < snap.length; x++)
				for(var y = 0; y < snap[x].length; y++) tt.setTile(x, y, { what: snap[x][y].what, angle: snap[x][y].angle });
			this.commit("tile:undo");
		},
		clearBoard: function() {
			if(!this.editable()) { this.locked(); return; }
			if(this.isEmpty()) return;
			this.pushUndo();
			var tt = t.TuringTable;
			for(var x = 0; x < tt.xmax; x++)
				for(var y = 0; y < tt.ymax; y++) tt.setTile(x, y, { what: t.Operators.Empty, angle: 0 });
			this.commit("tile:clear");
		},
		isEmpty: function() {
			var tab = t.TuringTable.table;
			for(var x = 0; x < tab.length; x++)
				for(var y = 0; y < tab[x].length; y++) if(tab[x][y].what !== t.Operators.Empty) return false;
			return true;
		},
		cell: function(c) { return t.TuringTable.table[c.x][c.y]; },
		place: function(c, op, angle) {
			this.pushUndo();
			t.TuringTable.setTile(c.x, c.y, { what: op, angle: angle || 0 });
			this.commit("tile:place", { x: c.x, y: c.y, op: op });
		},
		rotate: function(c, dir) {
			var cur = this.cell(c);
			if(cur.what === t.Operators.Empty) return;
			this.pushUndo();
			// angle 1 is a quarter turn anticlockwise, so clockwise is -1
			t.TuringTable.setTile(c.x, c.y, { what: cur.what, angle: (((cur.angle || 0) + dir) % 4 + 4) % 4 });
			this.commit("tile:rotate", { x: c.x, y: c.y, dir: dir });
		},
		remove: function(c) {
			if(this.cell(c).what === t.Operators.Empty) return;
			this.pushUndo();
			t.TuringTable.setTile(c.x, c.y, { what: t.Operators.Empty, angle: 0 });
			this.commit("tile:remove", { x: c.x, y: c.y });
		},
		select: function(op) {
			this.selected = op;
			this.hover = null;
			if(op) UI.sfx("tile-pick");
			UI.emit("tile:select", { op: op });
		},
		locked: function() {
			t.GameScreen.nudgeLock();
			UI.emit("tile:locked");
		},

		// ---- hit testing (logical px) ----
		hit: function(p) {
			var L = t.GameScreen.layout;
			var slots = L.tray.slots, ops = t.Selector.operatorList();
			for(var i = 0; i < slots.length; i++) {
				var s = slots[i];
				if(p.x >= s.x - 4 && p.x < s.x + s.size + 4 && p.y >= s.y - 4 && p.y < s.y + s.size + 4)
					return { kind: "tray", op: ops[i], slot: s };
			}
			var c = t.TuringTable.cellAt(p.x, p.y);
			if(c) return { kind: "cell", cell: c, op: this.cell(c).what };
			return null;
		},
		overTrash: function(p) {
			var b = t.GameScreen.els.bin, L = t.GameScreen.layout;
			if(!b) return false;
			var r = b.getBoundingClientRect(), a = UI.toLogical(r.left, r.top), z = UI.toLogical(r.right, r.bottom);
			return p.x >= a.x - 6 && p.x <= z.x + 6 && p.y >= a.y - 6 && p.y <= z.y + 6;
		},

		// ---- pointer handling ----
		down: function(e) {
			if(!this.active()) return;
			var p = UI.toLogical(e.clientX, e.clientY);
			var h = this.hit(p);
			if(!h) { if(e.button === 0) this.press = { id: e.pointerId, start: p, hit: null }; return; }
			e.preventDefault();
			if(!this.editable()) { this.locked(); return; }
			try { e.target.setPointerCapture(e.pointerId); } catch(err) {}
			if(e.button === 2) {
				if(h.kind === "cell") this.rotate(h.cell, 1);
				return;
			}
			if(e.button !== 0) return;
			var pr = this.press = { id: e.pointerId, start: p, hit: h, touch: e.pointerType !== "mouse" };
			if(h.kind === "tray" && pr.touch && t.TileExplain) {
				// long press on a tray tile: show how it works
				pr.timer = setTimeout(function() {
					if(TI.press !== pr || TI.drag) return;
					pr.consumed = true;
					t.TileExplain.open([h.op], { fromPress: true });
				}, LONG_PRESS_MS);
			} else if(h.kind === "cell" && h.op !== t.Operators.Empty) {
				pr.timer = setTimeout(function() {
					if(TI.press !== pr || TI.drag) return;
					pr.consumed = true;
					TI.remove(h.cell);
					if(navigator.vibrate) try { navigator.vibrate(15); } catch(err) {}
				}, LONG_PRESS_MS);
			}
		},
		move: function(e) {
			if(!this.active()) { this.hover = null; return; }
			var p = UI.toLogical(e.clientX, e.clientY);
			var pr = this.press;
			if(pr && pr.id === e.pointerId && pr.hit && !pr.consumed && !this.drag) {
				var dx = p.x - pr.start.x, dy = p.y - pr.start.y;
				if(dx * dx + dy * dy > DRAG_START * DRAG_START) this.startDrag(pr);
			}
			if(this.drag) {
				var d = this.drag;
				d.p = p;
				d.target = t.TuringTable.cellAt(p.x, p.y + d.dy, 12);
				d.overTrash = !d.target && this.overTrash({ x: p.x, y: p.y + d.dy });
				t.GameScreen.setTrashHot(d.overTrash);
				return;
			}
			if(e.pointerType === "mouse" && this.selected && this.editable())
				this.hover = t.TuringTable.cellAt(p.x, p.y) || null;
			else this.hover = null;
		},
		startDrag: function(pr) {
			if(pr.timer) clearTimeout(pr.timer);
			var h = pr.hit, d = { op: h.op, angle: 0, from: null, p: pr.start, dy: pr.touch ? -34 : 0 };
			if(h.kind === "cell") {
				var cur = this.cell(h.cell);
				d.angle = cur.angle || 0;
				d.from = h.cell;
				d.before = this.snapshot();
				t.TuringTable.setTile(h.cell.x, h.cell.y, { what: t.Operators.Empty, angle: 0 });
			}
			this.drag = d;
			this.hover = null;
			UI.sfx("tile-pick");
			UI.emit("tile:pick", { op: d.op });
		},
		restoreDrag: function() {
			var d = this.drag;
			t.TuringTable.setTile(d.from.x, d.from.y, { what: d.op, angle: d.angle });
		},
		up: function(e) {
			var pr = this.press, d = this.drag;
			if(pr && pr.timer) clearTimeout(pr.timer);
			this.press = null;
			if(d) {
				this.drag = null;
				t.GameScreen.setTrashHot(false);
				if(d.target) {
					var same = d.from && d.from.x === d.target.x && d.from.y === d.target.y;
					if(d.from) {
						t.TuringTable.setTile(d.target.x, d.target.y, { what: d.op, angle: d.angle });
						if(!same) this.pushUndo(d.before);
						this.commit("tile:place", { x: d.target.x, y: d.target.y, op: d.op, moved: !same });
					} else this.place(d.target, d.op, 0);
				} else if(d.from) {
					this.pushUndo(d.before);
					this.commit("tile:remove", { x: d.from.x, y: d.from.y });
				}
				return;
			}
			if(!pr || pr.id !== e.pointerId || pr.consumed || !this.active()) return;
			this.tap(pr.hit);
		},
		tap: function(h) {
			if(!h) { if(this.selected) this.select(null); return; }
			if(h.kind === "tray") { this.select(this.selected === h.op ? null : h.op); return; }
			var c = h.cell, cur = this.cell(c).what;
			if(this.selected && this.selected !== cur) this.place(c, this.selected, 0);
			else if(cur !== t.Operators.Empty) this.rotate(c, -1);
		},
		pointerCancel: function() { this.cancel(); },

		// ---- drawing (called by Q.TileOverlay every frame, logical px) ----
		drawOverlay: function(ctx) {
			if(!t.GameScreen.layout) return;
			var L = t.GameScreen.layout, P = t.GameScreen.PITCH, tt = t.TuringTable;
			var ops = t.Selector.operatorList();
			if(this.selected) {
				var i = ops.indexOf(this.selected);
				if(i >= 0) ring(ctx, L.tray.slots[i].x, L.tray.slots[i].y, P, t.Skin.color("tomato"));
			}
			var d = this.drag, cell = d ? d.target : this.hover, op = d ? d.op : this.selected;
			if(cell && op) {
				var cc = tt.cellCenter(cell.x, cell.y);
				var angle = d ? d.angle : (tt.table[cell.x][cell.y].what === op ? tt.table[cell.x][cell.y].angle - 1 : 0);
				// belt joins as they would be after the drop: the ghost itself and
				// any neighbouring belt that would bend or straighten
				var joins = tt.previewJoins(cell.x, cell.y, { what: op, angle: ((angle % 4) + 4) % 4 });
				for(var j = 1; j < joins.length; j++) {
					var nc = tt.cellCenter(joins[j].x, joins[j].y);
					t.UI.drawTile(ctx, joins[j].what, joins[j].angle, nc.x, nc.y, P, 1, joins[j].sheet);
				}
				ctx.save();
				ctx.fillStyle = t.Skin.color("dropWash");
				ctx.fillRect(cc.x - P / 2, cc.y - P / 2, P, P);
				ctx.restore();
				t.UI.drawTile(ctx, op, angle, cc.x, cc.y, P, 0.6, joins[0].sheet);
				ring(ctx, cc.x - P / 2, cc.y - P / 2, P, t.Skin.color("ink"));
			}
			if(d) {
				var x = d.p.x, y = d.p.y + d.dy;
				ctx.save();
				ctx.shadowColor = t.Skin.color("dragShadow");
				ctx.shadowBlur = 10;
				ctx.shadowOffsetY = 6;
				t.UI.drawTile(ctx, d.op, d.angle, x, y, P * 1.12, d.overTrash ? 0.5 : 0.95);
				ctx.restore();
			}
		},

		attach: function(canvas) {
			canvas.addEventListener("pointerdown", function(e){ TI.down(e); });
			canvas.addEventListener("pointermove", function(e){ TI.move(e); });
			canvas.addEventListener("pointerup", function(e){ TI.up(e); });
			canvas.addEventListener("pointercancel", function(){ TI.pointerCancel(); });
			canvas.addEventListener("pointerleave", function(e){ if(e.pointerType === "mouse" && !TI.drag) TI.hover = null; });
			document.addEventListener("keydown", function(e) {
				if(!TI.active()) return;
				if(e.key === "Escape") { TI.cancel(); if(TI.selected) TI.select(null); }
				else if((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === "z" || e.key === "Z")) { e.preventDefault(); TI.undo(); }
			});
		}
	};

	function ring(ctx, x, y, size, color) {
		ctx.save();
		ctx.lineWidth = 4;
		ctx.strokeStyle = color;
		t.UI.roundRect(ctx, x - 3, y - 3, size + 6, size + 6, 7);
		ctx.stroke();
		ctx.lineWidth = 2;
		ctx.strokeStyle = t.Skin.color("cream");
		t.UI.roundRect(ctx, x - 6, y - 6, size + 12, size + 12, 9);
		ctx.stroke();
		ctx.restore();
	}
})();
