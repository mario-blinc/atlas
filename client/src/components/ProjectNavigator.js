import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

export default function ProjectNavigator({ onSelectProject, activeProjectId }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
      style={{
        width: 260,
        minWidth: 260,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--border-blue)',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border-blue)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--accent-blue)', marginBottom: 2 }}>
            PROJECTS
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
            {projects.length} active
          </div>
        </div>
        <button
          onClick={() => fetchProjects(true)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-blue)',
            color: 'var(--text-secondary)',
            borderRadius: 4,
            padding: '4px 8px',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            cursor: 'pointer',
            letterSpacing: '0.1em',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.target.style.borderColor = 'var(--accent-blue)'}
          onMouseLeave={e => e.target.style.borderColor = 'var(--border-blue)'}
        >
          {refreshing ? '...' : 'SYNC'}
        </button>
      </div>

      {/* Project list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            {[0,1,2].map(i => (
              <motion.div key={i}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                style={{ height: 70, margin: '8px 16px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border-blue)' }}
              />
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ padding: '6px 14px' }}
              >
                <div
                  style={{
                    background: activeProjectId === project.id ? 'rgba(0,180,255,0.1)' : 'var(--bg-card)',
                    border: `1px solid ${activeProjectId === project.id ? 'var(--border-blue-strong)' : 'var(--border-blue)'}`,
                    borderRadius: 8,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    if (activeProjectId !== project.id) {
                      e.currentTarget.style.background = 'rgba(0,180,255,0.06)';
                      e.currentTarget.style.borderColor = 'var(--border-blue-strong)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeProjectId !== project.id) {
                      e.currentTarget.style.background = 'var(--bg-card)';
                      e.currentTarget.style.borderColor = 'var(--border-blue)';
                    }
                  }}
                >
                  {activeProjectId === project.id && (
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
                      background: 'var(--accent-blue)',
                      boxShadow: '0 0 8px var(--accent-blue)',
                    }} />
                  )}

                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {project.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.4 }}>
                    {project.description}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                      {timeAgo(project.last_active)}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 9 }}>·</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>
                      {project.conversation_count} chats
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {['CONTINUE', 'NEW CHAT'].map(action => (
                      <button
                        key={action}
                        onClick={() => onSelectProject(project, action === 'NEW CHAT')}
                        style={{
                          flex: 1,
                          background: action === 'CONTINUE' ? 'rgba(0,180,255,0.12)' : 'transparent',
                          border: `1px solid ${action === 'CONTINUE' ? 'var(--border-blue-strong)' : 'var(--border-blue)'}`,
                          color: action === 'CONTINUE' ? 'var(--accent-blue)' : 'var(--text-dim)',
                          borderRadius: 4,
                          padding: '5px 4px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 8,
                          letterSpacing: '0.08em',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.target.style.background = 'rgba(0,180,255,0.2)';
                          e.target.style.color = 'var(--accent-cyan)';
                        }}
                        onMouseLeave={e => {
                          e.target.style.background = action === 'CONTINUE' ? 'rgba(0,180,255,0.12)' : 'transparent';
                          e.target.style.color = action === 'CONTINUE' ? 'var(--accent-blue)' : 'var(--text-dim)';
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
