import React, { useState, useEffect, useRef } from 'react';
import './css/chat.css';
import Header from './components/Header';

// テストデータ
const TEST_CONTACTS = [
  {
    id: '1',
    name: '徳永 瀬那',
    avatar: 'T',
    lastMessage: 'トロールしまーす',
    time: '9:30',
    unread: 3,
    status: 'online'
  },
  {
    id: '2',
    name: '山田 花子',
    avatar: 'Y',
    lastMessage: 'ありがとうございます！',
    time: '昨日',
    unread: 0,
    status: 'online'
  },
  {
    id: '3',
    name: '佐藤 次郎',
    avatar: 'S',
    lastMessage: '了解です',
    time: '月曜日',
    unread: 0,
    status: 'offline'
  },
  {
    id: '4',
    name: '鈴木 美咲',
    avatar: 'M',
    lastMessage: '今日の会議は何時でしたっけ?',
    time: '10:15',
    unread: 1,
    status: 'online'
  },
  {
    id: '5',
    name: '高橋 健',
    avatar: 'T',
    lastMessage: 'お疲れ様です',
    time: '火曜日',
    unread: 0,
    status: 'offline'
  }
];

const TEST_MESSAGES = {
  '1': [
    { id: '1', text: 'トロールしまーす!', sender: 'them', time: '9:25', senderName: '徳永 瀬那' },
    { id: '2', text: 'ほんまにやめて', sender: 'me', time: '9:26' },
    { id: '3', text: 'むりぽｗｗｗ', sender: 'them', time: '9:27', senderName: '徳永 瀬那' },
    { id: '4', text: '？？？', sender: 'me', time: '9:28' },
    { id: '5', text: 'どんまいｗｗ', sender: 'them', time: '9:30', senderName: '徳永 瀬那' }
  ],
  '2': [
    { id: '1', text: '資料送っていただけますか？', sender: 'them', time: '14:20', senderName: '山田 花子' },
    { id: '2', text: 'はい、今すぐ送ります', sender: 'me', time: '14:21' },
    { id: '3', text: 'ありがとうございます！', sender: 'them', time: '14:22', senderName: '山田 花子' }
  ],
  '3': [
    { id: '1', text: '明日の打ち合わせ、10時からでお願いします', sender: 'me', time: '16:45' },
    { id: '2', text: '了解です', sender: 'them', time: '16:46', senderName: '佐藤 次郎' }
  ],
  '4': [
    { id: '1', text: '今日の会議は何時でしたっけ?', sender: 'them', time: '10:15', senderName: '鈴木 美咲' }
  ],
  '5': [
    { id: '1', text: 'プレゼン資料確認しました', sender: 'them', time: '11:30', senderName: '高橋 健' },
    { id: '2', text: 'ありがとうございます', sender: 'me', time: '11:31' },
    { id: '3', text: 'お疲れ様です', sender: 'them', time: '11:32', senderName: '高橋 健' }
  ]
};

export default function Chat() {
  const [contacts, setContacts] = useState(TEST_CONTACTS);
  const [selectedContact, setSelectedContact] = useState(TEST_CONTACTS[0]);
  const [messages, setMessages] = useState(TEST_MESSAGES['1']);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedContact) {
      setMessages(TEST_MESSAGES[selectedContact.id] || []);
      // 未読をクリア
      setContacts(prev => prev.map(c => 
        c.id === selectedContact.id ? { ...c, unread: 0 } : c
      ));
    }
  }, [selectedContact]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setContacts(TEST_CONTACTS);
    } else {
      const filtered = TEST_CONTACTS.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase())
      );
      setContacts(filtered);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedContact) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    // 連絡先リストの最終メッセージを更新
    setContacts(prev => prev.map(c => 
      c.id === selectedContact.id 
        ? { ...c, lastMessage: inputMessage, time: '今' }
        : c
    ));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="app">
      <Header />
      <div className="chat-container">
        {/* Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h1 className="sidebar-title">ダイレクトメッセージ</h1>
            <div className="search-container">
              <span className="search-icon">🔍</span>
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
            {contacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
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
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedContact ? (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-avatar">{selectedContact.avatar}</div>
                  <div>
                    <h2 className="chat-name">{selectedContact.name}</h2>
                    {selectedContact.status && (
                      <span className="chat-status">
                        {selectedContact.status === 'online' ? 'オンライン' : 'オフライン'}
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
                                {msg.senderName}
                                <span className="message-time">{msg.time}</span>
                              </div>
                            )}
                            <p className="message-text">{msg.text}</p>
                            {msg.sender === 'me' && (
                              <span className="message-time">{msg.time}</span>
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
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
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