(function () {
  const form = document.getElementById('register-form');
  const errorBox = document.getElementById('register-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('hidden');

    const payload = {
      mobileNumber: document.getElementById('mobileNumber').value.trim(),
      fullName: document.getElementById('fullName').value.trim(),
      role: document.getElementById('role').value,
      designation: document.getElementById('designation').value.trim(),
      whatsappNumber: document.getElementById('whatsappNumber').value.trim(),
      villageId: document.getElementById('villageId').value
    };

    if (!payload.mobileNumber) {
      errorBox.textContent = 'Missing mobile number — please restart login from the OTP screen.';
      errorBox.classList.remove('hidden');
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      window.location.href = data.redirectUrl;
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove('hidden');
    }
  });
})();
