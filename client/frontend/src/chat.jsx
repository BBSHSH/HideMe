import React, { useState, useEffect, useRef } from 'react';
import { 
  RegisterUser, ConnectWebSocket, SendMessage, GetUsers, GetMessages,
  StartCall, AnswerCall, GetCurrentUserID, GetCurrentUserName
} from '../wailsjs/go/app/ChatApp';
import { EventsOn } from '../wailsjs/runtime/runtime';
import './css/Chat.css';

function Chat() {
  const [registered, setRegistered] = useState(false);
  const [userName, setUserName] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  
  const messagesEndRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  useEffect(() => {
    // イベントリスナー設定
    EventsOn('message', handleIncomingMessage);
    EventsOn('user-status', handleUserStatus);
    EventsOn('call-offer', handleCallOffer);
    EventsOn('call-answer', handleCallAnswer);
    EventsOn('ice-candidate', handleICECandidate);
  }, []);

  useEffect(() => {
    if (registered) {
      loadUsers();
      const interval = setInterval(loadUsers, 5000);
      return () => clearInterval(interval);
    }
  }, [registered]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRegister = async () => {
    if (!userName.trim()) return;
    
    try {
      await RegisterUser(userName);
      await ConnectWebSocket();
      const userId = await GetCurrentUserID();
      setCurrentUserId(userId);
      setRegistered(true);
    } catch (error) {
      console.error('Registration error:', error);
      alert('登録に失敗しました');
    }
  };

  const loadUsers = async () => {
    try {
      const userList = await GetUsers();
      setUsers(userList.filter(u => u.id !== currentUserId));
    } catch (error) {
      console.error('Load users error:', error);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const msgs = await GetMessages(userId) || [];
      setMessages(msgs);
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUser) return;

    try {
      await SendMessage(selectedUser.id, messageInput);
      
      const newMessage = {
        fromId: currentUserId,
        toId: selectedUser.id,
        content: messageInput,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages([...messages, newMessage]);
      setMessageInput('');
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleIncomingMessage = (msg) => {
    if (selectedUser && (msg.fromId === selectedUser.id || msg.toId === selectedUser.id)) {
      setMessages(prev => [...prev, msg]);
    }
  };

  const handleUserStatus = (data) => {
    setUsers(prev => prev.map(user => 
      user.id === data.userId ? { ...user, status: data.status } : user
    ));
  };

  // WebRTC通話機能
  const initializePeerConnection = () => {
    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
    
    const pc = new RTCPeerConnection(config);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && selectedUser) {
        SendICECandidate(selectedUser.id, event.candidate);
      }
    };
    
    pc.ontrack = (event) => {
      if (remoteStreamRef.current) {
        remoteStreamRef.current.srcObject = event.streams[0];
      }
    };
    
    return pc;
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current.srcObject = stream;
      
      const pc = initializePeerConnection();
      peerConnectionRef.current = pc;
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      await StartCall(selectedUser.id, JSON.stringify(offer));
      setInCall(true);
    } catch (error) {
      console.error('Start call error:', error);
      alert('通話を開始できませんでした');
    }
  };

  const handleCallOffer = async (offer) => {
    setIncomingCall({
      fromId: offer.fromId,
      sdp: offer.sdp
    });
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current.srcObject = stream;
      
      const pc = initializePeerConnection();
      peerConnectionRef.current = pc;
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      await pc.setRemoteDescription(JSON.parse(incomingCall.sdp));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      await AnswerCall(incomingCall.fromId, JSON.stringify(answer));
      setInCall(true);
      setIncomingCall(null);
    } catch (error) {
      console.error('Accept call error:', error);
    }
  };

  const rejectCall = () => {
    setIncomingCall(null);
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (localStreamRef.current && localStreamRef.current.srcObject) {
      localStreamRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setInCall(false);
  };

  const handleCallAnswer = async (answer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(JSON.parse(answer.sdp));
    } catch (error) {
      console.error('Handle answer error:', error);
    }
  };

  const handleICECandidate = async (data) => {
    try {
      await peerConnectionRef.current.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('Handle ICE candidate error:', error);
    }
  };

  if (!registered) {
    return (
      <div className="chat-login">
        <div className="login-box">
          <h2>💬 Chat App</h2>
          <input
            type="text"
            placeholder="ユーザー名を入力"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
            className="login-input"
          />
          <button onClick={handleRegister} className="login-btn">
            ログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>💬 チャット</h3>
          <div className="user-info">{userName}</div>
        </div>
        <div className="users-list">
          {users.map(user => (
            <div
              key={user.id}
              className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
              onClick={() => setSelectedUser(user)}
            >
              <div className={`user-avatar ${user.status}`}>
                {user.name[0]}
              </div>
              <div className="user-details">
                <div className="user-name">{user.name}</div>
                <div className="user-status">{user.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className={`user-avatar ${selectedUser.status}`}>
                  {selectedUser.name[0]}
                </div>
                <div>
                  <div className="chat-user-name">{selectedUser.name}</div>
                  <div className="chat-user-status">{selectedUser.status}</div>
                </div>
              </div>
              <button onClick={startCall} disabled={inCall} className="call-btn">
                📞 通話
              </button>
            </div>

            {inCall && (
              <div className="call-window">
                <video ref={remoteStreamRef} autoPlay playsInline className="remote-video" />
                <video ref={localStreamRef} autoPlay playsInline muted className="local-video" />
                <button onClick={endCall} className="end-call-btn">通話終了</button>
              </div>
            )}

            <div className="messages-container">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.fromId === currentUserId ? 'sent' : 'received'}`}
                >
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
              <input
                type="text"
                placeholder="メッセージを入力..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="message-input"
              />
              <button onClick={handleSendMessage} className="send-btn">
                送信
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>チャットを選択してください</p>
          </div>
        )}
      </div>

      {incomingCall && (
        <div className="incoming-call-modal">
          <div className="modal-content">
            <h3>着信中...</h3>
            <p>通話を受けますか？</p>
            <div className="modal-buttons">
              <button onClick={acceptCall} className="accept-btn">応答</button>
              <button onClick={rejectCall} className="reject-btn">拒否</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;