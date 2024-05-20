/* document.addEventListener('DOMContentLoaded', () => {
    const usersList = document.getElementById('users-list');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    async function fetchUsers() {
        const response = await fetch('/admin/users');
        if (response.ok) {
            const users = await response.json();
            usersList.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');

                const usernameCell = document.createElement('td');
                usernameCell.textContent = user.username;
                row.appendChild(usernameCell);

                const emailCell = document.createElement('td');
                const emailInput = document.createElement('input');
                emailInput.type = 'email';
                emailInput.value = user.email;
                emailCell.appendChild(emailInput);
                row.appendChild(emailCell);

                const apiKeyCell = document.createElement('td');
                const apiKeyInput = document.createElement('input');
                apiKeyInput.type = 'text';
                apiKeyInput.value = user.apiKey || '';
                apiKeyCell.appendChild(apiKeyInput);
                row.appendChild(apiKeyCell);

                const passwordCell = document.createElement('td');
                const passwordInput = document.createElement('input');
                passwordInput.type = 'password';
                passwordCell.appendChild(passwordInput);
                row.appendChild(passwordCell);

                const roleCell = document.createElement('td');
                const roleSelect = document.createElement('select');
                const userOption = document.createElement('option');
                userOption.value = 'user';
                userOption.textContent = 'User';
                roleSelect.appendChild(userOption);
                const adminOption = document.createElement('option');
                adminOption.value = 'admin';
                adminOption.textContent = 'Admin';
                roleSelect.appendChild(adminOption);
                roleSelect.value = user.role || 'user';
                roleCell.appendChild(roleSelect);
                row.appendChild(roleCell);

                const actionsCell = document.createElement('td');
                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save';
                saveButton.addEventListener('click', async () => {
                    const updatedUser = {
                        email: emailInput.value,
                        apiKey: apiKeyInput.value,
                        role: roleSelect.value,
                    };
                    if (passwordInput.value) {
                        updatedUser.password = passwordInput.value;
                    }
                    const response = await fetch(`/admin/users/${user._id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updatedUser)
                    });
                    if (response.ok) {
                        showError('User updated successfully');
                    } else {
                        const errorData = await response.json();
                        showError('Failed to update user: ' + (errorData.message || 'Unknown error'));
                    }
                });
                actionsCell.appendChild(saveButton);
                row.appendChild(actionsCell);

                usersList.appendChild(row);
            });
        } else {
            showError('Failed to fetch users');
        }
    }

    fetchUsers();
});
 */