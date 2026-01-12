import React from 'react'
import ChatContainer from './components/ChatContainer'

const App: React.FC = () => {
  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
      <ChatContainer />
    </div>
  )
}

export default App
