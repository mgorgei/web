New Tab
----------
This project was originally meant to iteratively build a responsive webpage that replaces what I think ought to be the contents of a new tab.  When I further researched what responsive meant, I abandoned that idea since I was not interested in gracefully degrading a page heavily reliant on JavaScript to be suddenly without it.

There did not appear to be an officially supported means of pulling Chrome's synced data (locally would not have been a problem, but would not give the desired result) that I originally wanted to begin at. I exhaustively checked stackoverflow for an answer, a way worked a couple years ago and was silently removed. Ideally, this would supplant and allow me to extend the capabilities that I feel are missing in Chrome's standard new tab, but not to be implemented as a plug-in or otherwise rely on Chrome at all. I still want a way to salvage visited history remotely as I cannot find an alternate way of working with it.

Known issues
--------
There is no concept of users in the database(yet?), so any modifications to the page by concurrent users are going to give unexpected results.
The hyperlink's containing div border area won't allow dragging.

See it live
---------
I regularly upload a working version that is usually a few revisions behind this on my personal page: http://mgorgei.x10host.com