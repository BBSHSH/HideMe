// chat.jsx - Header対応版
import React, { useState, useEffect, useRef } from 'react';
import { GetUsers, GetMessages, SendMessage } from '../wailsjs/go/app/ChatApp';
import { EventsOn } from '../wailsjs/runtime/runtime';
import './css/chat.css';
import Header from './components/Header';

export default function Chat() {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadContacts();
    
    // WebSocketからのメッセージを受信
    EventsOn('message', (msg) => {
      if (selectedContact && (msg.fromId === selectedContact.id || msg.toId === selectedContact.id)) {
        setMessages(prev => [...prev, msg]);
      }
      loadContacts(); // 連絡先リストを更新
    });

    EventsOn('user_status', (data) => {
      setContacts(prev => prev.map(c => 
        c.id === data.userId ? { ...c, status: data.status } : c
      ));
    });
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadContacts = async () => {
    try {
      const users = await GetUsers();
      const contactsData = users.map(user => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar || '👤',
        lastMessage: '',
        time: formatTime(user.lastSeen),
        unread: 0,
        status: user.status
      }));
      
      setContacts(contactsData || []);
      if (contactsData && contactsData.length > 0 && !selectedContact) {
        setSelectedContact(contactsData[0]);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const loadMessages = async (contactId) => {
    try {
      const data = await GetMessages(contactId);
      const messagesData = (data || []).map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.fromId === contactId ? 'them' : 'me',
        time: formatMessageTime(msg.timestamp),
        contactId: contactId
      }));
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      loadContacts();
    } else {
      const filtered = contacts.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase())
      );
      setContacts(filtered);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedContact) return;

    try {
      await SendMessage(selectedContact.id, inputMessage);
      
      const newMessage = {
        id: Date.now().toString(),
        text: inputMessage,
        sender: 'me',
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        contactId: selectedContact.id
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
      
      setContacts(prev => prev.map(c => 
        c.id === selectedContact.id 
          ? { ...c, lastMessage: inputMessage, time: '今' }
          : c
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
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
    
    if (diff < 60000) return '今';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString('ja-JP', { weekday: 'short' });
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app">
      <Header />
      <div className="chat-container">
        {/* Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h1 className="sidebar-title">トーク</h1>
            <div className="search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="検索"
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
                  <p className="contact-last-message">{contact.lastMessage || 'メッセージなし'}</p>
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
                      <span className="chat-status">{selectedContact.status === 'online' ? 'オンライン' : 'オフライン'}</span>
                    )}
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="action-btn">📞</button>
                  <button className="action-btn">📹</button>
                  <button className="action-btn">☰</button>
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
                          <p className="message-text">{msg.text}</p>
                          <p className="message-time">{msg.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="input-area">
                <div className="input-container">
                  <button className="more-btn">⋮</button>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="メッセージを入力"
                    className="message-input"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="send-btn"
                  >
                    ➤
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>連絡先を選択してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
