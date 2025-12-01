import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Editor from './Editor';
import Chat from './chat';
import File from './file';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/file" element={<File />} />
        <Route path="/editor" element={<Editor />} />

      </Routes>
    </Router>
  );
}

export default App;
