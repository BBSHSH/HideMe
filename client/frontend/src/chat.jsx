import React, { useState, useEffect, useRef } from 'react';
import './css/Chat.css';
import Header from './components/Header';

// Wails環境かどうかを判定
const isWailsEnv = typeof window !== 'undefined' && window.go && window.go.app && window.go.app.ChatApp;

// Wails Go関数
let SetUserName, ConnectWebSocket, SendMessage, GetUsers, GetMessages, Disconnect, MarkAsRead, GetUserID;
if (isWailsEnv) {
  SetUserName = window.go.app.ChatApp.SetUserName;
  ConnectWebSocket = window.go.app.ChatApp.ConnectWebSocket;
  SendMessage = window.go.app.ChatApp.SendMessage;
  GetUsers = window.go.app.ChatApp.GetUsers;
  GetMessages = window.go.app. ChatApp.GetMessages;
  Disconnect = window.go.app.ChatApp.Disconnect;
  MarkAsRead = window. go.app.ChatApp. MarkAsRead;
  GetUserID = window.go.app. ChatApp.GetUserID;
}

// エラーメッセージを取得するヘルパー関数
const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?. message) return error.message;
  if (error?.toString) return error.toString();
  return '不明なエラー';
};

export default function Chat({ user, onLogout }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [allContacts, setAllContacts] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const selectedContactIdRef = useRef(null); // Track selected contact ID

  useEffect(() => {
    if (isWailsEnv) {
      // ログイン済みユーザー情報から自動的にチャットを初期化
      if (user && user.displayName && user.id) {
        initializeChat(user.displayName, user.id);
      } else {
        // ログインしていない場合はエラーメッセージを表示
        setErrorMessage('チャットを使用するにはログインが必要です');
        setIsInitializing(false);
      }

      window.runtime.EventsOn('new_message', handleNewMessage);
      window.runtime.EventsOn('message_sent', handleMessageSent);
      window.runtime.EventsOn('message_read', handleMessageRead);
      window.runtime.EventsOn('user_status', handleUserStatus);
      window.runtime.EventsOn('connection_lost', handleConnectionLost);

      return () => {
        if (isConnected) {
          Disconnect();
        }
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        window.runtime.EventsOff('new_message');
        window.runtime.EventsOff('message_sent');
        window.runtime.EventsOff('message_read');
        window.runtime.EventsOff('user_status');
        window.runtime.EventsOff('connection_lost');
      };
    } else {
      setIsInitializing(false);
    }
    // Empty deps array is intentional: we only want to initialize once on mount
    // The user prop is stable from parent component and won't change during session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedContact && isConnected) {
      loadMessages(selectedContact.id);
    }
  }, [selectedContact, isConnected]);

  const initializeChat = async (userName, userId) => {
    try {
      setIsInitializing(true);
      setErrorMessage('');

      console.log('ユーザー情報設定中:', userName, userId);

      // ログイン済みのユーザー情報を使用（userIdは必須）
      await SetUserName(userName, userId);
      console.log('ユーザー情報設定完了');

      const currentUserId = await GetUserID();
      console.log('ユーザーID:', currentUserId);
      setCurrentUser({ id: currentUserId, name: userName });

      console.log('WebSocket接続中...');
      await ConnectWebSocket();
      console.log('WebSocket接続完了');
      setIsConnected(true);

      // ユーザーリストを取得
      await loadUsers();

      // 定期的にユーザーリストを更新
      pollIntervalRef.current = setInterval(loadUsers, 10000);

      setIsInitializing(false);
    } catch (error) {
      console.error('初期化エラー:', error);
      const errMsg = getErrorMessage(error);
      setErrorMessage(errMsg);
      setIsInitializing(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setContacts(allContacts);
    } else {
      const filtered = allContacts.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      );
      setContacts(filtered);
    }
  };

  const loadUsers = async () => {
    try {
      const users = await GetUsers();
      console.log('ユーザー一覧:', users);

      const contactsList = (users || []).map(user => ({
        id: user.id,
        name: user.name,
        avatar: user.name ? user.name.charAt(0).toUpperCase() : '?',
        lastMessage: '',
        time: formatTime(user.lastSeen),
        unread: 0,
        status: user.status
      }));

      setAllContacts(contactsList);
      setContacts(contactsList);

      // 現在選択中の連絡先を保持し、初回のみ最初の連絡先を自動選択
      if (contactsList.length > 0) {
        if (selectedContactIdRef.current) {
          // 選択中の連絡先IDが新しいリストにも存在するか確認し、更新されたデータで置き換え
          const updatedSelected = contactsList.find(c => c.id === selectedContactIdRef.current);
          if (updatedSelected) {
            setSelectedContact(updatedSelected);
          } else {
            // 選択中の連絡先が見つからない場合（削除された等）、最初の連絡先を選択
            setSelectedContact(contactsList[0]);
            selectedContactIdRef.current = contactsList[0].id;
          }
        } else {
          // 初回のみ最初の連絡先を自動選択
          setSelectedContact(contactsList[0]);
          selectedContactIdRef.current = contactsList[0].id;
        }
      }
    } catch (error) {
      console.error('ユーザー読み込みエラー:', error);
    }
  };

  const loadMessages = async (otherUserId) => {
    try {
      const msgs = await GetMessages(otherUserId);
      console.log('メッセージ一覧:', msgs);

      const formattedMessages = (msgs || []).map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.fromId === currentUser?. id ? 'me' : 'them',
        time: formatTime(msg.timestamp),
        read: msg.read,
        senderName: msg.fromId === currentUser?.id ? currentUser. name : selectedContact?.name
      }));

      setMessages(formattedMessages);

      const unreadMessages = (msgs || []).filter(m => !m.read && m.toId === currentUser?.id);
      for (const msg of unreadMessages) {
        await markAsRead(msg.id, msg.fromId);
      }

      setContacts(prev => prev.map(c =>
        c.id === otherUserId ? { ...c, unread: 0 } : c
      ));
      setAllContacts(prev => prev.map(c =>
        c.id === otherUserId ? { ...c, unread: 0 } : c
      ));
    } catch (error) {
      console.error('メッセージ読み込みエラー:', error);
    }
  };

  const handleNewMessage = (msg) => {
    console.log('新規メッセージ受信:', msg);
    if (selectedContact && msg.fromId === selectedContact.id) {
      const newMsg = {
        id: msg. id,
        text: msg. content,
        sender: 'them',
        time: formatTime(msg.timestamp),
        read: msg.read,
        senderName: selectedContact.name
      };

      setMessages(prev => [...prev, newMsg]);
      markAsRead(msg.id, msg.fromId);
    } else {
      const updateUnread = (contactList) => contactList.map(c =>
        c.id === msg.fromId
          ? { ...c, unread: c.unread + 1, lastMessage: msg.content, time: '今' }
          : c
      );
      setContacts(updateUnread);
      setAllContacts(updateUnread);
    }
  };

  const handleMessageSent = (msg) => {
    console.log('メッセージ送信確認:', msg);
    const newMsg = {
      id:  msg.id,
      text: msg.content,
      sender: 'me',
      time: formatTime(msg.timestamp),
      read: msg.read
    };

    setMessages(prev => [...prev, newMsg]);

    const updateLastMessage = (contactList) => contactList.map(c =>
      c.id === msg.toId
        ? { ...c, lastMessage: msg.content, time: '今' }
        :  c
    );
    setContacts(updateLastMessage);
    setAllContacts(updateLastMessage);
  };

  const handleMessageRead = (data) => {
    console.log('既読通知:', data);
    setMessages(prev => prev.map(m =>
      m.id === data.messageId ?  { ...m, read: true } : m
    ));
  };

  const handleUserStatus = (data) => {
    console.log('ユーザーステータス更新:', data);
    const updateStatus = (contactList) => contactList.map(c =>
      c.id === data.userId
        ? { ...c, status: data.status }
        : c
    );
    setContacts(updateStatus);
    setAllContacts(updateStatus);
  };

  const handleConnectionLost = () => {
    console.log('接続が切断されました');
    setIsConnected(false);
    setErrorMessage('サーバーとの接続が切断されました');
  };

  const markAsRead = async (messageId, otherId) => {
    if (!isWailsEnv) return;

    try {
      await MarkAsRead(messageId, otherId);
    } catch (error) {
      console.error('既読エラー:', error);
    }
  };

  const handleSendMessage = async () => {
    if (! inputMessage.trim() || !selectedContact) return;

    try {
      await SendMessage(selectedContact.id, inputMessage);
      setInputMessage('');
    } catch (error) {
      console.error('送信エラー:', error);
      alert('メッセージの送信に失敗しました:  ' + getErrorMessage(error));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (isNaN(date.getTime())) return '';

    if (diff < 60000) return '今';

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return '昨日';

    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
      return days[date.getDay()];
    }

    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
  };

  if (! isWailsEnv) {
    return (
      <div className="app">
        <Header user={user} onLogout={onLogout} />
        <div className="chat-container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column'
        }}>
          <p style={{ color: '#ff6b6b', fontSize: '18px' }}>
            ⚠️ Wails環境が検出されませんでした
          </p>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="app">
        <Header user={user} onLogout={onLogout} />
        <div className="chat-container" style={{
          display: 'flex',
          alignItems:  'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <p>接続中...</p>
        </div>
      </div>
    );
  }

  if (!isConnected && !isInitializing) {
    return (
      <div className="app">
        <Header user={user} onLogout={onLogout} />
        <div className="chat-container" style={{
          display: 'flex',
          alignItems:  'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column'
        }}>
          <p style={{ color: '#ff6b6b', fontSize: '18px' }}>
            {errorMessage || 'サーバーに接続できませんでした'}
          </p>
          {!user && (
            <p style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>
              チャットを使用するにはログインしてください
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header user={user} onLogout={onLogout} />
      <div className="chat-container">
        {/* Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h1 className="sidebar-title">ダイレクトメッセージ</h1>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
              ログイン中:  {currentUser?.name}
            </div>
            <div className="search-container">
              <input
                type="text"
                placeholder="会話を検索"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="contacts-list">
            {contacts.length === 0 ? (
              <div style={{ padding: '20px', textAlign:  'center', color: '#999' }}>
                <p>他のユーザーがいません</p>
                <p style={{ fontSize: '12px', marginTop: '10px' }}>
                  他のユーザーが接続するのを待っています... 
                </p>
              </div>
            ) : (
              contacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => {
                    setSelectedContact(contact);
                    selectedContactIdRef.current = contact.id;
                  }}
                  className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                >
                  <div className="contact-avatar-wrapper">
                    <div className="contact-avatar">{contact.avatar}</div>
                    {contact.status === 'online' && (
                      <div className="online-indicator"></div>
                    )}
                    {contact.unread > 0 && (
                      <div className="unread-badge">{contact.unread}</div>
                    )}
                  </div>
                  <div className="contact-info">
                    <div className="contact-header">
                      <h3 className="contact-name">{contact.name}</h3>
                      <span className="contact-time">{contact.time}</span>
                    </div>
                    <p className="contact-last-message">{contact.lastMessage}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedContact ?  (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-avatar">{selectedContact.avatar}</div>
                  <div>
                    <h2 className="chat-name">{selectedContact.name}</h2>
                    {selectedContact.status && (
                      <span className="chat-status">
                        {selectedContact.status === 'online' ?  'オンライン' : 'オフライン'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="action-btn" title="音声通話">📞</button>
                  <button className="action-btn" title="ビデオ通話">📹</button>
                  <button className="action-btn" title="メニュー">⋮</button>
                </div>
              </div>

              <div className="messages-area">
                <div className="messages-container">
                  {messages.length === 0 ? (
                    <div className="no-messages">
                      <p>メッセージはまだありません</p>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                        最初のメッセージを送信してみましょう
                      </p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`message ${msg.sender === 'me' ? 'message-sent' : 'message-received'}`}
                      >
                        <div className="message-bubble">
                          {msg.sender === 'them' && (
                            <div className="message-avatar">{selectedContact.avatar}</div>
                          )}
                          <div className="message-content-wrapper">
                            {msg.sender === 'them' && (
                              <div className="message-sender">
                                {msg.senderName || selectedContact.name}
                                <span className="message-time">{msg.time}</span>
                              </div>
                            )}
                            <p className="message-text">{msg.text}</p>
                            {msg.sender === 'me' && (
                              <div className="message-status">
                                <span className="message-time">{msg.time}</span>
                                {msg.read && <span className="read-status"> 既読</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="input-area">
                <div className="input-container">
                  <button className="more-btn" title="ファイル添付">＋</button>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && ! e.shiftKey && handleSendMessage()}
                    placeholder={`${selectedContact.name}へメッセージを送信`}
                    className="message-input"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="send-btn"
                    title="送信"
                  >
                    ➤
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>会話を選択してメッセージを開始しましょう</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}