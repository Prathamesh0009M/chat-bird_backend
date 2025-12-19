document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');
    const userIdInput = document.getElementById('userId');

    let currentUserId = null;

    // Register user with the server when they enter their ID
    userIdInput.addEventListener('change', () => {
        currentUserId = userIdInput.value.trim();
        if (currentUserId) {
            socket.emit('register', currentUserId);
            console.log(`Registered as user: ${currentUserId}`);
            userIdInput.disabled = true;
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentUserId) {
            alert('Please enter your User ID first!');
            return;
        }
        
        const messageText = input.value.trim();
        const conversationId = document.getElementById('conversationId').value.trim();
        const recipientIds = document.getElementById('recipientIds').value.trim().split(',').map(id => id.trim());

        if (messageText && conversationId && recipientIds.length > 0) {
            const messageData = {
                conversationId: conversationId,
                senderId: currentUserId,
                text: messageText,
                language: 'en', // For simplicity, we assume the sender is always typing in English.
                recipients: [...recipientIds, currentUserId] // Include sender in recipients list
            };

            socket.emit('sendMessage', messageData);
            input.value = '';
        }
    });

    socket.on('receiveMessage', (data) => {
        const item = document.createElement('li');
        item.innerHTML = `
            ${data.text}
            <span class="user-info">(lang: ${data.lang})</span>
        `;
        
        // Style message based on whether it was sent or received
        if (data.sender === currentUserId) {
            item.classList.add('sent');
        } else {
            item.classList.add('received');
        }
        
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight; // Auto-scroll to bottom
    });
});