/**
 * Portions of this code largely influenced by the Prototype Javascript library.
 *
 * Prototype (c) 2005-2010 Sam Stephenson
 */
import Extensions       from "@akwaba/object-extensions";
import HTML             from "@akwaba/html";
import DOM              from "@akwaba/dom";
import isCustomEvent    from "./is-custom-event";

const eventCache = [];


/**
* Normalizes the event object in a cross-browser fashion. For W3C-compliant browsers, it simply returns the
* original event object. For IE, it wraps the event in a object that exposes the missing properties and methods
* to make them more compatible
*
* @param {Event} event      the event to normalize
* @param {Node} element     the event target
* @return {Event} a normalized event object
*/
const normalize = (event, element) => {

    if (!window.attachEvent) {
        return event;
    }

    const normalized = {
        _event: event,
        type: event.type,
        target: event.srcElement,
        currentTarget: element,
        relatedTarget: event.fromElement ? event.fromElement : event.toElement,
        eventPhase: (event.srcElement === element) ? 2 : 3,

        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,

        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        charCode: event.keyCode,
        model: event.model || { },

        stopPropagation() {
            this._event.cancelBubble = true;
        },

        preventDefault() {
            this._event.returnValue = false;
        }
    };

    /** Handle mouse position */
    if (event.clientX !== null) {
        const doc = document.documentElement;
        const { body } = document;
        normalized.pageX = event.clientX + ((doc && doc.scrollLeft) || (body && body.scrollLeft) || 0) -
            ((doc && doc.clientLeft) || (body && body.cientLeft) || 0);

        normalized.pageY = event.clientY + ((doc && doc.scrollTop) || (body && body.scrollTop) || 0) -
            ((doc && doc.clientTop) || (body && body.cientTop) || 0);
    }

    return normalized;
};


/**
 * Creates a handler for an event. The handler is stored in an array of event handlers for a specific
 * event type; all event types are also stored in a map for a given DOM element. This pattern allows for
 * a centralization of the handlers for an element, and frees it from any possibility of memory leaks
 *
 * @param {Node} element            the element on which to observe the event
 * @param {String} eventName        the name of the event (i.e. click, data:loaded)
 * @param {Function} callback       the event handler
 * @return {Function} an event handler
 */
const createHandler = (element, eventName, callback) => {
    let model = DOM.storage.retrieve(element, "events");

    if (!model) {
        model = { };
        DOM.storage.store(element, "events", model);
        eventCache.push(element);
    }

    let handlers = model[eventName];

    if (!handlers) {
        handlers = [];
        model[eventName] = handlers;
    }

    /**
     * Prevents an event of the same type from being added twice with the same handler
     */
    const handlersForEvent = handlers.map((handler) => handler.callback);

    if (Array.contains(handlersForEvent, callback)) {
        return false;
    }

    let handler;

    if (isCustomEvent(eventName)) {
        handler = (event) => {
            if (Extensions.isUndefined(event.eventName)) {
                return false;
            }

            if (event.eventName !== eventName) {
                return false;
            }

            event = normalize(event, element);
            callback.call(element, event);
        };
    } else {
        handler = (event) => {
            event = normalize(event, element);
            callback.call(element, event);
        };
    }

    handler.callback = callback;
    handlers.push(handler);

    return handler;
};


/**
 * Returns the DOM element on which the event occured; the same element will be returned whether the event is
 * in capture mode or bubble mode. The implementation addresses the use case where Firefox screws up the "click",
 * "load" or "error" event on images. It also fixes Safari's bug where an anchor's text node get passed as the target
 * rather than the anchor itself
 *
 * @param {Event} event     the event for which to retrieve the element
 * @return {Node} the DOM element on which the event occurred
 */
const element = (event) => {
    let node = event.target;
    const { type, currentTarget } = event;

    if (currentTarget && currentTarget.tagName) {
        if (type === "load" || type === "error" ||
        (type === "click" && currentTarget.tagName.toLowerCase() === "input" &&
            currentTarget.type === "radio")) {
            node = currentTarget;
        }
    }

    if (node.nodeType === HTML.nodeType.TEXT_NODE) {
        node = node.parentNode;
    }

    return node;
};


/**
 * Returns the absolute horizontal coordinate for the event
 *
 * @param {Event} event     the event for which to retrieve the coordinate
 * @return {Number} the absolute horizontal coordinate for the event
 */
const pointerX = (event) => {
    const docElem = document.documentElement;
    const body = document.body || {scrollLeft: 0};

    return event.pageX || (event.clientX + (docElem.scrollLeft || body.scrollLeft) - (document.clientLeft || 0));
};


/**
 * Returns the absolute vertical coordinate for the event
 *
 * @param {Event} event     the event for which to retrieve the coordinate
 * @return {Number} the absolute vertical coordinate for the event
 */
const pointerY = (event) => {
    const docElem = document.documentElement;
    const body = document.body || {scrollTop: 0};

    return event.pageY || (event.clientY + (docElem.scrollTop || body.scrollTop) - (document.clientTop || 0));
};


/**
 * Returns the absolute horizontal and vertical coordinates for the event
 *
 * @param {Event} event     the event for which to retrieve the coordinates
 * @return {Object} an object that contains the horizontal and vertical coordinates for the event
 */
const pointer = (event) => ({
    x: pointerX(event),
    y: pointerY(event)
});


/**
 * Cancels the default action for this event and prevents it from bubbling
 *
 * @param {Event} event     the event for which to prevent the default behavior
 */
const stop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopped = true;
};


/**
 * Registers either a normal event or a custom event on the given element. Custom events follow the "noun:verb"
 * naming convention.
 * A handler is created for each actual event and stored in the handlers array of the specified type. This centralized
 * model allows for easy registration and de-registration of events
 *
 * @param {Node} element        the DOM element on which to observe the event
 * @param {String} eventName    the name of the event to observe (i.e. click, submit...)
 * @param {Function} callback   the callback method to invoke when the event is fired
 * @return {Element} the element on which the event is being observed
 */
const add = (element, eventName, callback) => {
    element = Extensions.isString(element) ? HTML.getElement(element) : element;

    if (!element) {
        throw new Error(`Invalid element provided for event "${eventName}"`);
    }

    const handler = createHandler(element, eventName, callback);

    if (!handler) {
        return element;
    }

    if (isCustomEvent(eventName)) {
        if (element.addEventListener) {
            element.addEventListener("dataavailable", handler, false);
        } else {
            element.attachEvent("ondataavailable", handler);
            element.attachEvent("onfilterchange", handler);
        }
    } else {
        if (element.addEventListener) {
            element.addEventListener(eventName, handler, false);
        } else {
            element.attachEvent(`on${eventName}`, handler);
        }
    }

    return element;
};


/**
 * Removes either a normal event or a custom event from the given element
 *
 * @param {Node} element            the DOM element from which to remove the event
 * @param {String} eventName        the name of the event to remove (i.e. click, submit...)
 * @param {Function} callback       the handler associated with this event
 * @return {Element} the element from which the event is being removed
 */
const remove = (element, eventName, callback) => {
    const model = DOM.storage.retrieve(element, "events");

    if (!model) {
        return element;
    }

    if (!eventName) {
        Object.keys(model).forEach((evtName) => {
            remove(element, evtName);
        });

        return element;
    }

    const handlers = model[eventName];

    if (!handlers) {
        return element;
    }

    /**
     * If no callback is provided, remove all events of the type specified. The double-check logic is needed for
     * IE, which still returns a null reference on some handlers
     */
    if (!callback) {
        handlers.forEach((handler) => {
            if (handler) {
                remove(element, eventName, handler.callback);
            }
        });

        return element;
    }

    const handler = handlers.find((h) => h.callback === callback);

    if (!handler) {
        return element;
    }

    if (isCustomEvent(eventName)) {
        if (element.removeEventListener) {
            element.removeEventListener("dataavailable", handler, false);
        } else {
            element.detachEvent("ondataavailable", handler);
            element.detachEvent("onfilterchange", handler);
        }
    } else {
        if (element.removeEventListener) {
            element.removeEventListener(eventName, handler, false);
        } else {
            element.detachEvent(`on${eventName}`, handler);
        }

        const index = handlers.indexOf(handler);
        handlers.splice(index, 1);
    }

    delete handler.callback;

    if (Array.isEmpty(handlers)) {
        delete model[eventName];
    }

    return element;
};


/**
 * Fires a custom event on the given DOM element. The event object has a "model" property that contains the specific
 * data to send with the event.
 *
 *  @param {Node} element       the element on which to fire the synthetic event
 *  @param {String} eventName   the name of this event
 *  @param {Object} data        the data to send with this event
 *  @param {Boolean} bubbles    specifies whether the event bubbles
 *  @return {Event} the custom event
 */
const fire = (element, eventName, data, bubbles = true) => {
    let event;

    if (element === document && document.createEvent && !element.dispatchEvent) {
        element = document.documentElement;
    }

    if (document.createEvent) {
        event = document.createEvent("HTMLEvents");
        event.initEvent("dataavailable", true, true);
    } else if (document.createEventObject) {
        event = document.createEventObject();
        event.eventType = bubbles ? "ondataavailable" : "onfilterchange";
    } else {
        return;
    }

    event.eventName = eventName;
    event.model = data || {};

    if (document.createEvent) {
        element.dispatchEvent(event);
    } else {
        element.fireEvent(event.eventType, event);
    }

    return event;
};


/**
 * Clears the event cache
 */
const destroyCache = () => {
    eventCache.forEach((element) => remove(element));
};


/*
 * Support for the DOMContentLoaded event
 * This implementation is based on work by Dan Webb, Matthias Miller, Dean Edwards and John Resig.
 */
(function() {
    let timer;

    function fireContentLoadedEvent() {
        if (document.loaded) {
            return;
        }

        if (timer) {
            window.clearInterval(timer);
        }

        fire(document, "dom:loaded", {});
        document.loaded = true;
    }

    if (document.addEventListener) {
        window.addEventListener("DOMContentLoaded", fireContentLoadedEvent, false);

    } else {
        document.write("<script id=__onDOMContentLoaded defer src=//:><\/script>");
        document.getElementById("__onDOMContentLoaded").onreadystatechange = function() {
            if (this.readyState === "complete") {
                this.onreadystatechange = null;
                fireContentLoadedEvent();
            }
        };
    }
}());

/** If IE, clear the event cache on page unload */
if (window.attachEvent) {
    window.attachEvent("onbeforeunload", destroyCache);
}

export default {
    element,
    pointer,
    add,
    remove,
    fire,
    stop,
    isCustomEvent
};
