# @akwaba/events

## Overview

A cross-browser event module

Published on [npmjs.com](https://www.npmjs.com) as `@akwaba/events`.


## API

- `add(element, eventName, handler)` - Registers either a normal event or a custom event on the given element
- `remove(element, eventName, handler)` - Removes either a normal event or a custom event from the given element
- `fire(element, eventName, data, bubbles = true)` - Fires a custom event on the given DOM element
- `stop(event)` - Cancels the default action for this event and prevents it from bubbling
- `isCustomEvent(eventName)` - Returns true if the given event name is that of a custom event; otherwise, returns false
- `element(event)` - Returns the DOM element on which the event occured
- `pointer(event)` - Returns an object that contains the absolute horizontal and vertical coordinates for the event


### Usage

```js

import Event from '@akwaba/events';

/** Observing the "dom:loaded" custom event */
Event.add(document, "data:loaded", (event) => console.log("DOM ready!"));

/**
 * Attaching a regular event handler, assuming the following markup
 * 
 * <ul id="navigation>
 *    <li><a href="/">Home</a></li>
 *    <li><a href="/contact">Contact Us</a></li>
 * </ul>
 */
const onNavigation = (event) => console.log("Handling navigation...");
Event.add("navigation", "click", onNavigation);


/** 
 * Firing and handling a custom event (i.e. "login:request")
 * 
 * 1. Inside the sender
 */
Event.fire(document, "login:request", {
    username: "hsimpson"
});

/** 2. Inside the receiver (i.e. document) */
Event.add(document, "login:request", (event) => console.log(event.model.username));


/** 
 * Removing the previously attached handler
 */
Event.remove("navigation", "click", onNavigation);


/** 
 * Observing keyboard events
 * 
 * First, a binding of key code (with possible modifiers) and handlers must be defined
 */
const bindings = {
    "L": (event) => console.log("Letter 'L' detected"),
    "ctrl_x": (event) => console.log("CTRL+X detected")
}

/** Next, an instance of a `KeyMap` must be instantiated and intialized with the bindings */
const keyMap = new Event.KeyMap(bindings);

/** Finally, the instance is attached to an element, usually the document */
keyMap.attachToElement(document);

// Console log message are now displayed whenever the "L" key or "CTRL+X" key combinations are pressed

```


## License
Copyright (c) 2019 Akwaba Systems, Inc.
