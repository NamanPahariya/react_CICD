import { useState } from 'react'
import './App.css'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const systemMessage = {
  "role": "system",
  "content": "Explain things like you're talking to a software professional with 2 years of experience."
}

function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hi, I'm TeluskoBot! Ask me anything!",
      sentTime: "just now",
      sender: "ChatGPT"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: "user"
    };

    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setError(null);
    setIsTyping(true);

    try {
      await processMessageToChatGPT(newMessages);
    } catch (err) {
      setError(err.message);
      // Add an error message to the chat
      setMessages([...newMessages, {
        message: "Sorry, there was an error processing your message. Please try again later.",
        sender: "ChatGPT",
        direction: 'incoming',
        error: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  async function processMessageToChatGPT(chatMessages) {
    const apiMessages = chatMessages.map((messageObject) => ({
      role: messageObject.sender === "ChatGPT" ? "assistant" : "user",
      content: messageObject.message
    }));

    const apiRequestBody = {
      "model": "gpt-4o-mini",
      "store": true,          
      "messages": [
        systemMessage,
        ...apiMessages
      ]
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiRequestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response from TeluskoBot');
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]) {
        throw new Error('Invalid response format from API');
      }

      setMessages([...chatMessages, {
        message: data.choices[0].message.content,
        sender: "ChatGPT",
        direction: 'incoming'
      }]);
    } catch (error) {
      console.error("Error processing message:", error);
      throw error;
    }
  }

  return (
    <div className="App">

      <div style={{ position:"relative", height: "800px", width: "700px"  }}>
        <MainContainer>
          <ChatContainer>       
            <MessageList 
              scrollBehavior="smooth" 
              typingIndicator={isTyping ? <TypingIndicator content="TeluskoBot is typing" /> : null}
            >
              {messages.map((message, i) => (
                <Message 
                  key={i} 
                  model={message} 
                  className={message.error ? "error-message" : ""}
                />
              ))}
            </MessageList>
            {error && (
              <div className="error-banner">
                {error}
              </div>
            )}
            <MessageInput placeholder="Type message here" onSend={handleSend} attachButton={false} />        
          </ChatContainer>
        </MainContainer>

      </div>
    </div>
  )
}

export default App