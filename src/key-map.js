import PrintableChars from "./printable-chars";


export default class KeyMap {
    constructor(bindings) {
        this.map = {};

        if (bindings) {
            Object.keys(bindings).forEach((name) => {
                this.map[name.toLowerCase()] = bindings[name];
            });
        }
    }

    bind(key, fn) {
        this.map[key.toLowerCase()] = fn;
    }

    unbind(key) {
        key = key.toLowerCase();

        if (this.map[key]) {
            delete this.map[key];
        }
    }

    attachToElement(element) {
        const handler = (event) => this.dispatch(event);

        if (element.addEventListener) {
            element.addEventListener("keydown", handler, false);
            element.addEventListener("keypress", handler, false);
        } else if (element.attachEvent) {
            element.attachEvent("onkeydown", handler);
            element.attachEvent("onkeypress", handler);
        } else {
            element.onkeydown = handler;
        }
    }

    dispatch(event) {
        const e = event || window.event;
        let modifiers = "";
        let keyname = null;

        if (e.type === "keydown") {
            const code = e.keyCode;

            // Ignore keydown event for Shift, Ctrl and Alt
            if (code === 16 || code === 17 || code === 18) {
                return;
            }

            keyname = PrintableChars[code];

            if (!keyname && (e.altKey || e.ctrlKey)) {
                keyname = PrintableChars[code];
            }

            if (keyname) {
                if (e.altKey) {
                    modifiers += "alt_";
                }

                if (e.ctrlKey) {
                    modifiers += "ctrl_";
                }

                if (e.shiftKey) {
                    modifiers += "shift_";
                }
            } else {
                return;
            }

        } else if (e.type === "keypress") {
            if (e.altKey || e.ctrlKey) {
                return;
            }

            if (e.charCode !== undefined && e.charCode === 0) {
                return;
            }

            const code = e.charCode || e.keyCode;
            keyname = String.fromCharCode(code);

            // If the keyname is in uppercase, convert it to lowercase and add shift
            // we do it this way to handle CAPS LOCK; it sends capital letters
            // without having to press Shift
            const lowercase = keyname.toLowerCase();

            if (keyname !== lowercase) {
                keyname = lowercase;
                modifiers = "shift_";
            }
        }

        const func = this.map[`${modifiers}${keyname}`];

        if (!func) {
            return;
        }

        const target = e.target || e.srcElement;
        func(target, `${modifiers}${keyname}`, e);

        if (e.stopPropagation) {
            e.stopPropagation();
        } else {
            e.cancelBubble = true;
        }

        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }

        return false;
    }
}
