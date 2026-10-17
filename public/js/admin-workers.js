(function () {
  document.querySelectorAll('.verify-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      try {
        const res = await fetch(`/api/v1/admin/workers/${id}/verify`, { method: 'PATCH' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to verify');

        const row = document.getElementById(`row-${id}`);
        const statusCell = row.children[5];
        statusCell.innerHTML = '<span class="badge badge-resolved">Verified</span>';
        row.children[6].innerHTML = '';
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Verify';
        alert(err.message);
      }
    });
  });
})();
