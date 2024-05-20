document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('admin-login-form');
    const logoutButton = document.getElementById('logout-button');
    const usersTbody = document.getElementById('users-tbody');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const authContainer = document.getElementById('auth-container');
    const loggedInContainer = document.getElementById('logged-in-container');
    const editUserContainer = document.getElementById('edit-user-container');
    const editUserForm = document.getElementById('edit-user-form');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    let currentPage = 1;
    let totalPages = 1;
    let searchQuery = '';

    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    async function fetchUsers(page = 1, search = '') {
        try {
            const response = await fetch(`/admin/users?page=${page}&search=${search}`);
            if (response.ok) {
                const data = await response.json();
                usersTbody.innerHTML = '';
                data.users.forEach(user => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>
                            <button class="edit-button" data-id="${user._id}">Edit</button>
                            <button class="delete-button" data-id="${user._id}">Delete</button>
                        </td>
                    `;
                    usersTbody.appendChild(tr);
                });

                document.querySelectorAll('.edit-button').forEach(button => {
                    button.addEventListener('click', () => showEditUserForm(button.dataset.id));
                });

                document.querySelectorAll('.delete-button').forEach(button => {
                    button.addEventListener('click', () => deleteUser(button.dataset.id));
                });

                currentPage = data.currentPage;
                totalPages = data.totalPages;
                currentPageSpan.textContent = currentPage;
                totalPagesSpan.textContent = totalPages;

                prevPageButton.disabled = currentPage === 1;
                nextPageButton.disabled = currentPage === totalPages;
            } else {
                showError('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            showError('Error fetching users');
        }
    }

    function showEditUserForm(userId) {
        fetch(`/admin/users/${userId}`)
            .then(response => response.json())
            .then(user => {
                document.getElementById('edit-user-id').value = user._id;
                document.getElementById('edit-username').value = user.username;
                document.getElementById('edit-email').value = user.email;
                document.getElementById('edit-api-key').value = user.apiKey || '';
                document.getElementById('edit-role').value = user.role;
                editUserContainer.style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching user:', error);
                showError('Error fetching user details');
            });
    }

    editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('edit-user-id').value;
        const username = document.getElementById('edit-username').value;
        const email = document.getElementById('edit-email').value;
        const apiKey = document.getElementById('edit-api-key').value;
        const password = document.getElementById('edit-password').value;
        const role = document.getElementById('edit-role').value;

        try {
            const response = await fetch(`/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, apiKey, password, role })
            });

            if (response.ok) {
                editUserContainer.style.display = 'none';
                fetchUsers(currentPage, searchQuery);
            } else {
                showError('Failed to edit user');
            }
        } catch (error) {
            console.error('Error editing user:', error);
            showError('Error editing user');
        }
    });

    cancelEditButton.addEventListener('click', () => {
        editUserContainer.style.display = 'none';
    });

    async function deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch(`/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchUsers(currentPage, searchQuery);
            } else {
                showError('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showError('Error deleting user');
        }
    }

    async function checkAuthStatus() {
        const response = await fetch('/admin/auth-status');
        const data = await response.json();
        if (data.isAuthenticated) {
            authContainer.style.display = 'none';
            loggedInContainer.style.display = 'block';
            fetchUsers();
        } else {
            authContainer.style.display = 'block';
            loggedInContainer.style.display = 'none';
        }
    }

    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        const response = await fetch('/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            checkAuthStatus();
        } else {
            const errorData = await response.json();
            showError('Login failed: ' + (errorData.message || 'Unknown error'));
        }
    });

    logoutButton.addEventListener('click', async () => {
        const response = await fetch('/admin/logout');
        if (response.ok) {
            checkAuthStatus();
        } else {
            showError('Logout failed');
        }
    });

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            fetchUsers(currentPage - 1, searchQuery);
        }
    });

    nextPageButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            fetchUsers(currentPage + 1, searchQuery);
        }
    });

    searchButton.addEventListener('click', () => {
        searchQuery = searchInput.value;
        fetchUsers(1, searchQuery);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchQuery = searchInput.value;
            fetchUsers(1, searchQuery);
        }
    });

    checkAuthStatus();
});
