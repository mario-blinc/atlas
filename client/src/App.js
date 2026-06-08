import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainView from './components/MainView';

const DUMMY = (() => {
  const now = new Date();
  const t = (h, m=0) => { const d=new Date(now); d.setHours(h,m,0,0); return d.toISOString(); };
  return {
    mock: true,
    events: [
      { id:'1', title:'Agency Weekly Standup',          start:t(9,0),   end:t(9,30),   location:'Google Meet' },
      { id:'2', title:'Signs & Symbols — Brand Review', start:t(11,0),  end:t(12,0),   location:'Studio'      },
      { id:'3', title:'Lunch with Pascal',              start:t(13,0),  end:t(14,0),   location:'Shoreditch'  },
      { id:'4', title:'Mythos — Investor Prep Call',    start:t(15,30), end:t(16,30),  location:'Zoom'        },
    ],
    upcoming: [
      { id:'5', title:'Meeting with DHOM Bistro',    start: new Date(now.getTime()+4*86400000).toISOString() },
      { id:'6', title:'Signs & Symbols Photoshoot',  start: new Date(now.getTime()+6*86400000).toISOString() },
    ],
    tasks: [
      { id:'1', content:'Kiese amends',                    due_date:new Date(now.getTime()-18*86400000).toISOString() },
      { id:'2', content:'Kickass Clothing proposal',       due_date:new Date(now.getTime()-15*86400000).toISOString() },
      { id:'3', content:'Sort out pension',                due_date:new Date(now.getTime()-15*86400000).toISOString() },
      { id:'4', content:'Call Joey',                       due_date:new Date(now.getTime()-3*86400000).toISOString()  },
      { id:'5', content:'Message Pascal — AL Tech round',  due_date:new Date(now.getTime()-3*86400000).toISOString()  },
      { id:'6', content:'Check message from Lee P',        due_date:new Date(now.getTime()-3*86400000).toISOString()  },
      { id:'7', content:"Tom's book — review chapter",     due_date:now.toISOString() },
      { id:'8', content:'Follow up with Mythos supplier',  due_date:now.toISOString() },
    ],
    threads: [
      { id:'t1', messages:[{ sender:'Arif Rampuri',  subject:'Re: Showtime retro',               date:new Date(now.getTime()-2*3600000).toISOString() }] },
      { id:'t2', messages:[{ sender:'Pascal Levy',   subject:'AL Tech — funding round update',    date:new Date(now.getTime()-5*3600000).toISOString() }] },
      { id:'t3', messages:[{ sender:'Shopify',       subject:'Signs & Symbols — 3 new orders',   date:new Date(now.getTime()-24*3600000).toISOString() }] },
      { id:'t4', messages:[{ sender:'Lee Pearson',   subject:'Quick one',                        date:new Date(now.getTime()-26*3600000).toISOString() }] },
      { id:'t5', messages:[{ sender:'HMRC',          subject:'Action required — Self Assessment', date:new Date(now.getTime()-48*3600000).toISOString() }] },
    ],
    stats: { meetingCount:4, totalHours:3.5, unreadCount:5, taskCount:8 },
  };
})();

export default function App() {
  const [data, setData] = useState(DUMMY);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { if (d && (d.events || d.tasks)) setData(d); })
      .catch(() => {});
    const t = setInterval(() => {
      fetch('/api/dashboard').then(r=>r.json()).then(d=>{if(d&&(d.events||d.tasks))setData(d);}).catch(()=>{});
    }, 5*60*1000);
    return () => clearInterval(t);
  }, []);

  return <MainView data={data} />;
}
