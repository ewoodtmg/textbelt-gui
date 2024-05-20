document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const updateSettingsForm = document.getElementById('update-settings-form');
    const sendTextForm = document.getElementById('send-text-form');
    const logoutButton = document.getElementById('logout-button');
    const quotaInfo = document.getElementById('quota-remaining');
    const authContainer = document.getElementById('auth-container');
    const settingsContainer = document.getElementById('settings-container');
    const textingContainer = document.getElementById('texting-container');
    const messagesContainer = document.getElementById('messages-container');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    async function fetchQuota() {
        try {
            const response = await fetch('/quota');
            if (response.ok) {
                const data = await response.json();
                quotaInfo.textContent = data.quotaRemaining;
            } else {
                quotaInfo.textContent = 'Failed to fetch quota';
            }
        } catch (error) {
            console.error('Error fetching quota:', error);
            quotaInfo.textContent = 'Failed to fetch quota';
        }
    }

    async function fetchMessages() {
        try {
            const response = await fetch('/messages');
            if (response.ok) {
                const messages = await response.json();
                const messagesList = document.getElementById('messages-list');
                messagesList.innerHTML = '';
                messages.forEach(message => {
                    const li = document.createElement('li');
                    li.textContent = `${message.phones.length} Numbers | ${new Date(message.date).toLocaleString()}: ${message.message}`;
                    let details; // Variable to store the details element

                    li.addEventListener('click', () => {
                        if (details) {
                            // If details are already shown, remove them
                            details.remove();
                            details = null; // Set details to null
                        } else {
                            // If details are not shown, create and append them
                            details = document.createElement('ul');
                            message.phones.forEach(phone => {
                                const phoneLi = document.createElement('li');
                                phoneLi.textContent = phone;
                                details.appendChild(phoneLi);
                            });
                            li.appendChild(details);
                        }
                    });

                    messagesList.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    async function checkAuthStatus() {
        try {
            const response = await fetch('/auth-status');
            const data = await response.json();
            if (data.isAuthenticated) {
                authContainer.style.display = 'none';
                settingsContainer.style.display = 'block';
                textingContainer.style.display = 'block';
                messagesContainer.style.display = 'block';
                logoutButton.style.display = 'block';
                fetchQuota();
                fetchMessages();
            } else {
                authContainer.style.display = 'block';
                settingsContainer.style.display = 'none';
                textingContainer.style.display = 'none';
                messagesContainer.style.display = 'none';
                logoutButton.style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameOrEmail = document.getElementById('login-username-or-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ usernameOrEmail, password })
            });

            if (response.ok) {
                checkAuthStatus();
            } else {
                const errorData = await response.json();
                showError('Login failed: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error during login:', error);
            showError('Login failed: ' + error.message);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            if (response.ok) {
                showError('Registration successful! Please log in.');
            } else {
                const errorData = await response.json();
                showError('Registration failed: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error during registration:', error);
            showError('Registration failed: ' + error.message);
        }
    });

    updateSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const apiKey = document.getElementById('api-key').value;

        try {
            const response = await fetch('/update-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey })
            });

            if (response.ok) {
                fetchQuota();
                showError('API key updated successfully!');
            } else {
                showError('Failed to update API key');
            }
        } catch (error) {
            console.error('Error updating API key:', error);
            showError('Failed to update API key');
        }
    });

    sendTextForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('phone-numbers').value;
        const message = document.getElementById('text-message').value;

        try {
            const response = await fetch('/send-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, message })
            });

            if (response.ok) {
                showError('Message sent successfully!');
                fetchMessages();
                fetchQuota();
            } else {
                showError('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showError('Failed to send message');
        }
    });

    logoutButton.addEventListener('click', async () => {
        const response = await fetch('/logout');
        if (response.ok) {
            checkAuthStatus();
        } else {
            showError('Logout failed');
        }
    });

    checkAuthStatus();
});
