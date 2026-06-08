module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const now = new Date();
  const t = (h, m = 0) => { const d = new Date(now); d.setHours(h, m, 0, 0); return d.toISOString(); };

  const mock = {
    mock: true,
    events: [
      { id: '1', title: 'Agency Weekly Standup',           start: t(9,0),   end: t(9,30),   location: 'Google Meet', attendees: 4 },
      { id: '2', title: 'Signs & Symbols — Brand Review',  start: t(11,0),  end: t(12,0),   location: 'Studio',      attendees: 2 },
      { id: '3', title: 'Lunch with Pascal',               start: t(13,0),  end: t(14,0),   location: 'Shoreditch',  attendees: 2 },
      { id: '4', title: 'Mythos — Investor Prep Call',     start: t(15,30), end: t(16,30),  location: 'Zoom',        attendees: 3 },
    ],
    upcoming: [
      { id: '5', title: 'Meeting with DHOM Bistro',        start: new Date(now.getTime() + 4*86400000).toISOString() },
      { id: '6', title: 'Signs & Symbols Photoshoot',      start: new Date(now.getTime() + 6*86400000).toISOString() },
    ],
    tasks: [
      { id: '1', content: 'Kiese amends',                     due_date: new Date(now.getTime()-18*86400000).toISOString(), priority: 2 },
      { id: '2', content: 'Kickass Clothing proposal',        due_date: new Date(now.getTime()-15*86400000).toISOString(), priority: 2 },
      { id: '3', content: 'Sort out pension',                 due_date: new Date(now.getTime()-15*86400000).toISOString(), priority: 3 },
      { id: '4', content: 'Call Joey',                        due_date: new Date(now.getTime()-3*86400000).toISOString(),  priority: 1 },
      { id: '5', content: 'Message Pascal — AL Tech round',   due_date: new Date(now.getTime()-3*86400000).toISOString(),  priority: 1 },
      { id: '6', content: 'Check message from Lee P',         due_date: new Date(now.getTime()-3*86400000).toISOString(),  priority: 1 },
      { id: '7', content: "Tom's book — review chapter draft",due_date: now.toISOString(), priority: 2 },
      { id: '8', content: 'Follow up with Mythos supplier',   due_date: now.toISOString(), priority: 1 },
    ],
    threads: [
      { id: 't1', messages: [{ id:'m1', date: new Date(now.getTime()-2*3600000).toISOString(),  sender:'Arif Rampuri',  subject:'Re: Showtime retro — section layout',    snippet:"Gentle reminder mate. The height of the bar, the weight of the font — let's discuss?", labelIds:['UNREAD','INBOX'] }] },
      { id: 't2', messages: [{ id:'m2', date: new Date(now.getTime()-5*3600000).toISOString(),  sender:'Pascal Levy',   subject:'AL Tech — funding round update',          snippet:"Hey Mario, wanted to loop you in on where we're at. Can we get 30 mins this week?",    labelIds:['UNREAD','INBOX'] }] },
      { id: 't3', messages: [{ id:'m3', date: new Date(now.getTime()-24*3600000).toISOString(), sender:'Shopify',       subject:'Signs & Symbols — 3 new orders',          snippet:'You have 3 new orders waiting to be fulfilled.',                                        labelIds:['UNREAD','INBOX'] }] },
      { id: 't4', messages: [{ id:'m4', date: new Date(now.getTime()-26*3600000).toISOString(), sender:'Lee Pearson',   subject:'Quick one',                               snippet:'Mario, drop me a message when you get a sec. Got something to run by you.',            labelIds:['UNREAD','INBOX'] }] },
      { id: 't5', messages: [{ id:'m5', date: new Date(now.getTime()-2*86400000).toISOString(), sender:'HMRC',          subject:'Action required — Self Assessment 2024/25',snippet:'Your Self Assessment tax return is due. Please file by 31 January 2026.',              labelIds:['UNREAD','INBOX'] }] },
    ],
    stats: { meetingCount: 4, totalHours: 3.5, unreadCount: 5, taskCount: 8 },
  };

  return res.json(mock);
};
