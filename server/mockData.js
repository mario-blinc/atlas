export function getMockDashboardData() {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const t = (h, m = 0) => {
    const d = new Date(today);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  return {
    events: [
      { id: '1', title: 'Agency Weekly Standup', start: t(9, 0), end: t(9, 30), location: 'Google Meet', attendees: 4 },
      { id: '2', title: 'Signs & Symbols — Brand Review', start: t(11, 0), end: t(12, 0), location: 'Studio', attendees: 2 },
      { id: '3', title: 'Lunch with Pascal', start: t(13, 0), end: t(14, 0), location: 'Shoreditch', attendees: 2 },
      { id: '4', title: 'Mythos — Investor Prep Call', start: t(15, 30), end: t(16, 30), location: 'Zoom', attendees: 3 },
    ],
    upcoming: [
      { id: '5', title: 'Meeting with DHOM Bistro', start: new Date(today.getTime() + 4 * 86400000).toISOString() },
      { id: '6', title: 'Signs & Symbols Photoshoot', start: new Date(today.getTime() + 6 * 86400000).toISOString() },
    ],
    tasks: [
      { id: '1', content: 'Kiese amends', due_date: new Date(today.getTime() - 18 * 86400000).toISOString(), priority: 2 },
      { id: '2', content: 'Kickass Clothing proposal', due_date: new Date(today.getTime() - 15 * 86400000).toISOString(), priority: 2 },
      { id: '3', content: 'Sort out pension', due_date: new Date(today.getTime() - 15 * 86400000).toISOString(), priority: 3 },
      { id: '4', content: 'Call Joey', due_date: new Date(today.getTime() - 3 * 86400000).toISOString(), priority: 1 },
      { id: '5', content: 'Message Pascal about AL Tech round', due_date: new Date(today.getTime() - 3 * 86400000).toISOString(), priority: 1 },
      { id: '6', content: 'Check message from Lee P', due_date: new Date(today.getTime() - 3 * 86400000).toISOString(), priority: 1 },
      { id: '7', content: 'Tom\'s book — review chapter draft', due_date: today.toISOString(), priority: 2 },
      { id: '8', content: 'Follow up with Mythos supplier', due_date: today.toISOString(), priority: 1 },
    ],
    threads: [
      {
        id: 't1',
        messages: [{
          id: 'm1', date: new Date(today.getTime() - 2 * 3600000).toISOString(),
          sender: 'Arif Rampuri <arif.rampuri@icloud.com>',
          subject: 'Re: Showtime retro — section layout',
          snippet: 'Gentle reminder mate. I think maybe the height of the bar, the weight of the font, maybe not all capitals — let\'s discuss?',
          labelIds: ['UNREAD', 'INBOX'],
        }]
      },
      {
        id: 't2',
        messages: [{
          id: 'm2', date: new Date(today.getTime() - 5 * 3600000).toISOString(),
          sender: 'Pascal Levy <pascal@altech.io>',
          subject: 'AL Tech — funding round update',
          snippet: 'Hey Mario, wanted to loop you in on where we\'re at with the round. Can we get 30 mins this week?',
          labelIds: ['UNREAD', 'INBOX'],
        }]
      },
      {
        id: 't3',
        messages: [{
          id: 'm3', date: new Date(today.getTime() - 24 * 3600000).toISOString(),
          sender: 'Shopify <noreply@shopify.com>',
          subject: 'Signs & Symbols — 3 new orders',
          snippet: 'You have 3 new orders waiting to be fulfilled.',
          labelIds: ['UNREAD', 'INBOX'],
        }]
      },
      {
        id: 't4',
        messages: [{
          id: 'm4', date: new Date(today.getTime() - 26 * 3600000).toISOString(),
          sender: 'Lee Pearson <lee@lpcreative.co.uk>',
          subject: 'Quick one',
          snippet: 'Mario, drop me a message when you get a sec. Got something to run by you.',
          labelIds: ['UNREAD', 'INBOX'],
        }]
      },
      {
        id: 't5',
        messages: [{
          id: 'm5', date: new Date(today.getTime() - 2 * 86400000).toISOString(),
          sender: 'HMRC <noreply@hmrc.gov.uk>',
          subject: 'Action required — Self Assessment 2024/25',
          snippet: 'Your Self Assessment tax return for 2024/25 is due. Please file by 31 January 2026.',
          labelIds: ['UNREAD', 'INBOX'],
        }]
      },
    ],
    stats: {
      meetingCount: 4,
      totalHours: 3.5,
      unreadCount: 5,
      taskCount: 8,
    },
  };
}
