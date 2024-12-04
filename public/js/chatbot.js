class TherapeuticChatbot {
    constructor() {
        // Initialize state
        this.state = {
            isListening: false,
            isProcessing: false,
            isSpeaking: false,
            voiceOutputEnabled: false,
            messages: JSON.parse(localStorage.getItem('chatHistory') || '[]')
        };


        // Speech recognition setup
        this.recognition = 'webkitSpeechRecognition' in window
            ? new webkitSpeechRecognition()
            : null;

        this.synthesis = window.speechSynthesis;
        this.setupSpeechRecognition();
        this.initializeUI();
        this.loadMessages();
    }

    initializeUI() {
        this.elements = {
            chatContainer: document.querySelector('#chat-messages'),
            inputField: document.querySelector('#text-input'),
            sendButton: document.querySelector('#send-btn'),
            voiceButton: document.querySelector('#voice-input-btn'),
            voiceOutputButton: document.querySelector('#voice-output-toggle'),
            typingIndicator: this.createTypingIndicator()
        };

        // Set up event listeners
        this.elements.sendButton.addEventListener('click', () => this.handleSend());
        this.elements.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
        this.elements.voiceButton.addEventListener('click', () => this.toggleVoiceInput());
        this.elements.voiceOutputButton.addEventListener('click', () => this.toggleVoiceOutput());

        if (!this.state.messages.length) {
            this.addMessage({
                type: 'bot',
                content: "Hi! I'm here to listen and support you. How are you feeling today?",
                timestamp: new Date()
            });
        }
    }

    createTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator hidden flex items-center space-x-2 p-3 bg-gray-100 rounded-lg';
        indicator.innerHTML = `
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        `;
        return indicator;
    }

    setupSpeechRecognition() {
        if (!this.recognition) return;

        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.state.isListening = true;
            this.updateVoiceButton();
        };

        this.recognition.onend = () => {
            this.state.isListening = false;
            this.updateVoiceButton();
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.elements.inputField.value = transcript;
            this.handleSend();
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showError('Voice input error. Please try again or use text input.');
            this.state.isListening = false;
            this.updateVoiceButton();
        };
    }

    async handleSend() {
        const content = this.elements.inputField.value.trim();
        if (!content || this.state.isProcessing) return;

        this.state.isProcessing = true;
        this.elements.sendButton.disabled = true;
        this.elements.inputField.value = '';

        try {
            // Add user message
            const userMessage = {
                type: 'user',
                content,
                timestamp: new Date()
            };
            this.addMessage(userMessage);

            // Show typing indicator
            this.showTypingIndicator();

            // Get bot response
            const response = await this.getBotResponse(content);

            // Hide typing indicator
            this.hideTypingIndicator();

            // Add bot message
            const botMessage = {
                type: 'bot',
                content: response,
                timestamp: new Date()
            };
            this.addMessage(botMessage);

            // Speak response if enabled
            if (this.state.voiceOutputEnabled) {
                this.speakMessage(response);
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.showError('Failed to get response. Please try again.');
            console.error('Error:', error);
        } finally {
            this.state.isProcessing = false;
            this.elements.sendButton.disabled = false;
            this.elements.inputField.focus();
        }
    }

    async getBotResponse(userInput) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: `You are a supportive and empathetic stress relief companion dedicated to helping users manage stress, anxiety, and emotional challenges. Provide detailed, thoughtful, and comprehensive responses that address the user's feelings and offer practical coping strategies. Ensure your answers are thorough yet compassionate. If a user expresses severe distress, gently recommend seeking professional help while maintaining a supportive and understanding tone.`
                    },
                    {
                        role: 'user',
                        content: userInput
                    }
                ],
                temperature: 0.7,
                max_tokens: 500,
                top_p: 0.9,
                frequency_penalty: 0.5,
                presence_penalty: 0.3
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get bot response');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    addMessage(message) {
        this.state.messages.push(message);
        this.saveMessages();
        this.renderMessage(message);
        this.scrollToBottom();
    }

    renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.type} mb-4 ${
            message.type === 'user' ? 'text-right' : 'text-left'
        }`;

        const bubbleElement = document.createElement('div');
        bubbleElement.className = `inline-block max-w-[80%] p-3 rounded-lg ${
            message.type === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
        }`;

        bubbleElement.textContent = message.content;
        messageElement.appendChild(bubbleElement);

        const timestamp = document.createElement('div');
        timestamp.className = 'text-xs text-gray-500 mt-1';
        timestamp.textContent = new Date(message.timestamp).toLocaleTimeString();
        messageElement.appendChild(timestamp);

        this.elements.chatContainer.appendChild(messageElement);
    }

    showTypingIndicator() {
        this.elements.typingIndicator.classList.remove('hidden');
        this.elements.chatContainer.appendChild(this.elements.typingIndicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.elements.typingIndicator.classList.add('hidden');
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.showError('Voice input is not supported in your browser.');
            return;
        }

        if (this.state.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    toggleVoiceOutput() {
        this.state.voiceOutputEnabled = !this.state.voiceOutputEnabled;
        this.elements.voiceOutputButton.textContent =
            this.state.voiceOutputEnabled ? 'Disable Voice Output' : 'Enable Voice Output';
    }

    speakMessage(text) {
        if (this.state.isSpeaking) {
            this.synthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.onstart = () => {
            this.state.isSpeaking = true;
        };
        utterance.onend = () => {
            this.state.isSpeaking = false;
        };
        this.synthesis.speak(utterance);
    }

    updateVoiceButton() {
        this.elements.voiceButton.textContent = this.state.isListening
            ? 'Stop Listening'
            : 'Start Voice Input';
        this.elements.voiceButton.classList.toggle('bg-red-500', this.state.isListening);
        this.elements.voiceButton.classList.toggle('bg-green-500', !this.state.isListening);
    }

    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4';
        errorElement.textContent = message;

        const closeButton = document.createElement('button');
        closeButton.className = 'absolute top-0 right-0 px-4 py-3';
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => errorElement.remove();

        errorElement.appendChild(closeButton);
        this.elements.chatContainer.appendChild(errorElement);
        this.scrollToBottom();

        setTimeout(() => errorElement.remove(), 5000);
    }

    saveMessages() {
        localStorage.setItem('chatHistory', JSON.stringify(this.state.messages));
    }

    loadMessages() {
        this.state.messages.forEach(message => this.renderMessage(message));
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    localStorage.clear();

    window.chatbot = new TherapeuticChatbot();
});