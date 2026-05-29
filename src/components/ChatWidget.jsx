import { useState, useEffect, useRef, useCallback } from 'react'
import { BASE_URL } from '../config'
import './ChatWidget.css'

function ChatWidget({ currentUser, wsRef }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('users')
  const [selectedUser, setSelectedUser] = useState(null)
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [unread, setUnread] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [hasMoreUsers, setHasMoreUsers] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [seenByOther, setSeenByOther] = useState(false)
  const bottomRef = useRef(null)
  const usersEndRef = useRef(null)
  const selectedUserRef = useRef(null)

  useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])

  const loadUsers = useCallback(async (page = 1, append = false) => {
    if (loadingUsers) return
    setLoadingUsers(true)
    try {
      const res = await fetch(`${BASE_URL}/api/chat/users?page=${page}&limit=10`)
      const data = await res.json()
      const others = (data.data || []).filter(u => u.id !== currentUser.id)
      if (append) {
        setUsers(prev => [...prev, ...others])
      } else {
        setUsers(others)
      }
      setHasMoreUsers(page < data.totalPages)
      setUsersPage(page)
    } catch {}
    setLoadingUsers(false)
  }, [currentUser.id, loadingUsers])

  useEffect(() => {
    if (open && view === 'users') {
      loadUsers(1, false)
    }
  }, [open, view])

  useEffect(() => {
    if (!usersEndRef.current) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreUsers && !loadingUsers) {
        loadUsers(usersPage + 1, true)
      }
    }, { threshold: 0.1 })
    observer.observe(usersEndRef.current)
    return () => observer.disconnect()
  }, [hasMoreUsers, loadingUsers, usersPage])

  useEffect(() => {
    if (!selectedUser) return
    fetch(`${BASE_URL}/api/chat?with=${selectedUser.id}&me=${currentUser.id}`)
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(() => {})
  }, [selectedUser])

  useEffect(() => {
    if (!wsRef?.current) return
    const ws = wsRef.current
    const handler = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'CHAT_MESSAGE') {
        const msg = data.message
        const current = selectedUserRef.current
        if (msg.senderId === current?.id && msg.receiverId === currentUser.id) {
          setMessages(prev => [...prev, msg])
        }
        if (!open || msg.senderId !== current?.id) {
          setUnread(prev => prev + 1)
        }
      }
      if (data.type === 'CHAT_SEEN') {
        if (data.senderId === selectedUserRef.current?.id && data.receiverId === currentUser.id) {
          setSeenByOther(true)
        }
      }
    }
    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [wsRef?.current, open])

  useEffect(() => {
    if (open && view === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open, view])

  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  useEffect(() => {
    if (!selectedUser || view !== 'chat') return
    if (!wsRef?.current || wsRef.current.readyState !== 1) return
    wsRef.current.send(JSON.stringify({
      type: 'CHAT_SEEN',
      senderId: currentUser.id,
      receiverId: selectedUser.id
    }))
  }, [selectedUser, view])

  function sendMessage() {
    if (!text.trim() || !selectedUser) return
    if (!wsRef?.current || wsRef.current.readyState !== 1) return
    const optimisticMessage = {
      _id: Date.now(),
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`,
      text: text.trim(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, optimisticMessage])
    wsRef.current.send(JSON.stringify({
      type: 'CHAT_MESSAGE',
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`,
      text: text.trim()
    }))
    setText('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function getInitials(user) {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
  }

  function openChat(user) {
    setSelectedUser(user)
    setSeenByOther(false)
    setView('chat')
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-left">
              {view === 'chat' && (
                <button className="chat-back-btn" onClick={() => setView('users')}>←</button>
              )}
              <div className="chat-header-dot" />
              <span className="chat-header-title">
                {view === 'users' ? 'FitNova Chat' : selectedUser?.firstName}
              </span>
            </div>
            <button className="chat-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          {view === 'users' && (
            <div className="chat-users-list">
              {users.length === 0 && !loadingUsers && (
                <div className="chat-empty">No other users found</div>
              )}
              {users.map(user => (
                <div key={user.id} className="chat-user-row" onClick={() => openChat(user)}>
                  <div className="chat-user-avatar">{getInitials(user)}</div>
                  <div className="chat-user-info">
                    <div className="chat-user-name">{user.firstName} {user.lastName}</div>
                    <div className="chat-user-email">{user.email}</div>
                  </div>
                  <div className="chat-user-arrow">›</div>
                </div>
              ))}
              <div ref={usersEndRef} style={{ height: 1 }} />
              {loadingUsers && <div className="chat-loading">Loading...</div>}
            </div>
          )}

          {view === 'chat' && (
            <>
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-empty">No messages yet. Say hello! 👋</div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === currentUser.id
                  const isLastFromMe = isMe && messages.slice(i + 1).every(m => m.senderId !== currentUser.id) && i === messages.map((m, idx) => m.senderId === currentUser.id ? idx : -1).filter(x => x !== -1).pop()
                  return (
                    <div key={msg._id || i} className={`chat-msg ${isMe ? 'chat-msg-me' : 'chat-msg-other'}`}>
                      {!isMe && (
                        <div className="chat-msg-avatar">{msg.senderName?.[0]}</div>
                      )}
                      <div className="chat-msg-content">
                        <div className="chat-msg-bubble">{msg.text}</div>
                        <div className="chat-msg-time">
                          {formatTime(msg.timestamp)}
                          {isMe && isLastFromMe && seenByOther && (
                            <span className="chat-seen">· Seen</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div className="chat-input-wrap">
                <input
                  className="chat-input"
                  placeholder={`Message ${selectedUser?.firstName}...`}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <button className="chat-send-btn" onClick={sendMessage}>➤</button>
              </div>
            </>
          )}
        </div>
      )}

      <button className="chat-fab" onClick={() => { setOpen(!open); setUnread(0) }}>
        💬
        {unread > 0 && <span className="chat-unread">{unread}</span>}
        <span className="chat-tooltip">Chat with other users</span>
      </button>
    </div>
  )
}

export default ChatWidget