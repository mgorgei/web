New Tab
----------
Hand-coded website from scratch that would replace what is usually a browser's default new tab screen.

Bookmarks with a preview of the site so that they can be identified visually.

* HTML5 drag and drop reordering of links.
* Uses Page2Images's REST API for the initial load of a screen capture.  The server saves these locally by the related database primary key.
* Modal dialogue to add and modify hyperlink names and addresses.

LED alarm clock capable of having multiple times specified by either the time intended (5:00:00 AM) or as a stop watch (1 hour, 20 minutes from now)

* HTML5 canvas, representing the real-time clock, has its palette manipulated by CSS
* The four associated classes are modified by a context-sensitive click on a color-matching area in the canvas through a color picker (JScolor).
* The clock flashes, like an LED alarm clock, and audibly gives a periodic, soft alarm sound when at least one alarm is triggered.  The table also visually indicates graphically which table row is triggering an alarm.
* Beneath the canvas element is an in-line form that lets users submit new times for use as a daily reminder displayed in a table.
* One-time events can be deleted after they have been expired or when they are otherwise not useful.

All user-produced data is sent and received in the JSON format.  Client-side is through AJAX queries.  Server-side is PHP echoing an object.  This interaction resembles a RESTful API where POST, GET, PUT, DELETE requests match create, read, update, and delete operations on the database.

The portions I did not wholly code myself: Page2Images API interaction that produces a screen capture of a website, SVG to IMG tag conversion that allows icons to be displayed in multiple colors dependent on context (hovering for instance).  I did not author any of the media save for color-coding the digits in the clock to respond to palette changes.

Technology used:
jQuery, JavaScript, PHP, HTML, CSS, Bootstrap

Background
---------
This project was originally meant to iteratively build a responsive webpage that replaces what I think ought to be the contents of a new tab.  When I further researched what responsive meant, I abandoned that idea since I was not interested in gracefully degrading a page heavily reliant on JavaScript to be suddenly without it.

There did not appear to be an officially supported means of pulling Chrome's synced data (locally would not have been a problem, but would not give the desired result) that I originally wanted to begin at. I exhaustively checked stackoverflow for an answer, a way worked a couple years ago and was silently removed. Ideally, this would supplant and allow me to extend the capabilities that I feel are missing in Chrome's standard new tab, but not to be implemented as a plug-in or otherwise rely on Chrome at all. I still want a way to salvage visited history remotely as I cannot find an alternate way of working with it.

Known issues
--------
* There is no concept of users in the database(yet?), so any modifications to the page by concurrent users are going to give unexpected results.
* The hyperlink's containing div border area won't allow dragging.

Future changes
-------
* Scaling the canvas based on horizontal view width (a quick preview of CSS transform did not behave in a desirable way).  The clock is unreadable on small screens at the moment.
* Click highlighting links and a button icon that would replace the desktop right-click functionality that brings up a modal dialogue, so all features would be usable on a phone.  This does compete with the user experience, so a mode variable may be desirable in this case.

See it live
---------
I regularly upload a working version that is usually a few revisions behind this on my personal page: http://mgorgei.x10host.com