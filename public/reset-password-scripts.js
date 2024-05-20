document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordForm = document.getElementById('reset-password-form');
    const resetToken = document.getElementById('reset-token');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('reset-password').value;
        const token = resetToken.value;

        try {
            const response = await fetch('/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, password })
            });

            if (response.ok) {
                showError('Password has been reset successfully!');
            } else {
                const errorData = await response.json();
                showError('Failed to reset password: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error during password reset:', error);
            showError('Failed to reset password: ' + error.message);
        }
    });

    // Get the token from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    resetToken.value = token;
});
