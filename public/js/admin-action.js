(function () {
  const form = document.getElementById('action-form');
  const successBox = document.getElementById('action-success');
  const errorBox = document.getElementById('action-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successBox.classList.add('hidden');
    errorBox.classList.add('hidden');

    const id = form.dataset.id;
    const fd = new FormData(form);

    try {
      const res = await fetch(`/api/v1/admin/complaints/${id}/action`, {
        method: 'PATCH',
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      successBox.classList.remove('hidden');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove('hidden');
    }
  });
})();
