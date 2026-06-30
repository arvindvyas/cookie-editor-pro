# Cookie Editor Pro — Chrome Web Store listing copy

## Name
Cookie Editor Pro — View, Edit, Clean & Manage Cookies

## Summary (132 char max)
View, edit, delete, protect & back up cookies, incl. partitioned/isolated ones. Allow/block lists + auto-clean. 100% local.

## Description
**Cookie Editor Pro** is the simple, safe, powerful way to view, edit, clean, and manage the cookies in your browser — built for transparency.

⚠️ Independent project. Not affiliated with any YouTube creator, video, or any affiliate-tracker-detection tool. This is a cookie management/editing extension.

**What you can do**
• Inspect — see every cookie a site has set, with full details (value, domain, path, expiry, SameSite, Secure, HttpOnly)
• See ALL cookies — including partitioned / "isolated" cookies that other editors silently skip
• Group by domain — expand/collapse each site's cookies for a clean overview
• Search — instantly filter cookies by name, value, or domain
• Edit / Add / Delete — change, create, or remove cookies in real time
• Protect — lock important cookies so they can't be deleted by accident
• Export / Import — back up and restore cookies as JSON (great for developers & testers)

**Automatic cleaning (Pro)**
• Block list — auto-delete cookies from domains you choose (wildcards `*.ads.com` or regex)
• Allow list — keep cookies you trust; always wins over the block list
• Live block, clear-on-startup, and clear-on-tab-close options

**Privacy first**
• 100% local — your cookie data never leaves your browser
• No analytics, no tracking, no remote servers, no account
• Minimal permissions, used only to read and write the cookies you choose to manage

Perfect for developers, QA testers, and anyone who wants real visibility and control over their cookies.

## Category
Developer Tools (or Productivity)

## Permission justifications (for the review form)
- **cookies**: core function — read, create, edit, and delete the user's cookies.
- **storage**: store the user's "protected cookie" list and allow/block-list settings, locally only.
- **tabs**: read the active tab's URL to show cookies for the current site and to support "clear on tab close."
- **host_permissions <all_urls>**: cookies can belong to any site the user visits; access is required to view/edit them across sites. No page content is read or transmitted.
- **background service worker**: enforces the user's allow/block lists and auto-clean settings locally. Makes no network requests.

## Single-purpose statement
This extension has one purpose: to let users view and manage their browser cookies.
