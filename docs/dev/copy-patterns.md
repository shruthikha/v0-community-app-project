# WP7: Copy Patterns Library
## Reusable Templates for Ecovilla UI

**Version**: 1.0  
**Created**: November 2024  
**Purpose**: Quick-reference templates for common UI copy needs

---

## How to Use This Library

1. **Find your pattern** (button, error, empty state, etc.)
2. **Choose the template** that matches context
3. **Fill in the blanks** with specific content
4. **Review against** WP7_Tone_of_Voice_Guide.md
5. **Test with users** if you're unsure

---

## Button Text Patterns

### **Primary Actions**

**Formula:** `[Action Verb] + [Specific Object/Benefit]`

```
Create [Item]
- Create Event
- Create Check-in
- Create Listing

Join [Activity]
- Join Event  
- Join Community
- Join Conversation

Start [Process]
- Start Building Your Profile
- Start Exploring

Connect with [People]
- Connect with Neighbors
- Connect with [Name]

Share [Item]
- Share Event
- Share Location
- Share with Community

View [Content]
- View Calendar
- View Profile
- View Details
```

---

### **Secondary Actions**

**Formula:** `[Gentle Verb] + [Optional Context]`

```
Learn More
Maybe Later
Skip for Now
Go Back
Cancel
Close
Remind Me Later
Not Now
Browse Instead
```

---

### **Destructive Actions**

**Formula:** `[Explicit Action] + [Item]`

**Always require confirmation!**

```
Yes, Delete
Yes, Remove  
Delete Event
Remove Member
Leave Community
Cancel Request
```

**Paired with:**
```
Cancel
Keep It
Go Back
Never Mind
```

---

### **Next-Step Actions**

**Formula:** `[Action] + [Context/Benefit]`

```
View Event
Explore Community
Meet Your Neighbors
Check the Map
See What's New
Browse Events
Find Residents
```

---

## Heading Patterns

### **Page Titles**

**Pattern:** Clear, direct nouns (1-3 words)

```
Dashboard
Events
Map
Profile
Announcements
Residents
Exchange
Requests
```

**With Context:**
```
Your Profile
Your Events
Community Map
Pending Requests
```

---

### **Section Headings**

**Pattern:** Descriptive + Specific (2-4 words)

```
Upcoming Events
Recent Announcements
Active Residents
Your Listings
Pending Requests
This Week's Gatherings
New in the Community
```

---

### **Empty State Headings**

**Pattern:** Simple statement of absence

```
No [items] yet
No [items] found  
All caught up
Nothing here yet
[Item] coming soon
```

**Examples:**
```
No events yet
No neighbors yet
No results found
All caught up
Nothing new here
Calendar empty
```

---

## Success Message Patterns

### **Small Wins (Confirmational)**

**Formula:** `[Action] + [past tense]`

```
Saved
Updated
Done
Created
Removed
Added
Sent
```

**With Brief Context:**
```
Profile saved
Event updated
Request submitted
Changes saved
Photo uploaded
```

---

### **Medium Wins (Confirmational + Detail)**

**Formula:** `[Action] + [detail/impact]`

```
Event created. Neighbors will see it on the calendar
Profile updated. Looking good!
Request submitted. We'll notify you when it's reviewed
Photo added. Visible on your profile now
Settings saved. Changes are live
```

---

### **Big Wins (Celebratory + Next Step)**

**Formula:** `[Celebration!] + [What happened] + [Next step?]`

```
Event created! 🎉 Your neighbors will see it on the calendar

Profile complete! ✨ Ready to explore your community?

First check-in! Nice! Your neighbors know where to find you

Request resolved! The issue is marked as complete

Welcome aboard! Let's get you connected with your neighbors
```

---

## Error Message Patterns

### **Network Errors**

**Formula:** `Couldn't [action]. [Context] + [Solution]?`

```
Couldn't save your changes. Check your connection and try again?

Can't load events right now. Are you online?

Couldn't send your message. Check your connection?

Unable to upload photo. Try again when you're back online?
```

---

### **Validation Errors**

**Formula:** `[Issue] + [Solution/Alternative]`

```
That email is already in use. Want to log in instead?

Please enter a valid email address

Event needs a title and date to continue

Phone number should be 10 digits

Password must be at least 8 characters
```

---

### **Permission Errors**

**Formula:** `[What's restricted] + [Why/Who can help]`

```
You don't have permission to do that. Contact your admin?

This content isn't available to you

Only event organizers can edit this

You'll need admin approval for that
```

---

### **Not Found Errors**

**Formula:** `[What's missing] + [Helpful suggestion]`

```
Event not found. It may have been deleted

Resident doesn't exist. Check the spelling?

Page not found. Want to go back home?

That link isn't working. Try from the dashboard?
```

---

### **Generic Errors**

**Formula:** `[What happened] + [Try again? / Contact support]`

```
Hmm, that didn't work. Try again?

Something went wrong. Please try again

Couldn't complete that action right now

We're having trouble loading this. Refresh the page?
```

---

## Empty State Patterns

### **Structure**

```
[Río Illustration]

[Heading - Statement of absence]

[Context/Encouragement - 1-2 sentences]

[Primary CTA] [Optional: Secondary CTA]
```

---

### **First-Time User Empty States**

**Formula:** `[Welcome context] + [Encouragement] + [Río personality]`

```
[Río waving]

Welcome to your calendar!

This is where you'll see community events.
Let's create your first one!

[Create Event]
```

```
[Río looking hopeful]

No neighbors yet

You're one of the first! Río can't wait 
to meet the rest of the community.

[Invite Residents]
```

```
[Río with map]

Your map is ready

Add locations so neighbors know where 
to find community spaces!

[Add First Location]
```

---

### **Returning User Empty States**

**Formula:** `[State current situation] + [Gentle nudge or celebration]`

```
[Río relaxing]

All caught up! ✨

You've seen everything new. 
Río is taking a siesta too. ☀️

[Browse Residents] [Check Map]
```

```
[Río looking at calendar]

No events this week

Want to bring neighbors together?
Río thinks it's a great idea!

[Create Event] [Browse Past Events]
```

---

### **Search/Filter Empty States**

**Formula:** `[No results] + [Suggestion to adjust]`

```
[Río with magnifying glass]

No results found

Try adjusting your search?
Río is still looking!

[Clear Filters] [See All]
```

```
[Río thinking]

No residents match that

Try a broader search?
Or browse everyone!

[Clear Search] [Browse All]
```

---

### **Completed/All Done Empty States**

**Formula:** `[Celebrate completion] + [Optional next action]`

```
[Río sleeping peacefully]

All caught up! ☀️

You've handled everything. 
Time for a break!

[View Map] [Browse Residents]
```

```
[Río giving thumbs up]

Nice! Everything's resolved

All your requests are complete.
Want to check on the community?

[View Dashboard]
```

---

## Loading State Patterns

### **Quick Loads (< 2 seconds)**

```
Loading...
[Spinner only]
```

---

### **Medium Loads (2-5 seconds)**

**Formula:** `Loading [specific content]...`

```
Loading your events...
Getting things ready...
Loading the map...
Checking with the community...
Finding residents...
```

---

### **Long Loads (> 5 seconds)**

**Formula:** `[Río animation] + [Reassuring text]`

```
[Río gathering items]
Río is gathering information...

[Río looking around]
This might take a moment...

[Río working]
Almost there...
```

---

## Confirmation Dialog Patterns

### **Destructive Actions**

**Formula:** `[Action]? [Consequence]`

```
Delete this event?
This can't be undone.
[Yes, Delete] [Cancel]

Remove Sofia from your family?
You can add her back later.
[Yes, Remove] [Keep Her]

Leave this gathering?
Neighbors are counting on you.
[Leave Event] [Stay]

Delete your account?
All your data will be permanently removed.
[Yes, Delete Everything] [Cancel]
```

---

### **Non-Destructive Confirmations**

**Formula:** `[Action]? [Context]`

```
Leave without saving changes?
You'll lose your edits.
[Yes, Leave] [Keep Editing]

Cancel this request?
You can create a new one anytime.
[Yes, Cancel] [Keep It]

Skip profile setup?
You can complete it later from settings.
[Skip for Now] [Continue Setup]
```

---

## Helper Text & Microcopy Patterns

### **Form Field Helpers**

**Pattern:** Clarify purpose or set expectations

```
Input: Email
Helper: Your email for login and notifications

Input: Bio  
Helper: Tell neighbors about yourself (visible to community)

Input: Phone
Helper: Optional. Only visible if you share it

Input: Event Title
Helper: Make it descriptive so neighbors know what to expect

Input: Location
Helper: Where should neighbors meet?
```

---

### **Tooltips**

**Pattern:** Brief explanation (5-10 words)

```
[i icon] "Visible to all community members"
[i icon] "This will notify all residents"
[i icon] "Affects how neighbors see your profile"
[i icon] "Can't be changed later"
[i icon] "Required for event creation"
```

---

### **Placeholders**

**Pattern:** Example of expected input

```
Email: your@email.com
Name: Sofia Martinez
Bio: I love gardening and community dinners
Event title: Morning yoga in the garden
Location: Community center
Date: Tomorrow at 10am
```

---

### **Character Counters**

**Pattern:** Positive framing

```
23 characters remaining
You have 140 characters left
300 character limit (23 remaining)
```

**When limit reached:**
```
Character limit reached
Maximum length reached (edit to shorten)
```

---

## Toast Notification Patterns

### **Success Toasts**

```
✅ [Action completed]
- Saved
- Done
- Created
- Updated

✅ [Action] + [brief detail]
- Event created
- Profile updated
- Request submitted
- Photo uploaded

🎉 [Celebration] + [detail]
- Event created! 🎉
- Welcome to the community! ✨
- First check-in! 🌱
```

---

### **Error Toasts**

```
⚠️ [Brief problem] + [Try again?]
- Couldn't save. Try again?
- Upload failed. Retry?
- Something went wrong

⚠️ [Problem] + [Specific solution]
- No connection. Check your network
- That didn't work. Contact support?
```

---

### **Info Toasts**

```
ℹ️ [Status update]
- Changes saved automatically
- Searching...
- Processing request
- Notification sent
```

---

## Badge & Label Patterns

### **Status Badges**

```
States:
- New
- Active  
- Pending
- Complete
- Overdue
- Draft
- Published
- Archived

Event statuses:
- Upcoming
- Today
- Happening Now
- Past
- Cancelled
```

---

### **Counts & Numbers**

**Pattern:** Keep it short, use numerals

```
3 new
12 attending
5 pending
42 active
0 available (or "None available")
```

---

### **Time References**

```
Relative:
- Just now
- 2 minutes ago
- 1 hour ago
- Yesterday
- 3 days ago
- Last week

Absolute:
- Today at 2pm
- Tomorrow at 10am
- Nov 21
- Dec 1, 2024
```

---

## Navigation & Menu Patterns

### **Primary Navigation Items**

**Pattern:** Simple, clear nouns

```
Dashboard
Events
Map
Residents
Exchange
Requests
Check-ins
Announcements
Profile
```

---

### **Menu Sections**

**Pattern:** Category labels (uppercase, muted)

```
MY
COMMUNITY
PROFILE
```

---

### **Hamburger Menu Items**

**Pattern:** Action or destination + optional badge

```
📢 Announcements [3]
👥 Browse Residents
⚠️ My Requests [1]
📍 Check-ins
👤 My Profile
🚪 Logout
```

---

## Onboarding Patterns

### **Welcome Messages**

**Formula:** `[Warm greeting] + [What to expect] + [Encouragement]`

```
Welcome to Ecovilla San Mateo! ☀️

Río is here to help you get settled. We'll start 
with the basics—your profile, finding neighbors, 
and exploring the map.

Ready to begin?

[Let's Go!] [Skip Tour]
```

---

### **Step Instructions**

**Formula:** `[Step number] + [What to do] + [Why it matters]`

```
Step 1: Create your profile

Help neighbors get to know you! Add your name,
bio, and a photo so the community can connect.

[Continue]
```

---

### **Progress Indicators**

**Pattern:** Current step + total

```
Step 2 of 4
Profile setup (2/4)
2 of 4 complete
Almost done! (3/4)
```

---

## Search & Filter Patterns

### **Search Placeholders**

**Pattern:** Search + where/what

```
Search events...
Search residents...
Search the map...
Find anything...
```

---

### **Filter Labels**

**Pattern:** Filter by + criteria

```
All Events
Upcoming Only
Past Events
This Week
This Month

All Residents
New Members
Active Today
Nearby
```

---

### **Search Results**

**Pattern:** Found + count + context

```
Found 12 residents
3 events this week
No results found
Showing 5 of 23 events
```

---

## Settings & Preferences Patterns

### **Toggle Labels**

**Pattern:** Action + clarification

```
Email notifications
Get updates about community activity

Push notifications  
Alerts on your phone

Show profile to community
Let neighbors see your information

Dark mode
Easier on the eyes at night
```

---

### **Dropdown Options**

**Pattern:** Clear, parallel structure

```
Notification Frequency:
- Immediately
- Daily digest
- Weekly summary
- Never

Privacy Level:
- Public (everyone)
- Community (residents only)
- Private (just me)
```

---

## Context-Specific Patterns

### **First-Time Actions**

Add extra encouragement and explanation:

```
Regular: "Event created"
First-time: "Your first event! 🎉 Neighbors will see it on the calendar"

Regular: "Profile saved"  
First-time: "Profile complete! ✨ Ready to meet your neighbors?"

Regular: "Check-in added"
First-time: "First check-in! Nice! Your neighbors know where to find you"
```

---

### **Repeated Actions**

Be more concise:

```
"Event created"
"Updated"
"Done"
"Saved"
```

---

### **Urgent/Time-Sensitive**

Be more direct, less playful:

```
"Event starts in 15 minutes"
"Request needs attention"
"Your turn to respond"
"Deadline tomorrow"
```

---

### **Errors on Critical Actions**

Professional, solution-focused:

```
"Couldn't process payment. Contact support: [email]"
"Unable to delete account. Please try again or contact us"
"Can't remove admin. You need at least one"
```

---

## Persona-Specific Adaptations

### **Sofia (Newcomer)**

More explanatory, encouraging:

```
Standard: "Event created"
Sofia: "Event created! 🎉 Neighbors will see it on the calendar. Nice job!"

Standard: "No events yet"
Sofia: "No events yet. Creating your first one is easy—let's do it together!"
```

---

### **Marcus (Coordinator)**

Direct, status-focused:

```
Standard: "3 people are attending your event"
Marcus: "3 attending • 12 pending • 2 declined"

Standard: "You have new requests"  
Marcus: "3 pending requests (2 urgent)"
```

---

### **Elena (Balanced)**

Gentle, optional:

```
Standard: "Join the event?"
Elena: "Join if you're interested. No pressure!"

Standard: "Update your profile"
Elena: "Update your profile when you're ready"
```

---

### **Carmen (Resource Coordinator)**

Organized, manageable:

```
Standard: "5 items in exchange"
Carmen: "5 available • 2 borrowed • 2 overdue"

Standard: "View locations"
Carmen: "12 locations (3 need review)"
```

---

## Copy Checklist (Quick Version)

Before finalizing, check:

- [ ] Verb + object for buttons?
- [ ] User-focused (you/your)?
- [ ] Context-appropriate tone?
- [ ] Solution for errors?
- [ ] Encouragement for empty states?
- [ ] Celebration for wins?
- [ ] Clear next step?
- [ ] No jargon?
- [ ] Grammar correct?
- [ ] Matches pattern library?

---

## Using These Patterns

### **For New Copy:**
1. Find closest pattern
2. Fill in blanks
3. Adapt for context
4. Review against checklist
5. Test with users

### **For Cursor Prompts:**
```
Use the [pattern name] from WP7_Copy_Patterns.md:
- Context: [describe situation]
- Persona: [if applicable]
- Item: [specific content]
```

Example:
```
Use the "Big Win Success Message" pattern:
- Context: User created their first event
- Persona: Sofia (newcomer)
- Item: "Community Potluck Dinner"
```

---

## Pattern Evolution

**Add new patterns when:**
- You write copy that doesn't fit existing patterns
- A screen needs a unique approach
- User feedback suggests improvement

**Update patterns when:**
- Better versions emerge from testing
- User preferences shift
- Platform evolves

**Process:**
1. Try existing pattern
2. Adapt as needed
3. Document if it works well
4. Add to library
5. Notify team

---

**Next:** See WP7_Component_Copy_Specs.md for complete copy examples in context.