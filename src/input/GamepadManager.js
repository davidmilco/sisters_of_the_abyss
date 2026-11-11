// GamepadManager: Universal Gamepad & Controller Support
// Supports Xbox, PlayStation DualShock/DualSense, Nintendo Switch Pro, and standard HID controllers.
// Provides analog stick deadzones, digital d-pad mapping, button edge detection (justDown), and haptic rumble.

export class GamepadManager {
  constructor(scene) {
    this.scene = scene;
    this.connected = false;
    this.pad = null;
    this.padIndex = null;
    this.id = '';
    this.activeInputType = 'keyboard'; // 'keyboard' | 'gamepad'
    this.prevButtons = {};
    this.currentButtons = {};

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('gamepadconnected', (e) => {
      this.connected = true;
      this.padIndex = e.gamepad.index;
      this.id = e.gamepad.id;
      console.log(`[GamepadManager] Controller Connected: ${this.id} at index ${this.padIndex}`);
      if (this.scene && this.scene.events) {
        this.scene.events.emit('gamepad_status_changed', { connected: true, id: this.id });
      }
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.padIndex === e.gamepad.index) {
        this.connected = false;
        this.pad = null;
        this.padIndex = null;
        this.activeInputType = 'keyboard';
        console.log(`[GamepadManager] Controller Disconnected: ${e.gamepad.id}`);
        if (this.scene && this.scene.events) {
          this.scene.events.emit('gamepad_status_changed', { connected: false, id: '' });
          this.scene.events.emit('input_type_changed', 'keyboard');
        }
      }
    });

    // Detect keyboard use to dynamically swap HUD prompts back to keyboard
    window.addEventListener('keydown', () => {
      if (this.activeInputType !== 'keyboard') {
        this.activeInputType = 'keyboard';
        if (this.scene && this.scene.events) {
          this.scene.events.emit('input_type_changed', 'keyboard');
        }
      }
    });
  }

  update() {
    if (!navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    // Find first active gamepad if not yet bound
    let foundPad = null;
    if (this.padIndex !== null && gamepads[this.padIndex]) {
      foundPad = gamepads[this.padIndex];
    } else {
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
          foundPad = gamepads[i];
          this.padIndex = i;
          this.connected = true;
          this.id = gamepads[i].id;
          break;
        }
      }
    }

    if (!foundPad) {
      this.pad = null;
      this.connected = false;
      return;
    }

    this.pad = foundPad;
    this.prevButtons = { ...this.currentButtons };

    // Standard Gamepad Map (W3C standard):
    // 0: Bottom face (A / Cross)
    // 1: Right face (B / Circle)
    // 2: Left face (X / Square)
    // 3: Top face (Y / Triangle)
    // 4: Left shoulder (LB / L1)
    // 5: Right shoulder (RB / R1)
    // 6: Left trigger (LT / L2)
    // 7: Right trigger (RT / R2)
    // 8: Back / Select / Share
    // 9: Start / Options
    // 10: Left stick click (L3)
    // 11: Right stick click (R3)
    // 12: D-Pad Up
    // 13: D-Pad Down
    // 14: D-Pad Left
    // 15: D-Pad Right

    const isBtnPressed = (idx) => {
      if (!this.pad.buttons[idx]) return false;
      return this.pad.buttons[idx].pressed || this.pad.buttons[idx].value > 0.4;
    };

    const stickX = this.pad.axes[0] || 0;
    const stickY = this.pad.axes[1] || 0;
    const deadzone = 0.28;

    this.currentButtons = {
      jump: isBtnPressed(0),                    // A / Cross
      interact: isBtnPressed(1) || isBtnPressed(12), // B / Circle (or D-Pad Up); A is exclusively Jump
      attack: isBtnPressed(2),                  // X / Square
      cast: isBtnPressed(3),
      dash: isBtnPressed(5) || isBtnPressed(7), // RB or RT
      shieldBash: isBtnPressed(6),             // LT
      astralRay: isBtnPressed(4),              // LB
      grapple: isBtnPressed(11) || isBtnPressed(10), // R3 or L3
      left: isBtnPressed(14) || stickX < -deadzone,
      right: isBtnPressed(15) || stickX > deadzone,
      up: isBtnPressed(12) || stickY < -deadzone,
      down: isBtnPressed(13) || stickY > deadzone,
      map: isBtnPressed(8),                    // Select/Back
      pause: isBtnPressed(9),                  // Start/Options
    };

    // If any button or stick input is active, mark gamepad as active input mode
    const anyInput = Object.values(this.currentButtons).some(Boolean);
    if (anyInput && this.activeInputType !== 'gamepad') {
      this.activeInputType = 'gamepad';
      if (this.scene && this.scene.events) {
        this.scene.events.emit('input_type_changed', 'gamepad');
      }
    }
  }

  isDown(action) {
    if (!this.connected) return false;
    return !!this.currentButtons[action];
  }

  justDown(action) {
    if (!this.connected) return false;
    return !!this.currentButtons[action] && !this.prevButtons[action];
  }

  // Dual-Rumble Haptic Feedback
  rumble(duration = 180, weakMagnitude = 0.45, strongMagnitude = 0.6) {
    if (!this.pad || !this.pad.vibrationActuator) return;
    try {
      this.pad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: duration,
        weakMagnitude: weakMagnitude,
        strongMagnitude: strongMagnitude,
      });
    } catch (e) {
      // Vibration not supported by OS/browser
    }
  }
}
