(function () {
  const mobileForm = document.getElementById('mobile-form');
  const otpForm = document.getElementById('otp-form');
  const errorBox = document.getElementById('auth-error');
  const devHint = document.getElementById('dev-hint');
  const resendBtn = document.getElementById('resend-otp');

  let currentMobile = '';

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
  }
  function clearError() {
    errorBox.classList.add('hidden');
    errorBox.textContent = '';
  }

  async function requestOtp(mobile) {
    const res = await fetch('/api/v1/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: mobile })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return data;
  }

  mobileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    currentMobile = document.getElementById('mobileNumber').value.trim();

    try {
      const data = await requestOtp(currentMobile);
      mobileForm.classList.add('hidden');
      otpForm.classList.remove('hidden');
      devHint.textContent = data.devCode
        ? `Dev mode: your OTP is ${data.devCode} (also printed in the server console).`
        : 'OTP sent to your mobile number.';
    } catch (err) {
      showError(err.message);
    }
  });

  resendBtn.addEventListener('click', async () => {
    clearError();
    try {
      const data = await requestOtp(currentMobile);
      devHint.textContent = data.devCode
        ? `Dev mode: your OTP is ${data.devCode} (resent).`
        : 'OTP resent.';
    } catch (err) {
      showError(err.message);
    }
  });

  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const code = document.getElementById('code').value.trim();

    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: currentMobile, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      if (data.status === 'new_user') {
        window.location.href = `/register?mobile=${encodeURIComponent(currentMobile)}`;
      } else if (data.status === 'logged_in') {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      showError(err.message);
    }
  });
})();
