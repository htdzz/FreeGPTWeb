/*
 * 未经允许，禁止任何形式的复制、倒卖、销售。
 * 仅供个人使用
 * 如果你有任何问题或建议，欢迎随时与我联系。
*/

const apiKey = '填写你的key';
const apiUrl = 'https://free.gpt.ge/v1/chat/completions';

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const errorMessage = document.getElementById('error-message');

let conversationHistory = [];

function createCodeBlock(code, language) {
  const codeBlock = document.createElement('div');
  codeBlock.className = 'code-block';
  
  const header = document.createElement('div');
  header.className = 'code-header';
  
  const buttons = document.createElement('div');
  buttons.className = 'window-buttons';
  ['close', 'minimize', 'maximize'].forEach(btnClass => {
    const btn = document.createElement('div');
    btn.className = `window-button ${btnClass}`;
    buttons.appendChild(btn);
  });
  
  const langSpan = document.createElement('span');
  langSpan.textContent = language || 'Code';
  
  const copyButton = document.createElement('button');
  copyButton.className = 'copy-button';
  copyButton.innerHTML = `
    <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
    <span class="copy-text">Copy</span>
  `;
  copyButton.title = '复制到剪贴板';
  
  const copyFeedback = document.createElement('span');
  copyFeedback.className = 'copy-feedback';
  copyFeedback.textContent = 'Copied!';
  
  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(code.trim()).then(() => {
      copyFeedback.style.display = 'inline';
      copyButton.querySelector('.copy-text').textContent = 'Copied!';
      setTimeout(() => {
        copyFeedback.style.display = 'none';
        copyButton.querySelector('.copy-text').textContent = 'Copy';
      }, 2000);
    }).catch(err => {
      console.error('复制文本失败: ', err);
    });
  });
  
  header.appendChild(buttons);
  header.appendChild(langSpan);
  header.appendChild(copyButton);
  header.appendChild(copyFeedback);
  
  const content = document.createElement('pre');
  content.className = 'code-content';
  const codeElement = document.createElement('code');
  codeElement.className = language;
  codeElement.textContent = code.trim();
  
  content.appendChild(codeElement);
  
  codeBlock.appendChild(header);
  codeBlock.appendChild(content);
  
  return codeBlock;
}

function addMessage(content, isUser) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.classList.add(isUser ? 'user-message' : 'ai-message');
  
  if (!isUser) {
    messageElement.classList.add('typing-indicator');
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return new Promise((resolve) => {
      let index = 0;
      const intervalId = setInterval(() => {
        if (index < content.length) {
          const char = content[index];
          if (char === '`' && content.substr(index, 3) === '```') {
            
            const endIndex = content.indexOf('```', index + 3);
            if (endIndex !== -1) {
              const codeBlock = content.substring(index, endIndex + 3);
              messageElement.innerHTML += codeBlock;
              index = endIndex + 3;
            }
          } else {
            messageElement.innerHTML += char;
          }
          index++;
          chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
          clearInterval(intervalId);
          messageElement.classList.remove('typing-indicator');
          
          
          messageElement.innerHTML = messageElement.innerHTML.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return createCodeBlock(code, lang).outerHTML;
          });
          
          
          messageElement.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
          });
          
          resolve();
        }
      }, 10);
    });
  } else {
    messageElement.textContent = content;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (message) {
    addMessage(message, true);
    userInput.value = '';
    conversationHistory.push({role: "user", content: message});

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",//这里切换模型
          messages: conversationHistory,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('API请求失败');
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const aiReply = data.choices[0].message.content;
        await addMessage(aiReply, false);
        conversationHistory.push({role: "assistant", content: aiReply});
      } else {
        throw new Error('无效API响应格式');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('请求出错。请再试一次.');
    }
  }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// 初次问候
(async () => {
  const greeting = "你好！我是由“化自在”提供动力的人工智能GPT。我今天可以帮助你什么？";
  await addMessage(greeting, false);
  conversationHistory.push({role: "assistant", content: greeting});
})();