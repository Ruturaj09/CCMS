(function () {
  const form = document.getElementById('complaint-form');
  const photosInput = document.getElementById('photos');
  const photoPreview = document.getElementById('photo-preview');
  const errorBox = document.getElementById('submit-error');

  // ---- Photo preview (client-side, up to 3 images) ----
  photosInput.addEventListener('change', () => {
    photoPreview.innerHTML = '';
    const files = Array.from(photosInput.files).slice(0, 3);
    if (photosInput.files.length > 3) {
      errorBox.textContent = 'Only the first 3 selected photos will be uploaded (max 3 allowed).';
      errorBox.classList.remove('hidden');
    }
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        photoPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  // ---- Voice recording (native MediaRecorder, max 60s) ----
  const recordBtn = document.getElementById('record-btn');
  const recordStatus = document.getElementById('record-status');
  const playback = document.getElementById('voice-playback');
  let mediaRecorder, audioChunks = [], recordedBlob = null, recordTimer = null, seconds = 0;

  recordBtn.addEventListener('click', async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      seconds = 0;

      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        clearInterval(recordTimer);
        recordedBlob = new Blob(audioChunks, { type: 'audio/webm' });
        playback.src = URL.createObjectURL(recordedBlob);
        playback.classList.remove('hidden');
        recordBtn.textContent = '🎙️ Re-record';
        recordStatus.textContent = `Recorded ${seconds}s`;
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      recordBtn.textContent = '⏹ Stop Recording';
      recordStatus.textContent = 'Recording... 0s';
      recordTimer = setInterval(() => {
        seconds += 1;
        recordStatus.textContent = `Recording... ${seconds}s`;
        if (seconds >= 60) mediaRecorder.stop(); // enforce 60s max
      }, 1000);
    } catch (err) {
      recordStatus.textContent = 'Microphone access denied or unavailable.';
    }
  });

  // ---- GPS capture ----
  const captureBtn = document.getElementById('capture-location');
  const locationStatus = document.getElementById('location-status');
  captureBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      locationStatus.textContent = 'Geolocation not supported by this browser.';
      return;
    }
    locationStatus.textContent = 'Capturing location...';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        document.getElementById('latitude').value = pos.coords.latitude;
        document.getElementById('longitude').value = pos.coords.longitude;
        locationStatus.textContent = `Captured: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
      },
      () => { locationStatus.textContent = 'Unable to capture location. You can still submit without it.'; }
    );
  });

  // ---- Submit ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('hidden');

    const fd = new FormData();
    fd.append('category', document.getElementById('category').value);
    fd.append('title', document.getElementById('title').value);
    fd.append('description', document.getElementById('description').value);
    fd.append('urgency', document.getElementById('urgency').value);
    fd.append('landmark', document.getElementById('landmark').value);
    fd.append('latitude', document.getElementById('latitude').value);
    fd.append('longitude', document.getElementById('longitude').value);

    Array.from(photosInput.files).slice(0, 3).forEach((file) => fd.append('photos', file));
    if (recordedBlob) fd.append('voiceNote', recordedBlob, 'voice-note.webm');

    try {
      const res = await fetch('/api/v1/complaints/create', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit complaint');
      window.location.href = `/complaints/${data.complaintId}`;
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove('hidden');
    }
  });
})();
