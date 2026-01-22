import React, { useState } from 'react';
import './css/auth.css';

export default function Login({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { username, password }
        : { username, password, displayName };

      const response = await fetch(`http://localhost:9000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '認証に失敗しました');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">
          {isLogin ? 'ログイン' : 'アカウント作成'}
        </h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* ユーザー名 */}
          <div className="form-group">
            <label htmlFor="username">ユーザーID</label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="3-20文字"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              disabled={loading}
            />
          </div>

          {/* 表示名（登録時のみ） */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="displayName">表示名</label>
              <input
                id="displayName"
                type="text"
                className="form-input"
                placeholder="チャットで表示される名前"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          {/* パスワード */}
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="6文字以上"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          {/* エラー */}
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠</span>
              {error}
            </div>
          )}

          {/* 送信 */}
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? '処理中...' : isLogin ? 'ログイン' : 'アカウント作成'}
          </button>
        </form>

        {/* 切り替え */}
        <div className="auth-toggle">
          <button
            type="button"
            className="toggle-button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            disabled={loading}
          >
            {isLogin
              ? 'アカウントをお持ちでない方はこちら'
              : '既にアカウントをお持ちの方はこちら'}
          </button>
        </div>
      </div>
    </div>
  );
}
